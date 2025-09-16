use axum::{
    extract::{Path, Query, State},
    response::Json,
};
use chrono::Utc;
use serde_json::{json, Value};
use std::collections::HashMap;
use uuid::Uuid;
use validator::Validate;

use crate::{
    auth::AuthUser, deployment::models::*, error::AppError, handlers::auth::PaginationQuery,
    AppState, DeploymentJob,
};

pub async fn create_deployment(
    State(state): State<AppState>,
    user: AuthUser,
    Json(payload): Json<CreateDeploymentRequest>,
) -> Result<Json<DeploymentResponse>, AppError> {
    payload.validate()?;

    // Check if app name already exists for this user
    let existing = sqlx::query!(
        "SELECT id FROM deployments WHERE user_id = $1 AND app_name = $2",
        user.user_id,
        payload.app_name
    )
    .fetch_optional(&state.db.pool)
    .await?;

    if existing.is_some() {
        return Err(AppError::conflict("App name already exists"));
    }

    let deployment_id = Uuid::new_v4();
    let now = Utc::now();
    let url = format!(
        "https://{}.{}",
        payload.app_name, state.config.domain_suffix
    );

    // Convert optional fields to JSON
    let env_vars_for_job = payload.env_vars.clone();
    let env_vars_value = payload.env_vars.unwrap_or_default();
    let env_vars_json = serde_json::to_value(&env_vars_value)?;
    let resources = Some(serde_json::to_value(payload.resources.unwrap_or_default())?);
    let health_check = payload
        .health_check
        .map(|hc| serde_json::to_value(hc))
        .transpose()?;

    sqlx::query!(
            r#"
            INSERT INTO deployments (
                id, user_id, app_name, image, port, env_vars, replicas,
                resources, health_check, status, url, created_at, updated_at,
                deployed_at, error_message
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            "#,
            deployment_id,
            user.user_id,
            payload.app_name,
            payload.image,
            payload.port,
            env_vars_json,
            payload.replicas.unwrap_or(1),
            resources,
            health_check,
            "pending",
            url,
            now,
            now,
            Option::<chrono::DateTime<chrono::Utc>>::None, // deployed_at - null initially
            None::<String>         // error_message
        )
        .execute(&state.db.pool)
        .await?;

    println!("Inserted deployment record into database");

    // TODO: Implement Kubernetes deployment logic here
    let job = DeploymentJob::new(
        deployment_id,
        user.user_id,
        payload.app_name.clone(),
        payload.image.clone(),
        payload.port,
        env_vars_for_job,
        payload.replicas,
        resources,
        health_check,
    );

    if let Err(_) = state.deployment_sender.send(job).await {
        // Rollback the database record
        let _ = sqlx::query!("DELETE FROM deployments WHERE id = $1", deployment_id)
            .execute(&state.db.pool)
            .await;

        return Err(AppError::internal("Failed to queue deployment"));
    }

    // For now, we'll just return the response

    Ok(Json(DeploymentResponse {
        id: deployment_id,
        app_name: payload.app_name,
        image: payload.image,
        status: "pending".to_string(),
        url,
        created_at: now,
        message: "Deployment is being processed".to_string(),
    }))
}

pub async fn list_deployments(
    State(state): State<AppState>,
    user: AuthUser,
    Query(pagination): Query<PaginationQuery>,
) -> Result<Json<DeploymentListResponse>, AppError> {
    let limit = pagination.limit.min(100) as i64;
    let offset = ((pagination.page - 1) * pagination.limit) as i64;

    let deployments = sqlx::query_as!(
        DeploymentListItem,
        r#"
        SELECT id, app_name, image, status, url, replicas, created_at, updated_at
        FROM deployments 
        WHERE user_id = $1
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
        "SELECT COUNT(*) as count FROM deployments WHERE user_id = $1",
        user.user_id
    )
    .fetch_one(&state.db.pool)
    .await?
    .count
    .unwrap_or(0) as u64;

    let total_pages = ((total as f64) / (pagination.limit as f64)).ceil() as u32;

    Ok(Json(DeploymentListResponse {
        deployments,
        pagination: PaginationInfo {
            page: pagination.page,
            limit: pagination.limit,
            total,
            total_pages,
        },
    }))
}

pub async fn get_deployment(
    State(state): State<AppState>,
    user: AuthUser,
    Path(deployment_id): Path<Uuid>,
) -> Result<Json<Deployment>, AppError> {
    let deployment = sqlx::query_as!(
        Deployment,
        "SELECT * FROM deployments WHERE id = $1 AND user_id = $2",
        deployment_id,
        user.user_id
    )
    .fetch_optional(&state.db.pool)
    .await?
    .ok_or_else(|| AppError::not_found("Deployment"))?;

    Ok(Json(deployment))
}

pub async fn update_deployment(
    State(state): State<AppState>,
    user: AuthUser,
    Path(deployment_id): Path<Uuid>,
    Json(payload): Json<UpdateDeploymentRequest>,
) -> Result<Json<Value>, AppError> {
    payload.validate()?;

    // Check if deployment exists and belongs to user
    let existing = sqlx::query!(
        "SELECT id FROM deployments WHERE id = $1 AND user_id = $2",
        deployment_id,
        user.user_id
    )
    .fetch_optional(&state.db.pool)
    .await?
    .ok_or_else(|| AppError::not_found("Deployment"))?;

    // Update deployment
    let env_vars = payload
        .env_vars
        .map(|ev| serde_json::to_value(ev))
        .transpose()?;
    let resources = payload
        .resources
        .map(|r| serde_json::to_value(r))
        .transpose()?;

    sqlx::query!(
        r#"
        UPDATE deployments 
        SET image = COALESCE($1, image),
            env_vars = COALESCE($2, env_vars),
            replicas = COALESCE($3, replicas),
            resources = COALESCE($4, resources),
            status = 'updating',
            updated_at = NOW()
        WHERE id = $5
        "#,
        payload.image,
        env_vars,
        payload.replicas,
        resources,
        deployment_id
    )
    .execute(&state.db.pool)
    .await?;

    // TODO: Implement Kubernetes update logic here

    Ok(Json(json!({
        "id": deployment_id,
        "status": "updating",
        "message": "Deployment update in progress",
        "updated_at": Utc::now()
    })))
}

pub async fn scale_deployment(
    State(state): State<AppState>,
    user: AuthUser,
    Path(deployment_id): Path<Uuid>,
    Json(payload): Json<ScaleDeploymentRequest>,
) -> Result<Json<Value>, AppError> {
    payload.validate()?;

    let result = sqlx::query!(
        r#"
        UPDATE deployments 
        SET replicas = $1, status = 'scaling', updated_at = NOW()
        WHERE id = $2 AND user_id = $3
        "#,
        payload.replicas,
        deployment_id,
        user.user_id
    )
    .execute(&state.db.pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::not_found("Deployment"));
    }

    // TODO: Implement Kubernetes scaling logic here

    Ok(Json(json!({
        "id": deployment_id,
        "replicas": payload.replicas,
        "status": "scaling",
        "message": "Deployment scaling in progress"
    })))
}

