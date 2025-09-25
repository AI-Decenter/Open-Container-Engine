use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use utoipa::ToSchema;
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Clone, FromRow, Serialize, Deserialize, ToSchema)]
pub struct User {
    pub id: Uuid,
    pub username: String,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub last_login: Option<DateTime<Utc>>,
    pub is_active: bool,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize, ToSchema)]
pub struct ApiKey {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    #[serde(skip_serializing)]
    pub key_hash: String,
    pub key_prefix: String,
    pub created_at: DateTime<Utc>,
    pub expires_at: Option<DateTime<Utc>>,
    pub last_used: Option<DateTime<Utc>>,
    pub is_active: bool,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct PasswordResetToken {
    pub id: Uuid,
    pub user_id: Uuid,
    pub token: String,
    pub expires_at: DateTime<Utc>,
    pub used_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct RegisterRequest {
    /// Username must be between 3 and 50 characters
    #[validate(length(min = 3, max = 50))]
    pub username: String,
    /// Valid email address
    #[validate(email)]
    pub email: String,
    /// Password must be at least 8 characters
    // #[validate(length(min = 8))]
    pub password: String,
    /// Must match the password field
    pub confirm_password: String,
}

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct LoginRequest {
    /// Valid email address
    #[validate(email)]
    pub email: String,
    /// User password
    pub password: String,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct AuthResponse {
    /// JWT access token
    pub access_token: String,
    /// JWT refresh token
    pub refresh_token: String,
    /// Token expiration timestamp
    pub expires_at: DateTime<Utc>,
    /// User information
    pub user: UserInfo,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct UserInfo {
    pub id: Uuid,
    pub username: String,
    pub email: String,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct RefreshTokenRequest {
    /// JWT refresh token
    pub refresh_token: String,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct RefreshTokenResponse {
    /// New JWT access token
    pub access_token: String,
    /// New token expiration timestamp
    pub expires_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct CreateApiKeyRequest {
    /// API key name (1-100 characters)
    #[validate(length(min = 1, max = 100))]
    pub name: String,
    /// Optional description (max 255 characters)
    #[validate(length(max = 255))]
    pub description: Option<String>,
    /// Optional expiration date
    pub expires_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct ApiKeyResponse {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    /// The actual API key (only shown once during creation)
    pub api_key: String,
    pub created_at: DateTime<Utc>,
    pub expires_at: Option<DateTime<Utc>>,
    pub last_used: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct ApiKeyListItem {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
    pub expires_at: Option<DateTime<Utc>>,
    pub last_used: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct ApiKeyListResponse {
    pub api_keys: Vec<ApiKeyListItem>,
    pub pagination: PaginationInfo,
}

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct ForgotPasswordRequest {
    /// Valid email address
    #[validate(email)]
    pub email: String,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct ForgotPasswordResponse {
    pub message: String,
}

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct ResetPasswordRequest {
    /// Password reset token
    pub token: String,
    /// New password must be at least 8 characters
    #[validate(length(min = 8))]
    pub new_password: String,
    /// Must match the new password field
    pub confirm_password: String,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct ResetPasswordResponse {
    pub message: String,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct PaginationInfo {
    pub page: u32,
    pub limit: u32,
    pub total: u64,
    pub total_pages: u32,
}

impl User {
    pub fn to_user_info(&self) -> UserInfo {
        UserInfo {
            id: self.id,
            username: self.username.clone(),
            email: self.email.clone(),
        }
    }
}