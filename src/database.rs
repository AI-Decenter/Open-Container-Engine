use sqlx::{Pool, Postgres, PgPool, migrate::MigrateDatabase};
use std::time::Duration;
use std::str::FromStr;

#[derive(Clone)]
pub struct Database {
    pub pool: Pool<Postgres>,
}

impl Database {
    pub async fn new(database_url: &str) -> Result<Self, sqlx::Error> {
        // Create database if it doesn't exist
        if !Postgres::database_exists(database_url).await.unwrap_or(false) {
            tracing::info!("Creating database...");
            Postgres::create_database(database_url).await?;
        }

        // Create connection pool
        let pool = PgPool::connect(database_url).await?;

        Ok(Database { pool })
    }

    pub async fn migrate(&self) -> Result<(), sqlx::migrate::MigrateError> {
        sqlx::migrate!("./migrations").run(&self.pool).await
    }

    pub async fn close(&self) {
        self.pool.close().await;
    }
}