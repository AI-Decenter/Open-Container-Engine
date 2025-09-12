use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use thiserror::Error;
use utoipa::ToSchema;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    
    #[error("Redis error: {0}")]
    Redis(#[from] redis::RedisError),
    
    #[error("Authentication error: {0}")]
    Auth(String),
    
    #[error("Validation error: {0}")]
    Validation(#[from] validator::ValidationErrors),
    
    #[error("Not found: {0}")]
    NotFound(String),
    
    #[error("Conflict: {0}")]
    Conflict(String),
    
    #[error("Bad request: {0}")]
    BadRequest(String),
    
    #[error("Forbidden: {0}")]
    Forbidden(String),
    
    #[error("Internal server error: {0}")]
    Internal(String),
    
    #[error("JWT error: {0}")]
    Jwt(#[from] jsonwebtoken::errors::Error),
    
    #[error("Bcrypt error: {0}")]
    Bcrypt(#[from] bcrypt::BcryptError),
    
    #[error("Kubernetes error: {0}")]
    Kubernetes(#[from] kube::Error),
    
    #[error("HTTP client error: {0}")]
    HttpClient(#[from] reqwest::Error),
    
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
}

/// Standard error response
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct ErrorResponse {
    pub error: ErrorDetails,
}

/// Error details
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct ErrorDetails {
    /// Error code
    pub code: String,
    /// Error message
    pub message: String,
}

/// Validation error response
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct ValidationErrorResponse {
    pub error: ValidationErrorDetails,
}

/// Validation error details
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct ValidationErrorDetails {
    /// Error code
    pub code: String,
    /// Error message
    pub message: String,
    /// Field-specific validation errors
    pub fields: Option<serde_json::Value>,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_message, error_code) = match &self {
            AppError::Database(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Database error occurred".to_string(),
                "DATABASE_ERROR"
            ),
            AppError::Redis(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Cache error occurred".to_string(),
                "CACHE_ERROR"
            ),
            AppError::Auth(msg) => (
                StatusCode::UNAUTHORIZED,
                msg.clone(),
                "AUTHENTICATION_ERROR"
            ),
            AppError::Validation(_) => (
                StatusCode::BAD_REQUEST,
                "Validation failed".to_string(),
                "VALIDATION_ERROR"
            ),
            AppError::NotFound(msg) => (
                StatusCode::NOT_FOUND,
                msg.clone(),
                "NOT_FOUND"
            ),
            AppError::Conflict(msg) => (
                StatusCode::CONFLICT,
                msg.clone(),
                "CONFLICT"
            ),
            AppError::BadRequest(msg) => (
                StatusCode::BAD_REQUEST,
                msg.clone(),
                "BAD_REQUEST"
            ),
            AppError::Forbidden(msg) => (
                StatusCode::FORBIDDEN,
                msg.clone(),
                "FORBIDDEN"
            ),
            AppError::Internal(msg) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                msg.clone(),
                "INTERNAL_ERROR"
            ),
            AppError::Jwt(_) => (
                StatusCode::UNAUTHORIZED,
                "Invalid token".to_string(),
                "INVALID_TOKEN"
            ),
            AppError::Bcrypt(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Password hashing error".to_string(),
                "PASSWORD_HASH_ERROR"
            ),
            AppError::Kubernetes(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Kubernetes operation failed".to_string(),
                "KUBERNETES_ERROR"
            ),
            AppError::HttpClient(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "External service error".to_string(),
                "HTTP_CLIENT_ERROR"
            ),
            AppError::Serialization(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Data serialization error".to_string(),
                "SERIALIZATION_ERROR"
            ),
        };

        let body = Json(json!({
            "error": {
                "code": error_code,
                "message": error_message,
            }
        }));

        (status, body).into_response()
    }
}

// Convenience constructors
impl AppError {
    pub fn not_found(resource: &str) -> Self {
        AppError::NotFound(format!("{} not found", resource))
    }

    pub fn conflict(resource: &str) -> Self {
        AppError::Conflict(format!("{} already exists", resource))
    }

    pub fn bad_request(message: &str) -> Self {
        AppError::BadRequest(message.to_string())
    }

    pub fn forbidden(message: &str) -> Self {
        AppError::Forbidden(message.to_string())
    }

    pub fn internal(message: &str) -> Self {
        AppError::Internal(message.to_string())
    }

    pub fn auth(message: &str) -> Self {
        AppError::Auth(message.to_string())
    }
}