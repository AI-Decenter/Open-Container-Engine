use axum::{
    extract::{Path, State},
    response::Json,
};
use chrono::Utc;
use serde_json::{json, Value};
use std::time::Instant;
use tracing::error;
use uuid::Uuid;
use validator::Validate;

use crate::{
    auth::AuthUser,
    error::AppError,
    user::webhook_models::*,
    AppState,
};

pub async fn create_webhook(
    State(state): State<AppState>,
    user: AuthUser,
    Json(payload): Json<CreateWebhookRequest>,
) -> Result<Json<WebhookResponse>, AppError> {
    // Creating webhook for user
    
    // Validate the payload
    let validation_result = payload.validate();
    if let Err(e) = validation_result {
        tracing::error!("Validation failed: {:?}", e);
        return Err(AppError::bad_request(&format!("Validation error: {}", e)));
    }
    // Validation passed for webhook creation

    // Check if webhook name already exists for this user
    let existing = sqlx::query!(
        "SELECT id FROM user_webhooks WHERE user_id = $1 AND name = $2",
        user.user_id,
        payload.name
    )
    .fetch_optional(&state.db.pool)
    .await?;

    if existing.is_some() {
        return Err(AppError::conflict("Webhook name"));
    }

    let webhook_id = Uuid::new_v4();
    let now = Utc::now();
    let events: Vec<String> = payload.events.iter().map(|e| e.as_str().to_string()).collect();

    sqlx::query!(
        r#"
            INSERT INTO user_webhooks (
                id, user_id, name, url, secret, is_active, events, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            "#,
        webhook_id,
        user.user_id,
        payload.name,
        payload.url,
        payload.secret,
        true,
        &events,
        now,
        now
    )
    .execute(&state.db.pool)
    .await?;

    // Webhook created successfully

    Ok(Json(WebhookResponse {
        id: webhook_id,
        name: payload.name,
        url: payload.url,
        is_active: true,
        events,
        created_at: now,
        updated_at: now,
    }))
}

pub async fn list_webhooks(
    State(state): State<AppState>,
    user: AuthUser,
) -> Result<Json<WebhookListResponse>, AppError> {
    let webhooks = sqlx::query_as!(
        UserWebhook,
        "SELECT * FROM user_webhooks WHERE user_id = $1 ORDER BY created_at DESC",
        user.user_id
    )
    .fetch_all(&state.db.pool)
    .await?;

    let total = webhooks.len() as u64;
    let webhook_responses: Vec<WebhookResponse> = webhooks
        .into_iter()
        .map(|w| WebhookResponse {
            id: w.id,
            name: w.name,
            url: w.url,
            is_active: w.is_active,
            events: w.events,
            created_at: w.created_at,
            updated_at: w.updated_at,
        })
        .collect();

    Ok(Json(WebhookListResponse {
        webhooks: webhook_responses,
        total,
    }))
}

pub async fn get_webhook(
    State(state): State<AppState>,
    user: AuthUser,
    Path(webhook_id): Path<Uuid>,
) -> Result<Json<WebhookResponse>, AppError> {
    let webhook = sqlx::query_as!(
        UserWebhook,
        "SELECT * FROM user_webhooks WHERE id = $1 AND user_id = $2",
        webhook_id,
        user.user_id
    )
    .fetch_optional(&state.db.pool)
    .await?
    .ok_or_else(|| AppError::not_found("Webhook"))?;

    Ok(Json(WebhookResponse {
        id: webhook.id,
        name: webhook.name,
        url: webhook.url,
        is_active: webhook.is_active,
        events: webhook.events,
        created_at: webhook.created_at,
        updated_at: webhook.updated_at,
    }))
}

pub async fn update_webhook(
    State(state): State<AppState>,
    user: AuthUser,
    Path(webhook_id): Path<Uuid>,
    Json(payload): Json<UpdateWebhookRequest>,
) -> Result<Json<WebhookResponse>, AppError> {
    payload.validate()?;

    // Check if webhook exists
    let _existing = sqlx::query!(
        "SELECT id FROM user_webhooks WHERE id = $1 AND user_id = $2",
        webhook_id,
        user.user_id
    )
    .fetch_optional(&state.db.pool)
    .await?
    .ok_or_else(|| AppError::not_found("Webhook"))?;

    // Check if new name conflicts
    if let Some(ref name) = payload.name {
        let name_conflict = sqlx::query!(
            "SELECT id FROM user_webhooks WHERE user_id = $1 AND name = $2 AND id != $3",
            user.user_id,
            name,
            webhook_id
        )
        .fetch_optional(&state.db.pool)
        .await?;

        if name_conflict.is_some() {
            return Err(AppError::conflict("Webhook name"));
        }
    }

    let events = payload.events.as_ref().map(|e| {
        e.iter().map(|evt| evt.as_str().to_string()).collect::<Vec<String>>()
    });

    sqlx::query!(
        r#"
        UPDATE user_webhooks 
        SET 
            name = COALESCE($1, name),
            url = COALESCE($2, url),
            secret = COALESCE($3, secret),
            is_active = COALESCE($4, is_active),
            events = COALESCE($5, events),
            updated_at = NOW()
        WHERE id = $6
        "#,
        payload.name,
        payload.url,
        payload.secret,
        payload.is_active,
        events.as_ref().map(|e| &e[..]),
        webhook_id
    )
    .execute(&state.db.pool)
    .await?;

    // Fetch updated webhook
    let webhook = sqlx::query_as!(
        UserWebhook,
        "SELECT * FROM user_webhooks WHERE id = $1",
        webhook_id
    )
    .fetch_one(&state.db.pool)
    .await?;

    Ok(Json(WebhookResponse {
        id: webhook.id,
        name: webhook.name,
        url: webhook.url,
        is_active: webhook.is_active,
        events: webhook.events,
        created_at: webhook.created_at,
        updated_at: webhook.updated_at,
    }))
}

pub async fn delete_webhook(
    State(state): State<AppState>,
    user: AuthUser,
    Path(webhook_id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let result = sqlx::query!(
        "DELETE FROM user_webhooks WHERE id = $1 AND user_id = $2",
        webhook_id,
        user.user_id
    )
    .execute(&state.db.pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::not_found("Webhook"));
    }

    // User deleted webhook

    Ok(Json(json!({
        "message": "Webhook deleted successfully",
        "webhook_id": webhook_id
    })))
}

pub async fn test_webhook(
    State(state): State<AppState>,
    user: AuthUser,
    Path(webhook_id): Path<Uuid>,
) -> Result<Json<WebhookTestResponse>, AppError> {
    let webhook = sqlx::query!(
        "SELECT url FROM user_webhooks WHERE id = $1 AND user_id = $2 AND is_active = true",
        webhook_id,
        user.user_id
    )
    .fetch_optional(&state.db.pool)
    .await?
    .ok_or_else(|| AppError::not_found("Active webhook"))?;

    let start_time = Instant::now();
    
    // Create test payload
    let test_payload = json!({
        "event": "webhook.test",
        "timestamp": Utc::now(),
        "data": {
            "message": "This is a test webhook from Container Engine",
            "user_id": user.user_id,
            "webhook_id": webhook_id
        }
    });

    // Send test request
    let client = reqwest::Client::new();
    match client
        .post(&webhook.url)
        .header("Content-Type", "application/json")
        .header("User-Agent", "Container-Engine-Webhook/1.0")
        .json(&test_payload)
        .timeout(std::time::Duration::from_secs(10))
        .send()
        .await
    {
        Ok(response) => {
            let status_code = response.status().as_u16();
            let response_time = start_time.elapsed().as_millis() as u64;
            
            if response.status().is_success() {
                Ok(Json(WebhookTestResponse {
                    success: true,
                    status_code: Some(status_code),
                    message: "Webhook test successful".to_string(),
                    response_time_ms: response_time,
                }))
            } else {
                Ok(Json(WebhookTestResponse {
                    success: false,
                    status_code: Some(status_code),
                    message: format!("Webhook returned status {}", status_code),
                    response_time_ms: response_time,
                }))
            }
        }
        Err(e) => {
            error!("Failed to test webhook {}: {}", webhook_id, e);
            Ok(Json(WebhookTestResponse {
                success: false,
                status_code: None,
                message: format!("Failed to send request: {}", e),
                response_time_ms: start_time.elapsed().as_millis() as u64,
            }))
        }
    }
}
