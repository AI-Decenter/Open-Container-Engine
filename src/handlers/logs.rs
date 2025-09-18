// src/handlers/logs.rs

use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Path, Query, State,
    },
    response::Response,
};
use futures::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::{error, info, warn};
use uuid::Uuid;

use crate::{AppError, AppState};
use crate::auth::{AuthUser, jwt::JwtManager}; 
use crate::services::kubernetes::KubernetesService;

#[derive(Deserialize)]
pub struct LogsQuery {
    pub tail: Option<i64>,
    pub follow: Option<bool>,
    pub token: Option<String>, // Add token for WebSocket auth
}

#[derive(Serialize)]
pub struct LogsResponse {
    pub logs: String,
}

/// WebSocket endpoint for streaming logs (with token authentication)
pub async fn ws_logs_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
    Path(deployment_id): Path<Uuid>,
    Query(query): Query<LogsQuery>,
) -> Response {
    let state = Arc::new(state);
    ws.on_upgrade(move |socket| handle_socket(socket, state, deployment_id, query))
}



async fn handle_socket(
    socket: WebSocket,
    state: Arc<AppState>,
    deployment_id: Uuid,
    query: LogsQuery,
) {
    // Extract token before using query elsewhere
    let token = query.token.clone();
    
    // Authenticate user via token first, before splitting the socket
    let user_id = match authenticate_websocket_user(&state, token).await {
        Ok(user_id) => user_id,
        Err(e) => {
            error!("WebSocket authentication failed: {}", e);
            let (mut sender, _) = socket.split();
            let _ = sender
                .send(Message::Text(format!("Authentication failed: {}", e)))
                .await;
            let _ = sender.send(Message::Close(None)).await;
            return;
        }
    };

    // Send initial connection message and proceed with authenticated user
    let (mut sender, _) = socket.split();
    let _ = sender
        .send(Message::Text("Connected to log stream".to_string()))
        .await;

    // Call the internal function with the split sender
    handle_socket_with_user_internal(sender, state, deployment_id, query, user_id).await;
}

async fn handle_socket_with_user_internal(
    mut sender: futures::stream::SplitSink<WebSocket, Message>,
    state: Arc<AppState>,
    deployment_id: Uuid,
    query: LogsQuery,
    user_id: Uuid,
) {
    // Verify deployment belongs to user
    match verify_deployment_ownership(&state, deployment_id, user_id).await {
        Ok(false) => {
            error!("User {} does not own deployment {}", user_id, deployment_id);
            let _ = sender
                .send(Message::Text("Error: Deployment not found or access denied".to_string()))
                .await;
            let _ = sender.send(Message::Close(None)).await;
            return;
        }
        Err(e) => {
            error!("Failed to verify deployment ownership: {}", e);
            let _ = sender
                .send(Message::Text("Error: Failed to verify deployment access".to_string()))
                .await;
            let _ = sender.send(Message::Close(None)).await;
            return;
        }
        Ok(true) => {} // Continue
    }

    let k8s_service = match KubernetesService::for_deployment(&deployment_id, &user_id).await {
        Ok(service) => service,
        Err(e) => {
            error!("Failed to create K8s service for deployment {} (user {}): {}", deployment_id, user_id, e);
            let _ = sender
                .send(Message::Text(format!("Error: Failed to connect to Kubernetes: {}", e)))
                .await;
            let _ = sender.send(Message::Close(None)).await;
            return;
        }
    };

    // Start streaming logs
    match k8s_service.stream_logs_realtime(&deployment_id, query.tail).await {
        Ok(mut log_stream) => {
            info!("Started log stream for deployment: {} (user: {})", deployment_id, user_id);

            // Send initial logs from stream
            let mut line_count = 0;
            while let Some(result) = log_stream.next().await {
                match result {
                    Ok(bytes) => {
                        let text = String::from_utf8_lossy(&bytes);
                        if let Err(e) = sender.send(Message::Text(text.into_owned())).await {
                            error!("Failed to send log: {}", e);
                            break;
                        }
                        line_count += 1;
                    }
                    Err(e) => {
                        error!("Error reading log stream: {}", e);
                        let _ = sender.send(Message::Text(format!("Error: {}", e))).await;
                        break;
                    }
                }
            }

            // If we have logs, keep connection open for potential new logs
            if line_count > 0 {
                let _ = sender.send(Message::Text("--- End of current logs ---".to_string())).await;
                
                // Keep WebSocket connection alive for potential future logs
                // This is a simple keepalive mechanism
                let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(30));
                for _ in 0..10 { // Keep alive for 5 minutes
                    interval.tick().await;
                    if sender.send(Message::Ping(vec![])).await.is_err() {
                        break;
                    }
                }
            }

            // Cleanup
            let _ = sender.send(Message::Text("Log stream ended".to_string())).await;
            let _ = sender.send(Message::Close(None)).await;
            info!("Log stream ended for deployment: {}", deployment_id);
        }
        Err(e) => {
            error!("Failed to start log stream: {}", e);
            let _ = sender.send(Message::Text(format!("Error: {}", e))).await;
            let _ = sender.send(Message::Close(None)).await;
        }
    }
}



