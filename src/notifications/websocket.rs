// src/notifications/websocket.rs
use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Query, State,
    },
    response::Response,
};
use futures::{sink::SinkExt, stream::StreamExt};
use serde::Deserialize;
use serde_json;
use tracing::{error, warn};
use uuid::Uuid;

use crate::{
    auth::jwt::JwtManager,
    error::AppError,
    AppState,
};

use super::manager::NotificationManager;

#[derive(Debug, Deserialize)]
pub struct WebSocketQuery {
    pub token: String,
}

pub async fn websocket_handler(
    ws: WebSocketUpgrade,
    Query(query): Query<WebSocketQuery>,
    State(state): State<AppState>,
) -> Result<Response, AppError> {
    // Verify JWT token and extract user_id
    let jwt_manager = JwtManager::new(&state.config.jwt_secret, state.config.jwt_expires_in);
    let user_id = jwt_manager.extract_user_id(&query.token)?;

    // User connecting via WebSocket

    Ok(ws.on_upgrade(move |socket| {
        handle_socket(socket, user_id, state.notification_manager)
    }))
}

async fn handle_socket(socket: WebSocket, user_id: Uuid, notification_manager: NotificationManager) {
    // WebSocket connection established

    // Add user to notification manager and get receiver
    let mut receiver = notification_manager.add_connection(user_id).await;

    // Split the socket into sender and receiver
    let (mut sender, mut socket_receiver) = socket.split();

    // Spawn task to handle incoming messages from client
    let mut send_task = tokio::spawn(async move {
        // Listen for notifications from the notification manager
        while let Ok(msg) = receiver.recv().await {
            // Sending notification to user
            
            match serde_json::to_string(&msg) {
                Ok(json_str) => {
                    if sender.send(Message::Text(json_str)).await.is_err() {
                        warn!("Failed to send WebSocket message to user {}", user_id);
                        break;
                    }
                }
                Err(e) => {
                    error!("Failed to serialize notification: {}", e);
                }
            }
        }
    });

    // Spawn task to handle incoming WebSocket messages
    let mut recv_task = tokio::spawn(async move {
        while let Some(msg) = socket_receiver.next().await {
            match msg {
                Ok(Message::Text(text)) => {
                    // Received text message from user
                    // Handle ping/pong or other client messages if needed
                    if text == "ping" {
                        // Client is checking connection
                        // Ping received from user
                    }
                }
                Ok(Message::Binary(_)) => {
                    // Received binary message from user
                }
                Ok(Message::Close(c)) => {
                    if let Some(_cf) = c {
                        // User sent close with code and reason
                    } else {
                        // User sent close message
                    }
                    break;
                }
                Ok(Message::Pong(_)) => {
                    // Received pong from user
                }
                Ok(Message::Ping(_)) => {
                    // Received ping from user
                }
                Err(e) => {
                    error!("WebSocket error for user {}: {}", user_id, e);
                    break;
                }
            }
        }
    });

    // Wait for either task to finish
    tokio::select! {
        _ = (&mut send_task) => {
            // Send task completed
            recv_task.abort();
        },
        _ = (&mut recv_task) => {
            // Receive task completed
            send_task.abort();
        }
    }

    // Clean up connection
    notification_manager.remove_connection(&user_id).await;
    // WebSocket connection closed
}

// Health check endpoint for WebSocket
pub async fn websocket_health() -> Result<String, AppError> {
    Ok("WebSocket service is healthy".to_string())
}
