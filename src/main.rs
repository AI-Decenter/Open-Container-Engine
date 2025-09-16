use axum::{
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use serde_json::{json, Value};
use std::net::SocketAddr;
use tower::ServiceBuilder;
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

mod auth;
mod config;
mod database;
mod deployment;
mod error;
mod handlers;
mod user;
mod jobs;
mod services;

use crate::jobs::{deployment_job::DeploymentJob, deployment_worker::DeploymentWorker};
use crate::services::kubernetes::KubernetesService;
use config::Config;
use database::Database;
use error::AppError;
use tokio::sync::mpsc;

#[derive(OpenApi)]
#[openapi(
    paths(
        handlers::auth::register,
        handlers::auth::login,
        handlers::auth::refresh_token,
        handlers::auth::logout,
        handlers::auth::create_api_key,
        handlers::auth::list_api_keys,
        handlers::auth::revoke_api_key,
        handlers::user::get_profile,
        handlers::user::update_profile,
        handlers::user::change_password,
        health_check,
    ),
    components(
        schemas(
            auth::models::RegisterRequest,
            auth::models::LoginRequest,
            auth::models::AuthResponse,
            auth::models::UserInfo,
            auth::models::RefreshTokenRequest,
            auth::models::RefreshTokenResponse,
            auth::models::CreateApiKeyRequest,
            auth::models::ApiKeyResponse,
            auth::models::ApiKeyListItem,
            auth::models::ApiKeyListResponse,
            auth::models::PaginationInfo,
            user::models::UserProfile,
            user::models::UpdateProfileRequest,
            user::models::ChangePasswordRequest,
            error::ErrorResponse,
            error::ErrorDetails,
        )
    ),
    tags(
        (name = "Authentication", description = "User authentication and authorization"),
        (name = "API Keys", description = "API key management"),
        (name = "User", description = "User profile management"),
        (name = "Health", description = "Health check endpoints"),
    ),
    info(
        title = "Container Engine API",
        version = "0.1.0",
        description = "An open-source alternative to Google Cloud Run built with Rust & Axum",
        license(name = "MIT"),
        contact(name = "Container Engine", url = "https://github.com/ngocbd/Open-Container-Engine")
    ),
    servers(
        (url = "http://localhost:3000", description = "Local development server"),
    )
)]
struct ApiDoc;

