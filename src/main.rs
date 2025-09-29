use axum::{
    response::Json,
    routing::{get, post},
    Router,
};
use serde_json::{json, Value};
use std::net::SocketAddr;
use tower::ServiceBuilder;
use tower_http::{
    cors::CorsLayer,
    services::{ServeDir, ServeFile},
    trace::TraceLayer,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use utoipa::OpenApi;
mod auth;
mod config;
mod database;
mod deployment;
mod email;
mod error;
mod handlers;
mod jobs;
mod notifications;
mod services;
mod user;

use crate::email::EmailService;
use crate::jobs::{deployment_job::DeploymentJob, deployment_worker::DeploymentWorker};
use crate::notifications::NotificationManager;
use crate::services::webhook::WebhookService;

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
            auth::models::ForgotPasswordRequest,
            auth::models::ForgotPasswordResponse,
            auth::models::ResetPasswordRequest,
            auth::models::ResetPasswordResponse,
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
    pub notification_manager: NotificationManager,
    pub email_service: EmailService,
    pub webhook_service: WebhookService,
}
// Setup function in main.rs
pub async fn setup_deployment_system(
    db_pool: sqlx::PgPool,
    notification_manager: NotificationManager,
    webhook_service: WebhookService,
) -> Result<mpsc::Sender<DeploymentJob>, Box<dyn std::error::Error>> {
    // Create channel for deployment jobs
    let (deployment_sender, deployment_receiver) = mpsc::channel::<DeploymentJob>(100);

    // Start deployment worker
    let worker = DeploymentWorker::new(deployment_receiver, db_pool, notification_manager, webhook_service);

    tokio::spawn(async move {
        worker.start().await;
    });

    // Deployment system initialized successfully

    Ok(deployment_sender)
}
async fn open_browser_on_startup(port: u16) {
    tokio::spawn(async move {
        // Waiting server started
        tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;

        let url = format!("http://localhost:{}", port);

        // Opening browser
        println!("\n🚀 Opening browser at: {}\n", url);

        match open::that(&url) {
            Ok(()) => {}, // Browser opened successfully
            Err(e) => {
                tracing::warn!("Failed to open browser automatically: {}", e);
                println!(
                    "\n⚠️  Please open your browser manually and navigate to: {}\n",
                    url
                );
            }
        }
    });
}
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Install rustls crypto provider
    rustls::crypto::ring::default_provider()
        .install_default()
        .expect("Failed to install rustls crypto provider");
    
    // Load environment variables from .env.local file
    dotenv::from_filename(".env.local").ok();
    
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
    // Starting Container Engine API server

    // Initialize database
    let db = Database::new(&config.database_url).await?;

    // Run migrations
    db.migrate().await?;
    // Database migrations completed

    // Initialize Redis
    let redis_client = redis::Client::open(config.redis_url.clone())?;

    // Test Redis connection
    let mut redis_conn = redis_client.get_multiplexed_async_connection().await?;
    redis::cmd("PING")
        .query_async::<_, String>(&mut redis_conn)
        .await?;
    // Redis connection established
    // Setup notification manager
    let notification_manager = NotificationManager::new();

    // Setup webhook service
    let webhook_service = WebhookService::new();

    // Setup deployment system
    let deployment_sender =
        setup_deployment_system(db.pool.clone(), notification_manager.clone(), webhook_service.clone()).await?;
    // Setup email service with better error handling
    let email_service = match (
        std::env::var("MAILTRAP_USERNAME"),
        std::env::var("MAILTRAP_PASSWORD")
    ) {
        (Ok(username), Ok(password)) => {
            match EmailService::new(
                &std::env::var("MAILTRAP_SMTP_HOST")
                    .unwrap_or_else(|_| "live.smtp.mailtrap.io".to_string()),
                std::env::var("MAILTRAP_SMTP_PORT")
                    .unwrap_or_else(|_| "587".to_string())
                    .parse()
                    .unwrap_or(587),
                &username,
                &password,
                &std::env::var("EMAIL_FROM")
                    .unwrap_or_else(|_| "noreply@vinhomes.co.uk".to_string()),
                &std::env::var("EMAIL_FROM_NAME")
                    .unwrap_or_else(|_| "Container Engine".to_string()),
            ) {
                Ok(service) => {
                    // Email service initialized successfully
                    service
                },
                Err(e) => {
                    tracing::warn!("Failed to initialize email service: {}", e);
                    tracing::warn!("Email functionality will be disabled");
                    // Create a dummy email service that doesn't send emails
                    EmailService::new(
                        "localhost",
                        587,
                        "dummy",
                        "dummy",
                        "noreply@vinhomes.co.uk",
                        "Container Engine",
                    ).unwrap_or_else(|_| panic!("Failed to create dummy email service"))
                }
            }
        },
        _ => {
            tracing::warn!("Email credentials not provided. Email functionality will be disabled");
            EmailService::new(
                "localhost",
                587,
                "dummy",
                "dummy", 
                "noreply@vinhomes.co.uk",
                "Container Engine",
            ).unwrap_or_else(|_| panic!("Failed to create dummy email service"))
        }
    };
    
    // Create app state
    let state = AppState {
        db,
        redis: redis_client,
        config: config.clone(),
        deployment_sender,
        notification_manager,
        email_service,
        webhook_service,
    };

    // Build our application with routes
    let app = create_app(state);

    // Run the server
    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    // Server listening
    // Automatically open browser in development mode
    let is_dev = std::env::var("ENVIRONMENT").unwrap_or_default() != "production";
    let auto_open =
        std::env::var("AUTO_OPEN_BROWSER").unwrap_or_else(|_| "true".to_string()) == "true";

    if is_dev && auto_open {
        open_browser_on_startup(config.port).await;
    }
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

