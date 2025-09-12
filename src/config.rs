use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub database_url: String,
    pub redis_url: String,
    pub port: u16,
    pub jwt_secret: String,
    pub jwt_expires_in: i64, // seconds
    pub api_key_prefix: String,
    pub kubernetes_namespace: String,
    pub domain_suffix: String,
}

impl Config {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        // Determine environment and load appropriate .env file
        let environment = env::var("ENVIRONMENT").unwrap_or_else(|_| "development".to_string());
        
        let env_file = match environment.as_str() {
            "test" | "integrate_test" => ".env.integrate_test",
            "development" | "dev" => ".env.development",
            _ => ".env.development", // default to development
        };
        
        // Try to load the environment-specific file, fall back to default .env
        if let Err(_) = dotenv::from_filename(env_file) {
            dotenv::dotenv().ok();
        }

        let config = Config {
            database_url: env::var("DATABASE_URL")
                .unwrap_or_else(|_| "postgresql://postgres:password@localhost/container_engine".to_string()),
            redis_url: env::var("REDIS_URL")
                .unwrap_or_else(|_| "redis://localhost:6379".to_string()),
            port: env::var("PORT")
                .unwrap_or_else(|_| "3000".to_string())
                .parse()
                .unwrap_or(3000),
            jwt_secret: env::var("JWT_SECRET")
                .unwrap_or_else(|_| "your-super-secret-jwt-key-change-this-in-production".to_string()),
            jwt_expires_in: env::var("JWT_EXPIRES_IN")
                .unwrap_or_else(|_| "3600".to_string()) // 1 hour
                .parse()
                .unwrap_or(3600),
            api_key_prefix: env::var("API_KEY_PREFIX")
                .unwrap_or_else(|_| "ce_api_".to_string()),
            kubernetes_namespace: env::var("KUBERNETES_NAMESPACE")
                .unwrap_or_else(|_| "container-engine".to_string()),
            domain_suffix: env::var("DOMAIN_SUFFIX")
                .unwrap_or_else(|_| "container-engine.app".to_string()),
        };

        Ok(config)
    }
}