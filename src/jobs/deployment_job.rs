use serde::{Deserialize, Serialize};
use uuid::Uuid;
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeploymentJob {
    pub deployment_id: Uuid,
    pub user_id: Uuid,
    pub app_name: String,
    pub github_image_tag: String,
    pub port: i32,
    pub env_vars: HashMap<String, String>,
    pub replicas: i32,
    pub resources: Option<serde_json::Value>,
    pub health_check: Option<serde_json::Value>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

impl DeploymentJob {
    pub fn new(
        deployment_id: Uuid,
        user_id: Uuid,
        app_name: String,
        github_image_tag: String,
        port: i32,
        env_vars: Option<HashMap<String, String>>,
        replicas: Option<i32>,
        resources: Option<serde_json::Value>,
        health_check: Option<serde_json::Value>,
    ) -> Self {
        Self {
            deployment_id,
            user_id,
            app_name,
            github_image_tag,
            port,
            env_vars: env_vars.unwrap_or_default(),
            replicas: replicas.unwrap_or(1),
            resources,
            health_check,
            created_at: chrono::Utc::now(),
        }
    }
}