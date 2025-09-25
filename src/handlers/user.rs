use axum::{
    extract::State,
    response::Json,
};
use bcrypt::{hash, verify, DEFAULT_COST};
use serde_json::{json, Value};
use validator::Validate;

use crate::{
    AppState,
    auth::AuthUser,
    error::AppError,
    user::models::*,
};

#[utoipa::path(
    get,
    path = "/v1/user/profile",
    responses(
        (status = 200, description = "User profile retrieved successfully", body = UserProfile),
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "User"
)]
pub async fn get_profile(
    State(state): State<AppState>,
    user: AuthUser,
) -> Result<Json<UserProfile>, AppError> {
    let user_data = sqlx::query!(
        r#"
        SELECT u.id, u.username, u.email, u.created_at, u.last_login,
               COALESCE(d.deployment_count, 0) as deployment_count,
               COALESCE(a.api_key_count, 0) as api_key_count
        FROM users u
        LEFT JOIN (
            SELECT user_id, COUNT(*) as deployment_count 
            FROM deployments 
            WHERE user_id = $1 
            GROUP BY user_id
        ) d ON u.id = d.user_id
        LEFT JOIN (
            SELECT user_id, COUNT(*) as api_key_count 
            FROM api_keys 
            WHERE user_id = $1 AND is_active = true 
            GROUP BY user_id
        ) a ON u.id = a.user_id
        WHERE u.id = $1
        "#,
        user.user_id
    )
    .fetch_one(&state.db.pool)
    .await?;

    Ok(Json(UserProfile {
        id: user_data.id,
        username: user_data.username,
        email: user_data.email,
        created_at: user_data.created_at,
        last_login: user_data.last_login,
        deployment_count: user_data.deployment_count.unwrap_or(0),
        api_key_count: user_data.api_key_count.unwrap_or(0),
    }))
}

#[utoipa::path(
    put,
    path = "/v1/user/profile",
    request_body = UpdateProfileRequest,
    responses(
        (status = 200, description = "Profile updated successfully"),
        (status = 400, description = "Bad request", body = ErrorResponse),
        (status = 409, description = "Username or email already exists", body = ErrorResponse),
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "User"
)]
pub async fn update_profile(
    State(state): State<AppState>,
    user: AuthUser,
    Json(payload): Json<UpdateProfileRequest>,
) -> Result<Json<Value>, AppError> {
    payload.validate()?;

    // Check if at least one field is provided
    if payload.username.is_none() && payload.email.is_none() {
        return Err(AppError::bad_request("At least one field must be provided"));
    }

    // Check for conflicts if updating username or email
    if let Some(ref username) = payload.username {
        let existing = sqlx::query!(
            "SELECT id FROM users WHERE username = $1 AND id != $2",
            username,
            user.user_id
        )
        .fetch_optional(&state.db.pool)
        .await?;

        if existing.is_some() {
            return Err(AppError::conflict("Username already exists"));
        }
    }

    if let Some(ref email) = payload.email {
        let existing = sqlx::query!(
            "SELECT id FROM users WHERE email = $1 AND id != $2",
            email,
            user.user_id
        )
        .fetch_optional(&state.db.pool)
        .await?;

        if existing.is_some() {
            return Err(AppError::conflict("Email already exists"));
        }
    }

    // Update user profile
    let updated_user = sqlx::query!(
        r#"
        UPDATE users 
        SET username = COALESCE($1, username),
            email = COALESCE($2, email),
            updated_at = NOW()
        WHERE id = $3
        RETURNING id, username, email, updated_at
        "#,
        payload.username,
        payload.email,
        user.user_id
    )
    .fetch_one(&state.db.pool)
    .await?;

    Ok(Json(json!({
        "id": updated_user.id,
        "username": updated_user.username,
        "email": updated_user.email,
        "updated_at": updated_user.updated_at
    })))
}

#[utoipa::path(
    put,
    path = "/v1/user/password",
    request_body = ChangePasswordRequest,
    responses(
        (status = 200, description = "Password changed successfully"),
        (status = 400, description = "Bad request", body = ErrorResponse),
        (status = 401, description = "Current password is incorrect", body = ErrorResponse),
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "User"
)]
pub async fn change_password(
    State(state): State<AppState>,
    user: AuthUser,
    Json(payload): Json<ChangePasswordRequest>,
) -> Result<Json<Value>, AppError> {
    payload.validate()?;

    if payload.new_password != payload.confirm_new_password {
        return Err(AppError::bad_request("New passwords do not match"));
    }

    // Get current password hash
    let current_user = sqlx::query!(
        "SELECT password_hash FROM users WHERE id = $1",
        user.user_id
    )
    .fetch_one(&state.db.pool)
    .await?;

    // Verify current password
    if !verify(&payload.current_password, &current_user.password_hash)? {
        return Err(AppError::auth("Current password is incorrect"));
    }

    // Hash new password
    let new_password_hash = hash(&payload.new_password, DEFAULT_COST)?;

    // Update password
    sqlx::query!(
        "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
        new_password_hash,
        user.user_id
    )
    .execute(&state.db.pool)
    .await?;

    Ok(Json(json!({
        "message": "Password updated successfully"
    })))
}