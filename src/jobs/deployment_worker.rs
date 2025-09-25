use sqlx::PgPool;
use std::time::Duration;
use tokio::sync::mpsc;
use tracing::{error, info, warn};
use uuid::Uuid;

use crate::jobs::deployment_job::DeploymentJob;
use crate::notifications::{NotificationManager, NotificationType};
use crate::services::kubernetes::KubernetesService;
use crate::services::webhook::WebhookService;

pub struct DeploymentWorker {
    receiver: mpsc::Receiver<DeploymentJob>,
    db_pool: PgPool,
    notification_manager: NotificationManager,
    webhook_service: WebhookService,
}

impl DeploymentWorker {
    pub fn new(
        receiver: mpsc::Receiver<DeploymentJob>, 
        db_pool: PgPool, 
        notification_manager: NotificationManager,
        webhook_service: WebhookService,
    ) -> Self {
        Self { 
            receiver, 
            db_pool, 
            notification_manager,
            webhook_service,
        }
    }

    pub async fn start(mut self) {
        info!("Deployment worker started");

        while let Some(job) = self.receiver.recv().await {
            info!("Processing deployment job: {}", job.deployment_id);

            let k8s_service = match KubernetesService::for_deployment(&job.deployment_id, &job.user_id).await {
                Ok(service) => service,
                Err(e) => {
                    error!(
                        "Failed to create K8s service for deployment {} (user {}): {}",
                        job.deployment_id, job.user_id, e
                    );
                    if let Err(e) = Self::update_deployment_status(
                        &self.db_pool,
                        job.deployment_id,
                        "failed",
                        None,
                        Some(&format!("Failed to initialize Kubernetes service: {}", e)),
                    )
                    .await
                    {
                        error!("Failed to update deployment status: {}", e);
                    }
                    continue;
                }
            };

            self.process_deployment(job, k8s_service).await;
        }

        warn!("Deployment worker stopped");
    }

