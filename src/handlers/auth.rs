use axum::{
    extract::{Path, Query, State},
    response::Json,
};
use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use utoipa::path;
use uuid::Uuid;
use validator::Validate;

use crate::{
    AppState,
    auth::{
        models::*,
        jwt::JwtManager,
        AuthUser,
    },
    error::AppError,
};

#[utoipa::path(
    post,
    path = "/v1/auth/register",
    request_body = RegisterRequest,
    responses(
        (status = 200, description = "User registered successfully", body = AuthResponse),
        (status = 400, description = "Bad request", body = ErrorResponse),
        (status = 409, description = "User already exists", body = ErrorResponse),
    ),
    tag = "Authentication"
)]
pub async fn register(
    State(state): State<AppState>,
    Json(payload): Json<RegisterRequest>,
) -> Result<Json<Value>, AppError> {
    payload.validate()?;
    if payload.password.len() < 8 {
        return Err(AppError::bad_request("Password must be at least 8 characters long"));
    }
    if payload.password != payload.confirm_password {
        return Err(AppError::bad_request("Passwords do not match"));
    }

    // Check if user already exists
    let existing_user = sqlx::query!(
        "SELECT id FROM users WHERE email = $1 OR username = $2",
        payload.email,
        payload.username
    )
    .fetch_optional(&state.db.pool)
    .await?;

    if existing_user.is_some() {
        return Err(AppError::conflict("User with this email or username already exists"));
    }

    // Hash password
    let password_hash = hash(&payload.password, DEFAULT_COST)?;

    // Create user
    let user_id = Uuid::new_v4();
    let now = Utc::now();

    sqlx::query!(
        r#"
        INSERT INTO users (id, username, email, password_hash, created_at, updated_at, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, true)
        "#,
        user_id,
        payload.username,
        payload.email,
        password_hash,
        now,
        now
    )
    .execute(&state.db.pool)
    .await?;

    let user = User {
        id: user_id,
        username: payload.username,
        email: payload.email,
        password_hash,
        created_at: now,
        updated_at: now,
        last_login: None,
        is_active: true,
    };

    Ok(Json(json!({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "created_at": user.created_at,
        "status": "active"
    })))
}

#[utoipa::path(
    post,
    path = "/v1/auth/login",
    request_body = LoginRequest,
    responses(
        (status = 200, description = "Login successful", body = AuthResponse),
        (status = 400, description = "Bad request", body = ErrorResponse),
        (status = 401, description = "Invalid credentials", body = ErrorResponse),
    ),
    tag = "Authentication"
)]
pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    payload.validate()?;

    // Find user by email
    let user = sqlx::query_as!(
        User,
        "SELECT * FROM users WHERE email = $1 AND is_active = true",
        payload.email
    )
    .fetch_optional(&state.db.pool)
    .await?
    .ok_or_else(|| AppError::auth("Invalid credentials"))?;

    // Verify password
    if !verify(&payload.password, &user.password_hash)? {
        return Err(AppError::auth("Invalid credentials"));
    }

    // Update last login
    sqlx::query!(
        "UPDATE users SET last_login = NOW() WHERE id = $1",
        user.id
    )
    .execute(&state.db.pool)
    .await?;

    // Generate tokens
    let jwt_manager = JwtManager::new(&state.config.jwt_secret, state.config.jwt_expires_in);
    let (access_token, expires_at) = jwt_manager.generate_access_token(user.id)?;
    let refresh_token = jwt_manager.generate_refresh_token(user.id)?;

    Ok(Json(AuthResponse {
        access_token,
        refresh_token,
        expires_at,
        user: user.to_user_info(),
    }))
}

#[utoipa::path(
    post,
    path = "/v1/auth/refresh",
    request_body = RefreshTokenRequest,
    responses(
        (status = 200, description = "Token refreshed successfully", body = RefreshTokenResponse),
        (status = 401, description = "Invalid refresh token", body = ErrorResponse),
    ),
    tag = "Authentication"
)]
pub async fn refresh_token(
    State(state): State<AppState>,
    Json(payload): Json<RefreshTokenRequest>,
) -> Result<Json<RefreshTokenResponse>, AppError> {
    let jwt_manager = JwtManager::new(&state.config.jwt_secret, state.config.jwt_expires_in);
    let claims = jwt_manager.verify_token(&payload.refresh_token)?;
    
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| AppError::auth("Invalid token"))?;

    let (access_token, expires_at) = jwt_manager.generate_access_token(user_id)?;

    Ok(Json(RefreshTokenResponse {
        access_token,
        expires_at,
    }))
}

