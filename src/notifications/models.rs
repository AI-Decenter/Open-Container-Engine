// src/notifications/models.rs
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum NotificationType {
    #[serde(rename = "deployment_status_changed")]
    DeploymentStatusChanged {
        deployment_id: Uuid,
        status: String,
        url: Option<String>,
        error_message: Option<String>,
    },
    #[serde(rename = "deployment_created")]
    DeploymentCreated {
        deployment_id: Uuid,
        app_name: String,
    },
    #[serde(rename = "deployment_deleted")]
    DeploymentDeleted {
        deployment_id: Uuid,
        app_name: String,
    },
    #[serde(rename = "deployment_scaled")]
    DeploymentScaled {
        deployment_id: Uuid,
        old_replicas: i32,
        new_replicas: i32,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Notification {
    pub id: Uuid,
    pub user_id: Uuid,
    pub notification_type: NotificationType,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub read: bool,
}

impl Notification {
    pub fn new(user_id: Uuid, notification_type: NotificationType) -> Self {
        Self {
            id: Uuid::new_v4(),
            user_id,
            notification_type,
            timestamp: chrono::Utc::now(),
            read: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSocketMessage {
    pub id: Uuid,
    #[serde(rename = "type")]
    pub message_type: String,
    pub data: serde_json::Value,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

impl WebSocketMessage {
    pub fn from_notification(notification: &Notification) -> Self {
        let message_type = match &notification.notification_type {
            NotificationType::DeploymentStatusChanged { .. } => "deployment_status_changed",
            NotificationType::DeploymentCreated { .. } => "deployment_created",
            NotificationType::DeploymentDeleted { .. } => "deployment_deleted",
            NotificationType::DeploymentScaled { .. } => "deployment_scaled",
        };

        Self {
            id: notification.id,
            message_type: message_type.to_string(),
            data: serde_json::to_value(&notification.notification_type).unwrap_or_default(),
            timestamp: notification.timestamp,
        }
    }
}
