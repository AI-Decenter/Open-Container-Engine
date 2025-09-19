use axum::{
    extract::{Path, Query, State},
    response::Json,
};
use chrono::Utc;
use serde_json::{json, Value};
use std::collections::HashMap;
use tracing::{error, info, warn};
use uuid::Uuid;
use validator::Validate;

use crate::{
    auth::AuthUser, deployment::models::*, error::AppError, handlers::auth::PaginationQuery, services::kubernetes::KubernetesService, AppState, DeploymentJob
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
        return Err(AppError::conflict("App name"));
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
    tracing::debug!("Inserting deployment record into database");

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
        "".to_string(), // url will be set after deployment
        now,
        now,
        Option::<chrono::DateTime<chrono::Utc>>::None, // deployed_at - null initially
        None::<String>                                 // error_message
    )
    .execute(&state.db.pool)
    .await?;
    tracing::info!("Successfully inserted deployment record into database");
    // TODO: Implement Kubernetes deployment logic here
    tracing::debug!("Creating deployment job");
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
    tracing::debug!("Sending job to deployment queue");
    if let Err(_) = state.deployment_sender.send(job).await {
        // Rollback the database record
        let _ = sqlx::query!("DELETE FROM deployments WHERE id = $1", deployment_id)
            .execute(&state.db.pool)
            .await;

        return Err(AppError::internal("Failed to queue deployment"));
    }
    tracing::info!("Deployment system initialized successfully");

    // For now, we'll just return the response

    Ok(Json(DeploymentResponse {
        id: deployment_id,
        app_name: payload.app_name,
        image: payload.image,
        status: "pending".to_string(),
        url: None,
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

    // Create Kubernetes service for this deployment's namespace
    let k8s_service = KubernetesService::for_deployment(&deployment_id, &user.user_id).await?;

    // Scale the deployment
    match k8s_service.scale_deployment(&deployment_id, payload.replicas).await {
        Ok(_) => {
            // Update status to "running"
            sqlx::query!(
                "UPDATE deployments SET status = 'running', updated_at = NOW() WHERE id = $1",
                deployment_id
            )
            .execute(&state.db.pool)
            .await?;

            Ok(Json(json!({
                "id": deployment_id,
                "replicas": payload.replicas,
                "status": "running",
                "message": "Deployment scaled successfully"
            })))
        }
        Err(e) => {
            // Update status to failed
            sqlx::query!(
                "UPDATE deployments SET status = 'failed', error_message = $1, updated_at = NOW() WHERE id = $2",
                format!("Failed to scale: {}", e),
                deployment_id
            )
            .execute(&state.db.pool)
            .await?;

            Err(AppError::internal(&format!("Failed to scale deployment: {}", e)))
        }
    }
}

pub async fn start_deployment(
    State(state): State<AppState>,
    user: AuthUser,
    Path(deployment_id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    // Check if deployment exists and belongs to user
    let deployment = sqlx::query!(
        "SELECT id, app_name, status, replicas FROM deployments WHERE id = $1 AND user_id = $2",
        deployment_id,
        user.user_id
    )
    .fetch_optional(&state.db.pool)
    .await?
    .ok_or_else(|| AppError::not_found("Deployment"))?;

    // Update status to "starting"
    sqlx::query!(
        "UPDATE deployments SET status = 'starting', updated_at = NOW() WHERE id = $1",
        deployment_id
    )
    .execute(&state.db.pool)
    .await?;

    // Create Kubernetes service for user's namespace
    let k8s_service = KubernetesService::for_deployment(&deployment_id, &user.user_id).await?;

    // Scale deployment back to desired replicas
    let target_replicas = if deployment.replicas <= 0 { 1 } else { deployment.replicas };
    
    match k8s_service.scale_deployment(&deployment_id, target_replicas).await {
        Ok(_) => {
            // Update status to "running"
            sqlx::query!(
                "UPDATE deployments SET status = 'running', replicas = $1, updated_at = NOW() WHERE id = $2",
                target_replicas,
                deployment_id
            )
            .execute(&state.db.pool)
            .await?;

            info!("Successfully started deployment: {}", deployment_id);

            Ok(Json(json!({
                "id": deployment_id,
                "status": "running",
                "replicas": target_replicas,
                "message": "Deployment started successfully"
            })))
        }
        Err(e) => {
            error!("Failed to start deployment {}: {}", deployment_id, e);
            
            // Update status to failed
            sqlx::query!(
                "UPDATE deployments SET status = 'failed', error_message = $1, updated_at = NOW() WHERE id = $2",
                format!("Failed to start: {}", e),
                deployment_id
            )
            .execute(&state.db.pool)
            .await?;

            Err(AppError::internal(&format!("Failed to start deployment: {}", e)))
        }
    }
}

pub async fn stop_deployment(
    State(state): State<AppState>,
    user: AuthUser,
    Path(deployment_id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    // Check if deployment exists and belongs to user
    let deployment = sqlx::query!(
        "SELECT id, app_name, status FROM deployments WHERE id = $1 AND user_id = $2",
        deployment_id,
        user.user_id
    )
    .fetch_optional(&state.db.pool)
    .await?
    .ok_or_else(|| AppError::not_found("Deployment"))?;

    // Update status to "stopping"
    sqlx::query!(
        "UPDATE deployments SET status = 'stopping', updated_at = NOW() WHERE id = $1",
        deployment_id
    )
    .execute(&state.db.pool)
    .await?;

    // Create Kubernetes service for user's namespace
    let k8s_service = KubernetesService::for_deployment(&deployment_id, &user.user_id).await?;

    // Scale deployment to 0 replicas to stop it
    match k8s_service.scale_deployment(&deployment_id, 0).await {
        Ok(_) => {
            // Update status to "stopped"
            sqlx::query!(
                "UPDATE deployments SET status = 'stopped', replicas = 0, updated_at = NOW() WHERE id = $1",
                deployment_id
            )
            .execute(&state.db.pool)
            .await?;

            info!("Successfully stopped deployment: {}", deployment_id);

            Ok(Json(json!({
                "id": deployment_id,
                "status": "stopped",
                "message": "Deployment stopped successfully"
            })))
        }
        Err(e) => {
            error!("Failed to stop deployment {}: {}", deployment_id, e);
            
            // Update status back to previous or failed
            sqlx::query!(
                "UPDATE deployments SET status = 'failed', error_message = $1, updated_at = NOW() WHERE id = $2",
                format!("Failed to stop: {}", e),
                deployment_id
            )
            .execute(&state.db.pool)
            .await?;

            Err(AppError::internal(&format!("Failed to stop deployment: {}", e)))
        }
    }
}

pub async fn delete_deployment(
    State(state): State<AppState>,
    user: AuthUser,
    Path(deployment_id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    // First, check if deployment exists and belongs to user
    let deployment = sqlx::query!(
        "SELECT id, app_name, status FROM deployments WHERE id = $1 AND user_id = $2",
        deployment_id,
        user.user_id
    )
    .fetch_optional(&state.db.pool)
    .await?
    .ok_or_else(|| AppError::not_found("Deployment"))?;

    info!("Deleting deployment: {} ({})", deployment_id, deployment.app_name);

    // Update status to "deleting" first
    sqlx::query!(
        "UPDATE deployments SET status = 'deleting', updated_at = NOW() WHERE id = $1",
        deployment_id
    )
    .execute(&state.db.pool)
    .await?;

    // Create Kubernetes service for this specific deployment's namespace
    let k8s_service = match KubernetesService::for_deployment(&deployment_id, &user.user_id).await {
        Ok(service) => service,
        Err(e) => {
            error!("Failed to create K8s service for deployment {} (user {}): {}", 
                   deployment_id, user.user_id, e);
            // Still try to delete from database even if K8s cleanup fails
            let result = sqlx::query!(
                "DELETE FROM deployments WHERE id = $1 AND user_id = $2",
                deployment_id,
                user.user_id
            )
            .execute(&state.db.pool)
            .await?;

            return Ok(Json(json!({
                "message": "Deployment deleted from database, but Kubernetes cleanup may have failed",
                "warning": format!("Failed to connect to Kubernetes: {}", e),
                "deployment_id": deployment_id,
                "app_name": deployment.app_name
            })));
        }
    };

    // Delete from Kubernetes (this will delete the entire namespace and all resources)
    match k8s_service.delete_deployment(&deployment_id).await {
        Ok(_) => {
            info!("Successfully deleted Kubernetes namespace and all resources for deployment: {}", deployment_id);
        }
        Err(e) => {
            warn!("Failed to delete Kubernetes resources for deployment {}: {}", deployment_id, e);
            // Continue with database deletion even if K8s deletion fails
            // But add the error to response
        }
    }

    // Delete from database
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

    info!("Successfully deleted deployment: {} from database", deployment_id);

    Ok(Json(json!({
        "message": "Deployment deleted successfully",
        "deployment_id": deployment_id,
        "app_name": deployment.app_name,
        "namespace_deleted": true
    })))
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