#[utoipa::path(
    post,
    path = "/v1/auth/logout",
    responses(
        (status = 200, description = "Successfully logged out"),
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "Authentication"
)]
pub async fn logout(
    _user: AuthUser,
) -> Result<Json<Value>, AppError> {
    // In a production system, you might want to invalidate the token
    // by maintaining a blacklist in Redis
    Ok(Json(json!({
        "message": "Successfully logged out"
    })))
}

#[derive(Deserialize, utoipa::ToSchema, utoipa::IntoParams)]
pub struct PaginationQuery {
    /// Page number (default: 1)
    #[serde(default = "default_page")]
    pub page: u32,
    /// Items per page (default: 10, max: 100)
    #[serde(default = "default_limit")]
    pub limit: u32,
}

fn default_page() -> u32 { 1 }
fn default_limit() -> u32 { 10 }

#[utoipa::path(
    post,
    path = "/v1/api-keys",
    request_body = CreateApiKeyRequest,
    responses(
        (status = 200, description = "API key created successfully", body = ApiKeyResponse),
        (status = 400, description = "Bad request", body = ErrorResponse),
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "API Keys"
)]
pub async fn create_api_key(
    State(state): State<AppState>,
    user: AuthUser,
    Json(payload): Json<CreateApiKeyRequest>,
) -> Result<Json<ApiKeyResponse>, AppError> {
    payload.validate()?;

    let api_key_id = Uuid::new_v4();
    let now = Utc::now();
    
    // Generate API key
    let api_key_value = format!("{}{}", state.config.api_key_prefix, Uuid::new_v4());
    let key_hash = hash(&api_key_value, DEFAULT_COST)?;
    let key_prefix = api_key_value[..state.config.api_key_prefix.len()].to_string();

    sqlx::query!(
        r#"
        INSERT INTO api_keys (id, user_id, name, description, key_hash, key_prefix, created_at, expires_at, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
        "#,
        api_key_id,
        user.user_id,
        payload.name,
        payload.description,
        key_hash,
        key_prefix,
        now,
        payload.expires_at
    )
    .execute(&state.db.pool)
    .await?;

    Ok(Json(ApiKeyResponse {
        id: api_key_id,
        name: payload.name,
        description: payload.description,
        api_key: api_key_value,
        created_at: now,
        expires_at: payload.expires_at,
        last_used: None,
    }))
}

#[utoipa::path(
    get,
    path = "/v1/api-keys",
    params(
        PaginationQuery
    ),
    responses(
        (status = 200, description = "API keys retrieved successfully", body = ApiKeyListResponse),
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "API Keys"
)]
pub async fn list_api_keys(
    State(state): State<AppState>,
    user: AuthUser,
    Query(pagination): Query<PaginationQuery>,
) -> Result<Json<ApiKeyListResponse>, AppError> {
    let limit = pagination.limit.min(100) as i64;
    let offset = ((pagination.page - 1) * pagination.limit) as i64;

    let api_keys = sqlx::query_as!(
        ApiKeyListItem,
        r#"
        SELECT id, name, description, created_at, expires_at, last_used
        FROM api_keys 
        WHERE user_id = $1 AND is_active = true
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
        "#,
        user.user_id,
        limit,
        offset
    )
    .fetch_all(&state.db.pool)
    .await?;

    let total = sqlx::query!(
        "SELECT COUNT(*) as count FROM api_keys WHERE user_id = $1 AND is_active = true",
        user.user_id
    )
    .fetch_one(&state.db.pool)
    .await?
    .count
    .unwrap_or(0) as u64;

    let total_pages = ((total as f64) / (pagination.limit as f64)).ceil() as u32;

    Ok(Json(ApiKeyListResponse {
        api_keys,
        pagination: PaginationInfo {
            page: pagination.page,
            limit: pagination.limit,
            total,
            total_pages,
        },
    }))
}

#[utoipa::path(
    delete,
    path = "/v1/api-keys/{key_id}",
    params(
        ("key_id" = Uuid, Path, description = "API key ID")
    ),
    responses(
        (status = 200, description = "API key revoked successfully"),
        (status = 404, description = "API key not found", body = ErrorResponse),
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "API Keys"
)]
pub async fn revoke_api_key(
    State(state): State<AppState>,
    user: AuthUser,
    Path(key_id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let result = sqlx::query!(
        "UPDATE api_keys SET is_active = false WHERE id = $1 AND user_id = $2",
        key_id,
        user.user_id
    )
    .execute(&state.db.pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::not_found("API key"));
    }

    Ok(Json(json!({
        "message": "API key revoked successfully"
    })))
}