    async fn process_deployment(&self, job: DeploymentJob, k8s_service: KubernetesService) {
        info!(
            "Processing deployment: {} ({}) on port {}",
            job.deployment_id, job.app_name, job.port
        );

        // Update status to "deploying"
        if let Err(e) = Self::update_deployment_status(
            &self.db_pool,
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

        // Call user webhooks for deployment started
        self.call_user_webhooks(job.user_id, crate::user::webhook_models::WebhookEvent::DeploymentStarted, &job).await;

        // Send notification that deployment is being processed
        self.notification_manager
            .send_to_user(
                job.user_id,
                NotificationType::DeploymentStatusChanged {
                    deployment_id: job.deployment_id,
                    status: "deploying".to_string(),
                    url: None,
                    error_message: None,
                },
            )
            .await;

        // Deploy to Kubernetes
        match k8s_service.deploy_application(&job).await {
            Ok(_) => {
                info!("Successfully deployed to Kubernetes: {} on port {}", job.deployment_id, job.port);

                // Wait a moment for ingress to be ready
                tokio::time::sleep(Duration::from_secs(5)).await;

                // Get the ingress URL after successful deployment
                match k8s_service.get_ingress_url(&job.deployment_id).await {
                    Ok(ingress_url) => {
                        info!("Retrieved ingress URL: {:?}", ingress_url);

                        // Update deployment with success status and URL
                        if let Err(e) = Self::update_deployment_status(
                            &self.db_pool,
                            job.deployment_id,
                            "running",
                            ingress_url.as_deref(),
                            None,
                        )
                        .await
                        {
                            error!("Failed to update deployment status to running: {}", e);
                        } else {
                            info!("Deployment {} completed successfully", job.deployment_id);
                            if let Some(url) = &ingress_url {
                                info!("Application accessible at: {}", url);
                            }

                            // Call user webhooks for successful deployment
                            self.call_user_webhooks_with_url(job.user_id, crate::user::webhook_models::WebhookEvent::DeploymentCompleted, &job, ingress_url.clone()).await;

                            // Send success notification
                            self.notification_manager
                                .send_to_user(
                                    job.user_id,
                                    NotificationType::DeploymentStatusChanged {
                                        deployment_id: job.deployment_id,
                                        status: "running".to_string(),
                                        url: ingress_url.clone(),
                                        error_message: None,
                                    },
                                )
                                .await;
                        }
                    }
                    Err(e) => {
                        error!("Failed to get ingress URL: {}", e);
                        // Still mark as running since deployment succeeded, just no URL yet
                        if let Err(e) = Self::update_deployment_status(
                            &self.db_pool,
                            job.deployment_id,
                            "running",
                            None,
                            Some("Deployment successful but ingress URL not ready yet"),
                        )
                        .await
                        {
                            error!("Failed to update deployment status: {}", e);
                        } else {
                            // Call user webhooks for completed deployment
                            self.call_user_webhooks(job.user_id, crate::user::webhook_models::WebhookEvent::DeploymentCompleted, &job).await;

                            // Send partial success notification
                            self.notification_manager
                                .send_to_user(
                                    job.user_id,
                                    NotificationType::DeploymentStatusChanged {
                                        deployment_id: job.deployment_id,
                                        status: "running".to_string(),
                                        url: None,
                                        error_message: Some("Deployment successful but URL not ready yet".to_string()),
                                    },
                                )
                                .await;
                        }
                    }
                }
            }
            Err(e) => {
                error!("Failed to deploy to Kubernetes: {}", e);
                
                // Cleanup namespace on failure
                if let Err(cleanup_err) = k8s_service.delete_deployment_namespace(&job.deployment_id).await {
                    warn!("Failed to cleanup namespace after deployment failure: {}", cleanup_err);
                }
                
                // Update deployment with failed status
                if let Err(db_err) = Self::update_deployment_status(
                    &self.db_pool,
                    job.deployment_id,
                    "failed",
                    None,
                    Some(&e.to_string()),
                )
                .await
                {
                    error!("Failed to update deployment status to failed: {}", db_err);
                } else {
                    // Call user webhooks for failed deployment
                    self.call_user_webhooks(job.user_id, crate::user::webhook_models::WebhookEvent::DeploymentFailed, &job).await;

                    // Send failure notification
                    self.notification_manager
                        .send_to_user(
                            job.user_id,
                            NotificationType::DeploymentStatusChanged {
                                deployment_id: job.deployment_id,
                                status: "failed".to_string(),
                                url: None,
                                error_message: Some(e.to_string()),
                            },
                        )
                        .await;
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

    // Call user-configured webhooks instead of system webhook
    async fn call_user_webhooks(
        &self,
        user_id: Uuid,
        event: crate::user::webhook_models::WebhookEvent,
        deployment_job: &DeploymentJob,
    ) {
        self.call_user_webhooks_with_url(user_id, event, deployment_job, None).await;
    }

    // Call user-configured webhooks with optional URL
    async fn call_user_webhooks_with_url(
        &self,
        user_id: Uuid,
        event: crate::user::webhook_models::WebhookEvent,
        deployment_job: &DeploymentJob,
        app_url: Option<String>,
    ) {
        // Get all active webhooks for this user that subscribe to this event
        let event_str = event.as_str();
        let webhooks = match sqlx::query!(
            r#"
            SELECT id, url, secret 
            FROM user_webhooks 
            WHERE user_id = $1 AND is_active = true 
            AND ($2 = ANY(events) OR 'all' = ANY(events))
            "#,
            user_id,
            event_str
        )
        .fetch_all(&self.db_pool)
        .await
        {
            Ok(webhooks) => webhooks,
            Err(e) => {
                error!("Failed to fetch user webhooks for user {}: {}", user_id, e);
                return;
            }
        };

        if webhooks.is_empty() {
            info!("No active webhooks found for user {} and event {}", user_id, event_str);
            return;
        }

        let client = reqwest::Client::new();
        
        // Determine status and URL based on event
        let (status, url): (&str, Option<String>) = match event {
            crate::user::webhook_models::WebhookEvent::DeploymentStarted => ("started", None),
            crate::user::webhook_models::WebhookEvent::DeploymentCompleted => ("completed", app_url),
            crate::user::webhook_models::WebhookEvent::DeploymentFailed => ("failed", None),
            crate::user::webhook_models::WebhookEvent::DeploymentDeleted => ("deleted", None),
            crate::user::webhook_models::WebhookEvent::All => ("unknown", None), // This shouldn't happen in practice
        };
        
        for webhook in webhooks {
            // Use the same payload format as the old webhook service
            let webhook_payload = serde_json::json!({
                "deployment_id": deployment_job.deployment_id,
                "status": status,
                "type": event_str,
                "timestamp": chrono::Utc::now(),
                "app_name": deployment_job.app_name,
                "user_id": deployment_job.user_id,
                "url": url
            });

            let mut request = client
                .post(&webhook.url)
                .header("Content-Type", "application/json")
                .header("User-Agent", "Container-Engine-Webhook/1.0")
                .json(&webhook_payload)
                .timeout(Duration::from_secs(10));

            // Add signature if secret is provided
            if let Some(secret) = webhook.secret {
                // TODO: Implement HMAC signature
                // let signature = create_hmac_signature(&webhook_payload, &secret);
                // request = request.header("X-Webhook-Signature", signature);
            }

            match request.send().await {
                Ok(response) => {
                    if response.status().is_success() {
                        info!("Successfully sent webhook to {} for event {}", webhook.url, event_str);
                    } else {
                        warn!(
                            "Webhook call failed: {} returned status {}",
                            webhook.url,
                            response.status()
                        );
                    }
                }
                Err(e) => {
                    error!("Failed to send webhook to {}: {}", webhook.url, e);
                }
            }
        }
    }
}
