use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use utoipa::ToSchema;
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Clone, FromRow, Serialize, Deserialize, ToSchema)]
pub struct UserWebhook {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub url: String,
    pub secret: Option<String>,
    pub is_active: bool,
    pub events: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct CreateWebhookRequest {
    /// Webhook name (1-100 characters)
    #[validate(length(min = 1, max = 100))]
    pub name: String,
    /// Webhook URL
    #[validate(url)]
    pub url: String,
    /// Optional secret for webhook signature
    #[validate(length(max = 255))]
    pub secret: Option<String>,
    /// Events to subscribe to
    pub events: Vec<WebhookEvent>,
}

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct UpdateWebhookRequest {
    /// Webhook name
    #[validate(length(min = 1, max = 100))]
    pub name: Option<String>,
    /// Webhook URL
    #[validate(url)]
    pub url: Option<String>,
    /// Secret for webhook signature
    #[validate(length(max = 255))]
    pub secret: Option<String>,
    /// Whether webhook is active
    pub is_active: Option<bool>,
    /// Events to subscribe to
    pub events: Option<Vec<WebhookEvent>>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum WebhookEvent {
    DeploymentStarted,
    DeploymentCompleted,
    DeploymentFailed,
    DeploymentDeleted,
    All,
}

impl WebhookEvent {
    pub fn as_str(&self) -> &'static str {
        match self {
            WebhookEvent::DeploymentStarted => "deployment_started",
            WebhookEvent::DeploymentCompleted => "deployment_completed", 
            WebhookEvent::DeploymentFailed => "deployment_failed",
            WebhookEvent::DeploymentDeleted => "deployment_deleted",
            WebhookEvent::All => "all",
        }
    }
}

#[derive(Debug, Serialize, ToSchema)]
pub struct WebhookResponse {
    pub id: Uuid,
    pub name: String,
    pub url: String,
    pub is_active: bool,
    pub events: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct WebhookListResponse {
    pub webhooks: Vec<WebhookResponse>,
    pub total: u64,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct WebhookTestResponse {
    pub success: bool,
    pub status_code: Option<u16>,
    pub message: String,
    pub response_time_ms: u64,
}
