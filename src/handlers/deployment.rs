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
use crate::jobs::deployment_job::{DeploymentJob, JobType};
use crate::services::domain_validator::DomainValidator;
use crate::services::ssl_certificate_manager::{SslCertificateManager, CertificateRequest, ChallengeType};

use crate::{
    auth::AuthUser, 
    deployment::models::*, 
    error::AppError, 
    handlers::auth::PaginationQuery, 
    notifications::NotificationType,
    services::kubernetes::KubernetesService, 
    AppState, 
};

pub async fn create_deployment(
    State(state): State<AppState>,
    user: AuthUser,
    Json(payload): Json<CreateDeploymentRequest>,
) -> Result<Json<DeploymentResponse>, AppError> {
    payload.validate()?;

    // Check if app name already exists for this user
    let _existing = sqlx::query!(
        "SELECT id FROM deployments WHERE user_id = $1 AND app_name = $2",
        user.user_id,
        payload.app_name
    )
    .fetch_optional(&state.db.pool)
    .await?;

    if _existing.is_some() {
        return Err(AppError::conflict("App name"));
    }

    let deployment_id = Uuid::new_v4();
    let now = Utc::now();
    let _url = format!(
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
        "".to_string(), // url will be set after deployment
        now,
        now,
        Option::<chrono::DateTime<chrono::Utc>>::None, // deployed_at - null initially
        None::<String>                                 // error_message
    )
    .execute(&state.db.pool)
    .await?;
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

    // Send notification about deployment creation
    state.notification_manager
        .send_to_user(
            user.user_id,
            NotificationType::DeploymentCreated {
                deployment_id,
                app_name: payload.app_name.clone(),
            },
        )
        .await;

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
    let _existing = sqlx::query!(
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

    // Get deployment info for creating the job
    let deployment = sqlx::query!(
        "SELECT app_name FROM deployments WHERE id = $1 AND user_id = $2",
        deployment_id,
        user.user_id
    )
    .fetch_optional(&state.db.pool)
    .await?
    .ok_or_else(|| AppError::not_found("Deployment"))?;

    // Update status to "scaling" in database first
    sqlx::query!(
        "UPDATE deployments SET status = 'scaling', updated_at = NOW() WHERE id = $1",
        deployment_id
    )
    .execute(&state.db.pool)
    .await?;

    // Create scale job
    let job = DeploymentJob::new_scale(
        deployment_id,
        user.user_id,
        payload.replicas,
        deployment.app_name,
    );

    // Send job to worker queue
    if let Err(_) = state.deployment_sender.send(job).await {
        // Rollback status on queue failure
        let _ = sqlx::query!(
            "UPDATE deployments SET status = 'failed', error_message = 'Failed to queue scale operation' WHERE id = $1",
            deployment_id
        )
        .execute(&state.db.pool)
        .await;

        return Err(AppError::internal("Failed to queue scale operation"));
    }

    Ok(Json(json!({
        "id": deployment_id,
        "status": "scaling",
        "message": "Scale operation queued",
        "target_replicas": payload.replicas
    })))
}

pub async fn start_deployment(
    State(state): State<AppState>,
    user: AuthUser,
    Path(deployment_id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    // Check if deployment exists and belongs to user
    let deployment = sqlx::query!(
        "SELECT app_name FROM deployments WHERE id = $1 AND user_id = $2",
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

    // Create start job
    let job = DeploymentJob::new_start(
        deployment_id,
        user.user_id,
        deployment.app_name,
    );

    // Send job to worker queue
    if let Err(_) = state.deployment_sender.send(job).await {
        // Rollback status on queue failure
        let _ = sqlx::query!(
            "UPDATE deployments SET status = 'failed', error_message = 'Failed to queue start operation' WHERE id = $1",
            deployment_id
        )
        .execute(&state.db.pool)
        .await;

        return Err(AppError::internal("Failed to queue start operation"));
    }

    Ok(Json(json!({
        "id": deployment_id,
        "status": "starting",
        "message": "Start operation queued"
    })))
}


pub async fn stop_deployment(
    State(state): State<AppState>,
    user: AuthUser,
    Path(deployment_id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    // Check if deployment exists and belongs to user
    let deployment = sqlx::query!(
        "SELECT app_name FROM deployments WHERE id = $1 AND user_id = $2",
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

    // Create stop job
    let job = DeploymentJob::new_stop(
        deployment_id,
        user.user_id,
        deployment.app_name,
    );

    // Send job to worker queue
    if let Err(_) = state.deployment_sender.send(job).await {
        // Rollback status on queue failure
        let _ = sqlx::query!(
            "UPDATE deployments SET status = 'failed', error_message = 'Failed to queue stop operation' WHERE id = $1",
            deployment_id
        )
        .execute(&state.db.pool)
        .await;

        return Err(AppError::internal("Failed to queue stop operation"));
    }

    Ok(Json(json!({
        "id": deployment_id,
        "status": "stopping",
        "message": "Stop operation queued"
    })))
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

// Domain management
pub async fn list_domains(
    State(state): State<AppState>,
    user: AuthUser,
    Path(deployment_id): Path<Uuid>,
) -> Result<Json<DomainListResponse>, AppError> {
    // Check if deployment exists and belongs to user
    let _deployment = sqlx::query!(
        "SELECT id FROM deployments WHERE id = $1 AND user_id = $2",
        deployment_id,
        user.user_id
    )
    .fetch_optional(&state.db.pool)
    .await?
    .ok_or_else(|| AppError::not_found("Deployment"))?;

    // Get domains for this deployment
    let domains = sqlx::query_as!(
        DomainListItem,
        r#"
        SELECT id, domain, status, created_at, verified_at
        FROM domains 
        WHERE deployment_id = $1
        ORDER BY created_at DESC
        "#,
        deployment_id
    )
    .fetch_all(&state.db.pool)
    .await?;

    Ok(Json(DomainListResponse { domains }))
}

pub async fn add_domain(
    State(state): State<AppState>,
    user: AuthUser,
    Path(deployment_id): Path<Uuid>,
    Json(payload): Json<AddDomainRequest>,
) -> Result<Json<DomainResponse>, AppError> {
    payload.validate()?;

    // Check if deployment exists and belongs to user
    let deployment = sqlx::query!(
        "SELECT id, app_name FROM deployments WHERE id = $1 AND user_id = $2",
        deployment_id,
        user.user_id
    )
    .fetch_optional(&state.db.pool)
    .await?
    .ok_or_else(|| AppError::not_found("Deployment"))?;

    // Check if domain already exists
    let existing_domain = sqlx::query!(
        "SELECT id FROM domains WHERE domain = $1",
        payload.domain
    )
    .fetch_optional(&state.db.pool)
    .await?;

    if existing_domain.is_some() {
        return Err(AppError::conflict("Domain already exists"));
    }

    // Initialize domain validator
    let domain_validator = DomainValidator::new()?;

    // Validate domain format
    domain_validator.validate_domain_format(&payload.domain)?;

    // Get ingress endpoint for DNS records
    let k8s_service = KubernetesService::for_deployment(&deployment_id, &user.user_id).await?;
    let ingress_endpoint = k8s_service.get_ingress_endpoint().await?;

    // Generate required DNS records
    let validator_dns_records = domain_validator.generate_required_dns_records(&payload.domain, &ingress_endpoint);
    let dns_records: Vec<crate::deployment::models::DnsRecord> = validator_dns_records
        .into_iter()
        .map(|record| crate::deployment::models::DnsRecord {
            record_type: record.record_type,
            name: record.name,
            value: record.value,
            ttl: record.ttl,
        })
        .collect();

    // Insert domain into database
    let domain_id = Uuid::new_v4();
    let now = Utc::now();

    sqlx::query!(
        r#"
        INSERT INTO domains (id, deployment_id, domain, status, created_at)
        VALUES ($1, $2, $3, 'pending', $4)
        "#,
        domain_id,
        deployment_id,
        payload.domain,
        now
    )
    .execute(&state.db.pool)
    .await?;

    // Insert DNS records
    for record in &dns_records {
        sqlx::query!(
            r#"
            INSERT INTO dns_records (id, domain_id, record_type, record_name, record_value, ttl)
            VALUES ($1, $2, $3, $4, $5, $6)
            "#,
            Uuid::new_v4(),
            domain_id,
            record.record_type,
            record.name,
            record.value,
            record.ttl as i32
        )
        .execute(&state.db.pool)
        .await?;
    }

    // Start domain validation process in background
    let domain_clone = payload.domain.clone();
    let user_id = user.user_id;
    let state_clone = state.clone();
    
    tokio::spawn(async move {
        let state_ref = &state_clone;
        if let Err(e) = validate_and_provision_ssl(
            state_clone.clone(),
            domain_id,
            domain_clone,
            user_id,
            deployment_id,
        ).await {
            error!("Failed to validate domain and provision SSL: {}", e);
            
            // Update domain status to failed
            let _ = sqlx::query!(
                "UPDATE domains SET status = 'failed', error_message = $1 WHERE id = $2",
                e.to_string(),
                domain_id
            )
            .execute(&state_ref.db.pool)
            .await;
        }
    });

    Ok(Json(DomainResponse {
        id: domain_id,
        domain: payload.domain,
        status: "pending".to_string(),
        created_at: now,
        dns_records,
    }))
}

pub async fn remove_domain(
    State(state): State<AppState>,
    user: AuthUser,
    Path((deployment_id, domain_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<Value>, AppError> {
    // Check if deployment belongs to user
    let _deployment = sqlx::query!(
        "SELECT id FROM deployments WHERE id = $1 AND user_id = $2",
        deployment_id,
        user.user_id
    )
    .fetch_optional(&state.db.pool)
    .await?
    .ok_or_else(|| AppError::not_found("Deployment"))?;

    // Get domain info
    let domain = sqlx::query!(
        "SELECT id, domain FROM domains WHERE id = $1 AND deployment_id = $2",
        domain_id,
        deployment_id
    )
    .fetch_optional(&state.db.pool)
    .await?
    .ok_or_else(|| AppError::not_found("Domain"))?;

    info!("Removing custom domain: {} ({})", domain.domain, domain_id);

    // Remove Kubernetes ingress and SSL certificate
    let k8s_service = KubernetesService::for_deployment(&deployment_id, &user.user_id).await?;
    
    // Remove custom domain ingress
    if let Err(e) = k8s_service.remove_custom_domain_ingress(&deployment_id, &domain.domain).await {
        warn!("Failed to remove Kubernetes ingress for domain {}: {}", domain.domain, e);
    }

    // Remove SSL certificate secret
    let secret_name = format!("ssl-{}", domain_id);
    if let Err(e) = k8s_service.remove_ssl_certificate_secret(&secret_name).await {
        warn!("Failed to remove SSL certificate secret for domain {}: {}", domain.domain, e);
    }

    // Remove from database (this will cascade to related records)
    let result = sqlx::query!(
        "DELETE FROM domains WHERE id = $1 AND deployment_id = $2",
        domain_id,
        deployment_id
    )
    .execute(&state.db.pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::not_found("Domain"));
    }

    info!("Successfully removed custom domain: {}", domain.domain);

    Ok(Json(json!({
        "message": "Domain removed successfully",
        "domain_id": domain_id,
        "domain": domain.domain
    })))
}

/// Helper function to validate domain and provision SSL certificate
async fn validate_and_provision_ssl(
    state: AppState,
    domain_id: Uuid,
    domain: String,
    user_id: Uuid,
    deployment_id: Uuid,
) -> Result<(), AppError> {
    info!("Starting domain validation and SSL provisioning for: {}", domain);

    // Initialize services
    let domain_validator = DomainValidator::new()?;
    let ssl_manager = SslCertificateManager::new(
        format!("/tmp/ssl-certs/{}", user_id),
        true, // Use staging for development
    ).await?;

    // Step 1: Update domain status to validating
    sqlx::query!(
        "UPDATE domains SET status = 'validating' WHERE id = $1",
        domain_id
    )
    .execute(&state.db.pool)
    .await?;

    // Step 2: Request SSL certificate and get validation challenge
    let cert_request = CertificateRequest {
        domain: domain.clone(),
        email: "ssl@example.com".to_string(), // This should come from user settings
        challenge_type: ChallengeType::Dns,
    };

    let validation_challenge = ssl_manager.request_certificate(cert_request).await?;

    // Step 3: Store DNS validation record
    if let Some(dns_record) = &validation_challenge.dns_record {
        sqlx::query!(
            r#"
            INSERT INTO dns_records (id, domain_id, record_type, record_name, record_value, ttl, is_validation_record)
            VALUES ($1, $2, $3, $4, $5, $6, true)
            "#,
            Uuid::new_v4(),
            domain_id,
            dns_record.record_type,
            dns_record.name,
            dns_record.value,
            dns_record.ttl as i32
        )
        .execute(&state.db.pool)
        .await?;
    }

    // Step 4: Wait for DNS propagation and validate
    let is_validated = domain_validator
        .wait_for_dns_propagation(
            &domain,
            &validation_challenge.key_authorization,
            10, // max retries
        )
        .await?;

    if !is_validated {
        return Err(AppError::internal("Domain validation failed - DNS not propagated"));
    }

    // Step 5: Complete SSL certificate issuance
    let certificate_info = ssl_manager
        .complete_certificate_validation(&domain, "ssl@example.com")
        .await?;

    // Step 6: Create Kubernetes secret for SSL certificate
    let k8s_service = KubernetesService::for_deployment(&deployment_id, &user_id).await?;
    let secret_name = format!("ssl-{}", domain_id);

    k8s_service
        .create_ssl_certificate_secret(
            &secret_name,
            &certificate_info.certificate_pem,
            &certificate_info.private_key_pem,
        )
        .await?;

    // Step 7: Create custom domain ingress with SSL
    k8s_service
        .create_custom_domain_ingress(&deployment_id, &domain, &secret_name)
        .await?;

    // Step 8: Store SSL certificate in database
    sqlx::query!(
        r#"
        INSERT INTO ssl_certificates (id, domain_id, certificate_pem, private_key_pem, issued_at, expires_at, issuer, status, auto_renew)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', true)
        "#,
        certificate_info.id,
        domain_id,
        certificate_info.certificate_pem,
        certificate_info.private_key_pem,
        certificate_info.issued_at,
        certificate_info.expires_at,
        certificate_info.issuer
    )
    .execute(&state.db.pool)
    .await?;

    // Step 9: Update domain status to verified
    sqlx::query!(
        r#"
        UPDATE domains 
        SET status = 'verified', verified_at = NOW(), ssl_status = 'issued', ssl_issued_at = $1, ssl_expires_at = $2
        WHERE id = $3
        "#,
        certificate_info.issued_at,
        certificate_info.expires_at,
        domain_id
    )
    .execute(&state.db.pool)
    .await?;

    info!("Successfully validated domain and provisioned SSL: {}", domain);
    Ok(())
}
