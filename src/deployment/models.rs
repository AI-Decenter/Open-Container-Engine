use chrono::{DateTime, Utc};
use regex::Regex;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::FromRow;
use std::collections::HashMap;
use utoipa::ToSchema;
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Clone, FromRow, Serialize, Deserialize, ToSchema)]
pub struct Deployment {
    pub id: Uuid,
    pub user_id: Uuid,
    pub app_name: String,
    pub image: String,
    pub port: i32,
    pub env_vars: Value, // JSON object
    pub replicas: i32,
    pub resources: Value,            // JSON object
    pub health_check: Option<Value>, // JSON object
    pub status: String,
    pub url: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deployed_at: Option<DateTime<Utc>>,
    pub error_message: Option<String>,
}

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct CreateDeploymentRequest {
    /// Application name (1-63 characters, DNS-compatible)
    #[validate(length(min = 1, max = 63))]
    pub app_name: String,
    /// Container image URL
    #[validate(length(min = 1))]
    pub image: String,
    /// Port number the container listens on (1-65535)
    #[validate(range(min = 1, max = 65535))]
    pub port: i32,
    /// Environment variables
    pub env_vars: Option<HashMap<String, String>>,
    /// Number of replicas (1-100)
    #[validate(range(min = 1, max = 100))]
    pub replicas: Option<i32>,
    /// Resource requirements
    pub resources: Option<ResourceRequirements>,
    /// Health check configuration
    pub health_check: Option<HealthCheck>,
    /// Registry authentication (if required)
    pub registry_auth: Option<RegistryAuth>,
}

#[derive(Debug, Serialize, Deserialize, Validate, Default, ToSchema)]
pub struct ResourceRequirements {
    /// CPU request/limit (e.g., "100m", "0.5")
    pub cpu: Option<String>,
    /// Memory request/limit (e.g., "128Mi", "1Gi")
    pub memory: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Validate, ToSchema)]
pub struct HealthCheck {
    /// Health check endpoint path
    #[validate(length(min = 1))]
    pub path: String,
    /// Initial delay before first health check (0-300 seconds)
    #[validate(range(min = 0, max = 300))]
    pub initial_delay_seconds: Option<i32>,
    /// Interval between health checks (1-300 seconds)
    #[validate(range(min = 1, max = 300))]
    pub period_seconds: Option<i32>,
    /// Timeout for each health check (1-60 seconds)
    #[validate(range(min = 1, max = 60))]
    pub timeout_seconds: Option<i32>,
    /// Number of failures before marking unhealthy (1-10)
    #[validate(range(min = 1, max = 10))]
    pub failure_threshold: Option<i32>,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct RegistryAuth {
    /// Registry username
    pub username: String,
    /// Registry password
    pub password: String,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct DeploymentResponse {
    pub id: Uuid,
    pub app_name: String,
    pub image: String,
    pub status: String,
    pub url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub message: String,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct DeploymentListItem {
    pub id: Uuid,
    pub app_name: String,
    pub image: String,
    pub status: String,
    pub url: String,
    pub replicas: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct DeploymentListResponse {
    pub deployments: Vec<DeploymentListItem>,
    pub pagination: PaginationInfo,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct PaginationInfo {
    pub page: u32,
    pub limit: u32,
    pub total: u64,
    pub total_pages: u32,
}

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct UpdateDeploymentRequest {
    /// New container image
    pub image: Option<String>,
    /// Updated environment variables
    pub env_vars: Option<HashMap<String, String>>,
    /// New replica count (1-100)
    #[validate(range(min = 1, max = 100))]
    pub replicas: Option<i32>,
    /// Updated resource requirements
    pub resources: Option<ResourceRequirements>,
}

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct ScaleDeploymentRequest {
    /// Number of replicas (0-100)
    #[validate(range(min = 0, max = 100))]
    pub replicas: i32,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct LogsQuery {
    /// Number of lines to show from the end
    pub tail: Option<i32>,
    /// Follow log output (streaming)
    pub follow: Option<bool>,
    /// Show logs after this timestamp
    pub since: Option<DateTime<Utc>>,
    /// Show logs before this timestamp
    pub until: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct LogEntry {
    pub timestamp: DateTime<Utc>,
    pub level: String,
    pub message: String,
    pub source: String,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct LogsResponse {
    pub logs: Vec<LogEntry>,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct MetricsQuery {
    /// Start time for metrics
    pub from: Option<DateTime<Utc>>,
    /// End time for metrics
    pub to: Option<DateTime<Utc>>,
    /// Metrics resolution
    pub resolution: Option<String>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct MetricPoint {
    pub timestamp: DateTime<Utc>,
    pub value: f64,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct MetricsResponse {
    pub metrics: HashMap<String, Vec<MetricPoint>>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct DeploymentStatus {
    pub status: String,
    pub health: String,
    pub replicas: ReplicaStatus,
    pub last_health_check: Option<DateTime<Utc>>,
    pub uptime: String,
    pub restart_count: i32,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct ReplicaStatus {
    pub desired: i32,
    pub ready: i32,
    pub available: i32,
}

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct AddDomainRequest {
    /// Custom domain name (1-253 characters)
    #[validate(length(min = 1, max = 253))]
    pub domain: String,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct DomainResponse {
    pub id: Uuid,
    pub domain: String,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub dns_records: Vec<DnsRecord>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct DnsRecord {
    pub record_type: String,
    pub name: String,
    pub value: String,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct DomainListResponse {
    pub domains: Vec<DomainListItem>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct DomainListItem {
    pub id: Uuid,
    pub domain: String,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub verified_at: Option<DateTime<Utc>>,
}