#[derive(Clone)]
pub struct AppState {
    pub db: Database,
    pub redis: redis::Client,
    pub config: Config,
    pub deployment_sender: mpsc::Sender<DeploymentJob>,
}
// Setup function trong main.rs
pub async fn setup_deployment_system(
    db_pool: sqlx::PgPool,
    k8s_namespace: Option<String>,
) -> Result<(KubernetesService, mpsc::Sender<DeploymentJob>), Box<dyn std::error::Error>> {
    
    // Initialize Kubernetes service
    let k8s_service = KubernetesService::new(k8s_namespace).await?;

    // Create channel for deployment jobs
    let (deployment_sender, deployment_receiver) = mpsc::channel::<DeploymentJob>(100);

    // Start deployment worker
    let worker = DeploymentWorker::new(
        deployment_receiver,
        k8s_service.clone(),
        db_pool,
    );

    tokio::spawn(async move {
        worker.start().await;
    });

    tracing::info!("Deployment system initialized successfully");
    
    Ok((k8s_service, deployment_sender))
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "container_engine=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load configuration
    let config = Config::new()?;
    tracing::info!("Starting Container Engine API server");

    // Initialize database
    let db = Database::new(&config.database_url).await?;

    // Run migrations
    db.migrate().await?;
    tracing::info!("Database migrations completed");

    // Initialize Redis
    let redis_client = redis::Client::open(config.redis_url.clone())?;

    // Test Redis connection
    let mut redis_conn = redis_client.get_multiplexed_async_connection().await?;
    redis::cmd("PING")
        .query_async::<_, String>(&mut redis_conn)
        .await?;
    tracing::info!("Redis connection established");
     // Setup deployment system
    let (_k8s_service, deployment_sender) = setup_deployment_system(
        db.pool.clone(), 
        config.kubernetes_namespace.clone(), 
    ).await?;
    // Create app state
    let state = AppState {
        db,
        redis: redis_client,
        config: config.clone(),
        deployment_sender
    };

    // Build our application with routes
    let app = create_app(state);

    // Run the server
    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    tracing::info!("Server listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

fn create_app(state: AppState) -> Router {
    Router::new()
        // Health check endpoint
        .route("/health", get(health_check))
        // API documentation via direct routing
        .route("/swagger-ui", get(|| async { "Swagger UI would be here" }))
        .route(
            "/api-docs/openapi.json",
            get(|| async { Json(ApiDoc::openapi()) }),
        )
        // Authentication routes
        .route("/v1/auth/register", post(handlers::auth::register))
        .route("/v1/auth/login", post(handlers::auth::login))
        .route("/v1/auth/refresh", post(handlers::auth::refresh_token))
        .route("/v1/auth/logout", post(handlers::auth::logout))
        // API Key management
        .route("/v1/api-keys", get(handlers::auth::list_api_keys))
        .route("/v1/api-keys", post(handlers::auth::create_api_key))
        .route(
            "/v1/api-keys/:key_id",
            axum::routing::delete(handlers::auth::revoke_api_key),
        )
        // User profile management
        .route("/v1/user/profile", get(handlers::user::get_profile))
        .route(
            "/v1/user/profile",
            axum::routing::put(handlers::user::update_profile),
        )
        .route(
            "/v1/user/password",
            axum::routing::put(handlers::user::change_password),
        )
        // Deployment management
        .route(
            "/v1/deployments",
            get(handlers::deployment::list_deployments),
        )
        .route(
            "/v1/deployments",
            post(handlers::deployment::create_deployment),
        )
        .route(
            "/v1/deployments/:deployment_id",
            get(handlers::deployment::get_deployment),
        )
        .route(
            "/v1/deployments/:deployment_id",
            axum::routing::put(handlers::deployment::update_deployment),
        )
        .route(
            "/v1/deployments/:deployment_id",
            axum::routing::delete(handlers::deployment::delete_deployment),
        )
        .route(
            "/v1/deployments/:deployment_id/scale",
            axum::routing::patch(handlers::deployment::scale_deployment),
        )
        .route(
            "/v1/deployments/:deployment_id/start",
            post(handlers::deployment::start_deployment),
        )
        .route(
            "/v1/deployments/:deployment_id/stop",
            post(handlers::deployment::stop_deployment),
        )
        .route(
            "/v1/deployments/:deployment_id/logs",
            get(handlers::deployment::get_logs),
        )
        .route(
            "/v1/deployments/:deployment_id/metrics",
            get(handlers::deployment::get_metrics),
        )
        .route(
            "/v1/deployments/:deployment_id/status",
            get(handlers::deployment::get_status),
        )
        // Domain management
        .route(
            "/v1/deployments/:deployment_id/domains",
            get(handlers::deployment::list_domains),
        )
        .route(
            "/v1/deployments/:deployment_id/domains",
            post(handlers::deployment::add_domain),
        )
        .route(
            "/v1/deployments/:deployment_id/domains/:domain_id",
            axum::routing::delete(handlers::deployment::remove_domain),
        )
        // Add middleware
        .layer(
            ServiceBuilder::new()
                .layer(TraceLayer::new_for_http())
                .layer(CorsLayer::permissive()),
        )
        .with_state(state)
}

#[utoipa::path(
    get,
    path = "/health",
    responses(
        (status = 200, description = "Service health status"),
    ),
    tag = "Health"
)]
async fn health_check() -> Result<Json<Value>, AppError> {
    Ok(Json(json!({
        "status": "healthy",
        "service": "container-engine",
        "version": env!("CARGO_PKG_VERSION")
    })))
}
