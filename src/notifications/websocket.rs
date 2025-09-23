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
use tracing::{debug, error, info, warn};
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

    info!("User {} connecting via WebSocket", user_id);

    Ok(ws.on_upgrade(move |socket| {
        handle_socket(socket, user_id, state.notification_manager)
    }))
}

async fn handle_socket(socket: WebSocket, user_id: Uuid, notification_manager: NotificationManager) {
    info!("WebSocket connection established for user {}", user_id);

    // Add user to notification manager and get receiver
    let mut receiver = notification_manager.add_connection(user_id).await;

    // Split the socket into sender and receiver
    let (mut sender, mut socket_receiver) = socket.split();

    // Spawn task to handle incoming messages from client
    let mut send_task = tokio::spawn(async move {
        // Listen for notifications from the notification manager
        while let Ok(msg) = receiver.recv().await {
            debug!("Sending notification to user {}: {:?}", user_id, msg);
            
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
                    debug!("Received text message from user {}: {}", user_id, text);
                    // Handle ping/pong or other client messages if needed
                    if text == "ping" {
                        // Client is checking connection
                        debug!("Ping received from user {}", user_id);
                    }
                }
                Ok(Message::Binary(_)) => {
                    debug!("Received binary message from user {}", user_id);
                }
                Ok(Message::Close(c)) => {
                    if let Some(cf) = c {
                        info!(
                            "User {} sent close with code {} and reason `{}`",
                            user_id, cf.code, cf.reason
                        );
                    } else {
                        info!("User {} sent close message", user_id);
                    }
                    break;
                }
                Ok(Message::Pong(_)) => {
                    debug!("Received pong from user {}", user_id);
                }
                Ok(Message::Ping(_)) => {
                    debug!("Received ping from user {}", user_id);
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
            debug!("Send task completed for user {}", user_id);
            recv_task.abort();
        },
        _ = (&mut recv_task) => {
            debug!("Receive task completed for user {}", user_id);
            send_task.abort();
        }
    }

    // Clean up connection
    notification_manager.remove_connection(&user_id).await;
    info!("WebSocket connection closed for user {}", user_id);
}

// Health check endpoint for WebSocket
pub async fn websocket_health() -> Result<String, AppError> {
    Ok("WebSocket service is healthy".to_string())
}