fn create_app(state: AppState) -> Router {
    let frontend_path = std::env::var("FRONTEND_PATH")
        .unwrap_or_else(|_| "./apps/container-engine-frontend/dist".to_string());
    let frontend_exists = std::path::Path::new(&frontend_path).exists();
    if !frontend_exists {
        tracing::error!("Frontend directory does not exist at: {}", frontend_path);
        tracing::error!("Please build the frontend first:");
        tracing::error!("  cd apps/container-engine-frontend");
        tracing::error!("  npm install && npm run build");
        println!("\n❌ Frontend not found! Please build it first:");
        println!("   cd apps/container-engine-frontend");
        println!("   npm install && npm run build\n");
    } else {
        // Serving frontend

        // Check index.html file
        let index_exists = std::path::Path::new(&format!("{}/index.html", frontend_path)).exists();
        if !index_exists {
            tracing::warn!("index.html not found in frontend directory");
        }
    }

    let index_path = format!("{}/index.html", frontend_path);
    let serve_dir = ServeDir::new(&frontend_path).not_found_service(ServeFile::new(&index_path));
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
        .route("/v1/auth/forgot-password", post(handlers::auth::forgot_password))
        .route("/v1/auth/reset-password", post(handlers::auth::reset_password))
        // API Key management
        .route(
            "/v1/api-keys",
            get(handlers::auth::list_api_keys).post(handlers::auth::create_api_key),
        )
        .route(
            "/v1/api-keys/:key_id",
            axum::routing::delete(handlers::auth::revoke_api_key),
        )
        // User profile management
        .route(
            "/v1/user/profile",
            get(handlers::user::get_profile).put(handlers::user::update_profile),
        )
        .route(
            "/v1/user/password",
            axum::routing::put(handlers::user::change_password),
        )
        // Deployment management
        .route(
            "/v1/deployments",
            get(handlers::deployment::list_deployments).post(handlers::deployment::create_deployment),
        )
        .route(
            "/v1/deployments/:deployment_id",
            get(handlers::deployment::get_deployment)
                .put(handlers::deployment::update_deployment)
                .delete(handlers::deployment::delete_deployment),
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
            get(handlers::deployment::list_domains).post(handlers::deployment::add_domain),
        )
        .route(
            "/v1/deployments/:deployment_id/domains/:domain_id",
            axum::routing::delete(handlers::deployment::remove_domain),
        )
        .route(
            "/v1/deployments/:deployment_id/logs/stream",
            get(handlers::logs::ws_logs_handler),
        )
        .route(
            "/v1/deployments/:deployment_id/logs",
            get(handlers::logs::get_logs_handler),
        )
         .route(
            "/v1/deployments/:deployment_id/pods",
            get(handlers::logs::get_deployment_pods),
        )
        .route("/v1/deployments/:deployment_id/pods/:pod_name/logs", get(handlers::logs::get_pod_logs))
        .route("/v1/deployments/:deployment_id/pods/:pod_name/logs/ws", get(handlers::logs::ws_pod_logs_handler))
        // WebSocket notifications
        .route(
            "/v1/ws/notifications",
            get(notifications::websocket::websocket_handler),
        )
        .route(
            "/v1/ws/health",
            get(notifications::websocket::websocket_health),
        )
        // Notification testing endpoints
        .route(
            "/v1/notifications/test",
            get(handlers::notifications::send_test_notification),
        )
        .route(
            "/v1/notifications/stats",
            get(handlers::notifications::get_notification_stats),
        )
        // Webhook management
        .route(
            "/v1/webhooks",
            get(handlers::webhooks::list_webhooks).post(handlers::webhooks::create_webhook),
        )
        .route(
            "/v1/webhooks/:webhook_id",
            get(handlers::webhooks::get_webhook)
                .put(handlers::webhooks::update_webhook)
                .delete(handlers::webhooks::delete_webhook),
        )
        .route(
            "/v1/webhooks/:webhook_id/test",
            post(handlers::webhooks::test_webhook),
        )
        // Serve static files
        .fallback_service(serve_dir)
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
