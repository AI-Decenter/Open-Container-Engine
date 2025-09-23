// src/handlers/notifications.rs
use axum::{
    extract::{Query, State},
    response::Json,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use uuid::Uuid;

use crate::{
    auth::AuthUser,
    error::AppError,
    notifications::NotificationType,
    AppState,
};

#[derive(Debug, Deserialize)]
pub struct TestNotificationQuery {
    pub notification_type: Option<String>,
    pub deployment_id: Option<Uuid>,
}

#[derive(Debug, Serialize)]
pub struct NotificationStatsResponse {
    pub connected_users: usize,
    pub message: String,
}

/// Test endpoint to send notifications (for development/testing)
pub async fn send_test_notification(
    State(state): State<AppState>,
    user: AuthUser,
    Query(query): Query<TestNotificationQuery>,
) -> Result<Json<Value>, AppError> {
    let notification_type = match query.notification_type.as_deref() {
        Some("deployment_created") => NotificationType::DeploymentCreated {
            deployment_id: query.deployment_id.unwrap_or_else(Uuid::new_v4),
            app_name: "test-app".to_string(),
        },
        Some("deployment_success") => NotificationType::DeploymentStatusChanged {
            deployment_id: query.deployment_id.unwrap_or_else(Uuid::new_v4),
            status: "running".to_string(),
            url: Some("https://test-app.container-engine.app".to_string()),
            error_message: None,
        },
        Some("deployment_failed") => NotificationType::DeploymentStatusChanged {
            deployment_id: query.deployment_id.unwrap_or_else(Uuid::new_v4),
            status: "failed".to_string(),
            url: None,
            error_message: Some("Test deployment failure".to_string()),
        },
        _ => NotificationType::DeploymentStatusChanged {
            deployment_id: query.deployment_id.unwrap_or_else(Uuid::new_v4),
            status: "deploying".to_string(),
            url: None,
            error_message: None,
        },
    };

    state.notification_manager
        .send_to_user(user.user_id, notification_type)
        .await;

    Ok(Json(json!({
        "success": true,
        "message": "Test notification sent",
        "user_id": user.user_id
    })))
}

/// Get WebSocket connection statistics
pub async fn get_notification_stats(
    State(state): State<AppState>,
    _user: AuthUser,
) -> Result<Json<NotificationStatsResponse>, AppError> {
    let connected_users = state.notification_manager.connected_users_count().await;

    Ok(Json(NotificationStatsResponse {
        connected_users,
        message: format!("WebSocket service is running with {} connected users", connected_users),
    }))
}
