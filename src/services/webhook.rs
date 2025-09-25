use reqwest;
use serde::{Deserialize, Serialize};
use tracing::{error, info, warn};
use uuid::Uuid;

#[derive(Debug, Serialize)]
pub struct WebhookPayload {
    pub deployment_id: Uuid,
    pub status: String,
    #[serde(rename = "type")]
    pub event_type: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub app_name: Option<String>,
    pub user_id: Option<Uuid>,
    pub url: Option<String>,
}

#[derive(Clone)]
pub struct WebhookService {
    client: reqwest::Client,
    webhook_url: Option<String>,
}

impl WebhookService {
    pub fn new() -> Self {
        let webhook_url = std::env::var("WEBHOOK_URL").ok();
        
        if webhook_url.is_none() {
            warn!("WEBHOOK_URL not configured, webhook notifications will be disabled");
        } else {
            info!("Webhook service initialized with URL: {}", webhook_url.as_ref().unwrap());
        }

        Self {
            client: reqwest::Client::new(),
            webhook_url,
        }
    }

    pub async fn send_deployment_event(
        &self,
        deployment_id: Uuid,
        status: &str,
        event_type: &str,
        app_name: Option<String>,
        user_id: Option<Uuid>,
        url: Option<String>,
    ) {
        let Some(webhook_url) = &self.webhook_url else {
            warn!("Webhook URL not configured, skipping webhook call");
            return;
        };

        let payload = WebhookPayload {
            deployment_id,
            status: status.to_string(),
            event_type: event_type.to_string(),
            timestamp: chrono::Utc::now(),
            app_name,
            user_id,
            url,
        };

        info!(
            "Sending webhook for deployment {} with status {} and type {}",
            deployment_id, status, event_type
        );

        match self
            .client
            .post(webhook_url)
            .json(&payload)
            .header("Content-Type", "application/json")
            .timeout(std::time::Duration::from_secs(30))
            .send()
            .await
        {
            Ok(response) => {
                if response.status().is_success() {
                    info!(
                        "Webhook sent successfully for deployment {}: {}",
                        deployment_id,
                        response.status()
                    );
                } else {
                    warn!(
                        "Webhook request failed for deployment {}: {} - {}",
                        deployment_id,
                        response.status(),
                        response.text().await.unwrap_or_default()
                    );
                }
            }
            Err(e) => {
                error!(
                    "Failed to send webhook for deployment {}: {}",
                    deployment_id, e
                );
            }
        }
    }

    pub async fn send_deployment_completed(&self, deployment_id: Uuid, app_name: Option<String>, user_id: Option<Uuid>, url: Option<String>) {
        self.send_deployment_event(deployment_id, "completed", "deployment_completed", app_name, user_id, url).await;
    }

    pub async fn send_deployment_failed(&self, deployment_id: Uuid, app_name: Option<String>, user_id: Option<Uuid>) {
        self.send_deployment_event(deployment_id, "failed", "deployment_failed", app_name, user_id, None).await;
    }

    pub async fn send_deployment_started(&self, deployment_id: Uuid, app_name: Option<String>, user_id: Option<Uuid>) {
        self.send_deployment_event(deployment_id, "started", "deployment_started", app_name, user_id, None).await;
    }

    pub async fn send_deployment_updated(&self, deployment_id: Uuid, app_name: Option<String>, user_id: Option<Uuid>) {
        self.send_deployment_event(deployment_id, "updated", "deployment_updated", app_name, user_id, None).await;
    }
}
