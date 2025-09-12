use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Serialize, ToSchema)]
pub struct UserProfile {
    pub id: Uuid,
    pub username: String,
    pub email: String,
    pub created_at: DateTime<Utc>,
    pub last_login: Option<DateTime<Utc>>,
    /// Number of deployments created by this user
    pub deployment_count: i64,
    /// Number of API keys created by this user
    pub api_key_count: i64,
}

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct UpdateProfileRequest {
    /// New username (3-50 characters)
    #[validate(length(min = 3, max = 50))]
    pub username: Option<String>,
    /// New email address
    #[validate(email)]
    pub email: Option<String>,
}

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct ChangePasswordRequest {
    /// Current password for verification
    pub current_password: String,
    /// New password (minimum 8 characters)
    #[validate(length(min = 8))]
    pub new_password: String,
    /// Must match new_password
    pub confirm_new_password: String,
}