// Authentication function for WebSocket using your existing JWT system
async fn authenticate_websocket_user(
    state: &AppState,
    token: Option<String>,
) -> Result<Uuid, AppError> {
    info!("Authenticating WebSocket user with token: {:?}", token.as_ref().map(|t| &t[..10]));
    
    let token = token.ok_or_else(|| {
        error!("No token provided for WebSocket authentication");
        AppError::auth("Token required")
    })?;
    
    // Remove "Bearer " prefix if present
    let token = token.strip_prefix("Bearer ").unwrap_or(&token);
    info!("Processing token (first 10 chars): {}", &token[..10.min(token.len())]);
    
    // Use your existing JWT verification logic
    let jwt_manager = JwtManager::new(&state.config.jwt_secret, state.config.jwt_expires_in);
    let claims = jwt_manager.verify_token(token)
        .map_err(|e| {
            error!("JWT verification failed: {}", e);
            e
        })?;
    
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|e| {
            error!("Invalid UUID in token claims: {}", e);
            AppError::auth("Invalid token format")
        })?;
    
    info!("Extracted user_id from token: {}", user_id);
    
    // Verify user exists and is active in database
    let user_exists = sqlx::query!(
        "SELECT id FROM users WHERE id = $1 AND is_active = true",
        user_id
    )
    .fetch_optional(&state.db.pool)
    .await
    .map_err(|e| {
        error!("Database error during user verification: {}", e);
        AppError::internal(&format!("Database error: {}", e))
    })?;
    
    match user_exists {
        Some(_) => {
            info!("User {} authenticated successfully for WebSocket", user_id);
            Ok(user_id)
        }
        None => {
            error!("User {} not found or inactive", user_id);
            Err(AppError::auth("User not found or inactive"))
        }
    }
}

/// Verify that the deployment belongs to the user
async fn verify_deployment_ownership(
    state: &AppState,
    deployment_id: Uuid,
    user_id: Uuid,
) -> Result<bool, AppError> {
    let result = sqlx::query!(
        "SELECT user_id FROM deployments WHERE id = $1",
        deployment_id
    )
    .fetch_optional(&state.db.pool)
    .await
    .map_err(|e| AppError::internal(&format!("Database error: {}", e)))?;

    match result {
        Some(record) => Ok(record.user_id == user_id),
        None => Ok(false), // Deployment not found
    }
}

/// HTTP endpoint for getting logs (non-streaming)
pub async fn get_logs_handler(
    State(state): State<AppState>,
    Path(deployment_id): Path<Uuid>,
    Query(query): Query<LogsQuery>,
    user: AuthUser, 
) -> Result<axum::response::Json<LogsResponse>, AppError> {
    // Verify deployment ownership
    if !verify_deployment_ownership(&state, deployment_id, user.user_id).await? {
        return Err(AppError::not_found("Deployment not found"));
    }

    let k8s_service = KubernetesService::for_deployment(&deployment_id, &user.user_id).await?;

    // Use the new get_logs method instead of stream_logs for HTTP endpoint
    let logs = k8s_service.get_logs(&deployment_id, query.tail).await?;

    Ok(axum::response::Json(LogsResponse { logs }))
}
