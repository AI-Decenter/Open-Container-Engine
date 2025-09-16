use sqlx::PgPool;
use std::time::Duration;
use tokio::sync::mpsc;
use tracing::{error, info, warn};
use uuid::Uuid;

use crate::jobs::deployment_job::DeploymentJob;
use crate::services::kubernetes::KubernetesService;

pub struct DeploymentWorker {
    receiver: mpsc::Receiver<DeploymentJob>,
    k8s_service: KubernetesService,
    db_pool: PgPool,
}

impl DeploymentWorker {
    pub fn new(
        receiver: mpsc::Receiver<DeploymentJob>,
        k8s_service: KubernetesService,
        db_pool: PgPool,
    ) -> Self {
        Self {
            receiver,
            k8s_service,
            db_pool,
        }
    }

    pub async fn start(mut self) {
        info!("Deployment worker started");

        while let Some(job) = self.receiver.recv().await {
            let k8s_service = self.k8s_service.clone();
            let db_pool = self.db_pool.clone();

            // Spawn task để xử lý song song
            tokio::spawn(async move {
                Self::process_deployment(job, k8s_service, db_pool).await;
            });
        }

        warn!("Deployment worker stopped");
    }

    async fn process_deployment(
        job: DeploymentJob,
        k8s_service: KubernetesService,
        db_pool: PgPool,
    ) {
        info!(
            "Processing deployment: {} ({})",
            job.deployment_id, job.app_name
        );

        // Update status to "deploying"
        if let Err(e) = Self::update_deployment_status(
            &db_pool,
            job.deployment_id,
            "deploying",
            None,
            None,
        )
        .await
        {
            error!("Failed to update deployment status to deploying: {}", e);
            return;
        }

        // Deploy to Kubernetes
        match k8s_service.deploy_application(&job).await {
            Ok(_) => {
                info!("Successfully deployed to Kubernetes: {}", job.deployment_id);

                // Poll for external IP
                let public_ip = Self::wait_for_external_ip(&k8s_service, job.deployment_id).await;
                let public_url = public_ip.as_ref().map(|ip| format!("http://{}:80", ip));

                // Update deployment with success status
                if let Err(e) = Self::update_deployment_status(
                    &db_pool,
                    job.deployment_id,
                    "running",
                    public_url.as_deref(),
                    None,
                )
                .await
                {
                    error!("Failed to update deployment status to running: {}", e);
                } else {
                    info!("Deployment {} completed successfully", job.deployment_id);
                    if let Some(ip) = public_ip {
                        info!("Public IP assigned: {}", ip);
                    }
                }
            }
            Err(e) => {
                error!("Failed to deploy to Kubernetes: {}", e);

                // Update deployment with failed status
                if let Err(db_err) = Self::update_deployment_status(
                    &db_pool,
                    job.deployment_id,
                    "failed",
                    None,
                    Some(&e.to_string()),
                )
                .await
                {
                    error!("Failed to update deployment status to failed: {}", db_err);
                }
            }
        }
    }

    async fn update_deployment_status(
        db_pool: &PgPool,
        deployment_id: Uuid,
        status: &str,
        public_url: Option<&str>,
        error_message: Option<&str>,
    ) -> Result<(), sqlx::Error> {
        sqlx::query!(
            r#"
            UPDATE deployments 
            SET status = $1, 
                url = COALESCE($2, url),
                error_message = $3,
                updated_at = NOW() 
            WHERE id = $4
            "#,
            status,
            public_url as Option<&str>,
            error_message as Option<&str>,
            deployment_id
        )
        .execute(db_pool)
        .await?;

        Ok(())
    }

    async fn wait_for_external_ip(
        k8s_service: &KubernetesService,
        deployment_id: Uuid,
    ) -> Option<String> {
        info!("Waiting for external IP for deployment: {}", deployment_id);

        for attempt in 1..=60 {
            // Wait up to 5 minutes
            match k8s_service.get_service_external_ip(&deployment_id).await {
                Ok(Some(ip)) => {
                    info!("External IP obtained after {} attempts: {}", attempt, ip);
                    return Some(ip);
                }
                Ok(None) => {
                    if attempt % 12 == 0 {
                        // Log every minute
                        info!("Still waiting for external IP... (attempt {}/60)", attempt);
                    }
                }
                Err(e) => {
                    warn!("Error checking external IP (attempt {}): {}", attempt, e);
                }
            }

            tokio::time::sleep(Duration::from_secs(5)).await;
        }

        warn!(
            "Failed to get external IP after 5 minutes for deployment: {}",
            deployment_id
        );
        None
    }
}
