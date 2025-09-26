use serde::{Deserialize, Serialize};
use uuid::Uuid;
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum JobType {
    Deploy,
    Scale { target_replicas: i32 },
    Start,
    Stop,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeploymentJob {
    pub deployment_id: Uuid,
    pub user_id: Uuid,
    pub job_type: JobType,
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
            job_type: JobType::Deploy,
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

    pub fn new_scale(
        deployment_id: Uuid,
        user_id: Uuid,
        target_replicas: i32,
        app_name: String, // Needed for webhooks
    ) -> Self {
        Self {
            deployment_id,
            user_id,
            job_type: JobType::Scale { target_replicas },
            app_name,
            github_image_tag: String::new(), // Not needed for scale
            port: 0,                         // Not needed for scale
            env_vars: HashMap::new(),
            replicas: target_replicas,
            resources: None,
            health_check: None,
            created_at: chrono::Utc::now(),
        }
    }

    pub fn new_start(
        deployment_id: Uuid,
        user_id: Uuid,
        app_name: String,
    ) -> Self {
        Self {
            deployment_id,
            user_id,
            job_type: JobType::Start,
            app_name,
            github_image_tag: String::new(),
            port: 0,
            env_vars: HashMap::new(),
            replicas: 1, // Will be determined from DB
            resources: None,
            health_check: None,
            created_at: chrono::Utc::now(),
        }
    }

    pub fn new_stop(
        deployment_id: Uuid,
        user_id: Uuid,
        app_name: String,
    ) -> Self {
        Self {
            deployment_id,
            user_id,
            job_type: JobType::Stop,
            app_name,
            github_image_tag: String::new(),
            port: 0,
            env_vars: HashMap::new(),
            replicas: 0,
            resources: None,
            health_check: None,
            created_at: chrono::Utc::now(),
        }
    }
}