pub async fn start_deployment(
    State(state): State<AppState>,
    user: AuthUser,
    Path(deployment_id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let result = sqlx::query!(
        r#"
        UPDATE deployments 
        SET status = 'starting', updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        "#,
        deployment_id,
        user.user_id
    )
    .execute(&state.db.pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::not_found("Deployment"));
    }

    // TODO: Implement Kubernetes start logic here

    Ok(Json(json!({
        "id": deployment_id,
        "status": "starting",
        "message": "Deployment is being started"
    })))
}

pub async fn stop_deployment(
    State(state): State<AppState>,
    user: AuthUser,
    Path(deployment_id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let result = sqlx::query!(
        r#"
        UPDATE deployments 
        SET status = 'stopping', updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        "#,
        deployment_id,
        user.user_id
    )
    .execute(&state.db.pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::not_found("Deployment"));
    }

    // TODO: Implement Kubernetes stop logic here

    Ok(Json(json!({
        "id": deployment_id,
        "status": "stopping",
        "message": "Deployment is being stopped"
    })))
}

pub async fn delete_deployment(
    State(state): State<AppState>,
    user: AuthUser,
    Path(deployment_id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let result = sqlx::query!(
        "DELETE FROM deployments WHERE id = $1 AND user_id = $2",
        deployment_id,
        user.user_id
    )
    .execute(&state.db.pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::not_found("Deployment"));
    }

    // TODO: Implement Kubernetes deletion logic here

    Ok(Json(json!({
        "message": "Deployment deleted successfully"
    })))
}

pub async fn get_logs(
    _state: State<AppState>,
    _user: AuthUser,
    _deployment_id: Path<Uuid>,
    _query: Query<LogsQuery>,
) -> Result<Json<LogsResponse>, AppError> {
    // TODO: Implement Kubernetes logs retrieval
    Ok(Json(LogsResponse { logs: vec![] }))
}

pub async fn get_metrics(
    _state: State<AppState>,
    _user: AuthUser,
    _deployment_id: Path<Uuid>,
    _query: Query<MetricsQuery>,
) -> Result<Json<MetricsResponse>, AppError> {
    // TODO: Implement metrics retrieval
    Ok(Json(MetricsResponse {
        metrics: HashMap::new(),
    }))
}

pub async fn get_status(
    State(state): State<AppState>,
    user: AuthUser,
    Path(deployment_id): Path<Uuid>,
) -> Result<Json<DeploymentStatus>, AppError> {
    let deployment = sqlx::query!(
        "SELECT status, replicas FROM deployments WHERE id = $1 AND user_id = $2",
        deployment_id,
        user.user_id
    )
    .fetch_optional(&state.db.pool)
    .await?
    .ok_or_else(|| AppError::not_found("Deployment"))?;

    // TODO: Get real status from Kubernetes
    Ok(Json(DeploymentStatus {
        status: deployment.status,
        health: "healthy".to_string(),
        replicas: ReplicaStatus {
            desired: deployment.replicas,
            ready: deployment.replicas,
            available: deployment.replicas,
        },
        last_health_check: Some(Utc::now()),
        uptime: "0s".to_string(),
        restart_count: 0,
    }))
}

// Domain management stubs
pub async fn list_domains(
    _state: State<AppState>,
    _user: AuthUser,
    _deployment_id: Path<Uuid>,
) -> Result<Json<DomainListResponse>, AppError> {
    // TODO: Implement domain listing
    Ok(Json(DomainListResponse { domains: vec![] }))
}

pub async fn add_domain(
    _state: State<AppState>,
    _user: AuthUser,
    _deployment_id: Path<Uuid>,
    _payload: Json<AddDomainRequest>,
) -> Result<Json<DomainResponse>, AppError> {
    // TODO: Implement domain addition
    Err(AppError::internal("Domain management not yet implemented"))
}

pub async fn remove_domain(
    _state: State<AppState>,
    _user: AuthUser,
    _deployment_id: Path<Uuid>,
    _domain_id: Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    // TODO: Implement domain removal
    Err(AppError::internal("Domain management not yet implemented"))
}
