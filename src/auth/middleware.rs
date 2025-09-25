use axum::{
    extract::FromRequestParts,
    http::{request::Parts, HeaderMap},
    async_trait,
};
use uuid::Uuid;

use crate::{AppState, error::AppError, auth::jwt::JwtManager};

pub struct AuthUser {
    pub user_id: Uuid,
}

#[async_trait]
impl FromRequestParts<AppState> for AuthUser {
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &AppState) -> Result<Self, Self::Rejection> {
        let headers = &parts.headers;
        let token = extract_token_from_headers(headers)?;

        // Check if it's an API key or JWT token
        tracing::debug!("Token: {}, API prefix: {}", token, state.config.api_key_prefix);
        if token.starts_with(&state.config.api_key_prefix) {
            // API Key authentication
            let user_id = verify_api_key(&state, &token).await?;
            Ok(AuthUser { user_id })
        } else {
            // JWT token authentication
            let jwt_manager = JwtManager::new(&state.config.jwt_secret, state.config.jwt_expires_in);
            let user_id = jwt_manager.extract_user_id(&token)?;
            Ok(AuthUser { user_id })
        }
    }
}

fn extract_token_from_headers(headers: &HeaderMap) -> Result<String, AppError> {
    let auth_header = headers
        .get("authorization")
        .ok_or_else(|| AppError::auth("Missing authorization header"))?
        .to_str()
        .map_err(|_| AppError::auth("Invalid authorization header"))?;

    if let Some(token) = auth_header.strip_prefix("Bearer ") {
        Ok(token.to_string())
    } else {
        Err(AppError::auth("Invalid authorization header format"))
    }
}

pub async fn verify_api_key(state: &AppState, api_key: &str) -> Result<Uuid, AppError> {
    tracing::debug!("Verifying API key: {}", api_key);
    // Extract prefix to find the API key
    let prefix = &api_key[..state.config.api_key_prefix.len().min(api_key.len())];
    
    let results = sqlx::query!(
        r#"
        SELECT user_id, key_hash FROM api_keys 
        WHERE key_prefix = $1 AND is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
        ORDER BY created_at DESC
        LIMIT 20
        "#,
        prefix
    )
    .fetch_all(&state.db.pool)
    .await?;

    tracing::debug!("Found {} API keys with prefix: {}", results.len(), prefix);

    for (index, record) in results.iter().enumerate() {
        tracing::debug!("Checking API key {}/{} for user: {}", index + 1, results.len(), record.user_id);
        // Verify the API key hash - this is expensive so we limit iterations
        match bcrypt::verify(api_key, &record.key_hash) {
            Ok(true) => {
                tracing::debug!("API key verified successfully for user: {}", record.user_id);
                // Update last_used timestamp
                sqlx::query!(
                    "UPDATE api_keys SET last_used = NOW() WHERE user_id = $1",
                    record.user_id
                )
                .execute(&state.db.pool)
                .await?;

                return Ok(record.user_id);
            }
            Ok(false) => {
                tracing::debug!("API key verification failed for user: {}", record.user_id);
                continue;
            }
            Err(e) => {
                tracing::warn!("Bcrypt verification error: {}", e);
                continue;
            }
        }
    }
    
    tracing::debug!("No matching API key found after checking {} candidates", results.len());
    Err(AppError::auth("Invalid API key "))
}