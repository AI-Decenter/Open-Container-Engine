# Container Engine - Development Setup

This document provides detailed instructions for setting up and running the Container Engine project locally.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Rust** (1.70 or later) - Install from [rustup.rs](https://rustup.rs/)
- **Docker** and **Docker Compose** - For running PostgreSQL and Redis
- **Git** - For version control

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/ngocbd/Open-Container-Engine.git
cd Open-Container-Engine
```

### 2. Set Up Environment Variables

Copy the example environment file and update it:

```bash
cp .env.example .env
```

Edit `.env` to customize settings if needed. The defaults should work for local development.

### 3. Start Database Services

Using Docker Compose, start PostgreSQL and Redis:

```bash
docker-compose up postgres redis -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379

### 4. Install Dependencies and Run Migrations

```bash
# Install dependencies
cargo build

# Set up the database (requires DATABASE_URL)
export DATABASE_URL="postgresql://postgres:password@localhost:5432/container_engine"

# Run database migrations
cargo install sqlx-cli
sqlx migrate run
```

### 5. Generate SQLx Query Cache (Optional)

To enable offline compilation without a database connection:

```bash
cargo sqlx prepare
```

### 6. Run the Application

```bash
cargo run
```

The API server will start on `http://localhost:3000`.

### 7. Test the API

Check if the server is running:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "container-engine",
  "version": "0.1.0"
}
```

## Development Workflow

### Running with Docker Compose

For a complete development environment:

```bash
# Start all services (PostgreSQL, Redis, and the API)
docker-compose up --build

# Or run in the background
docker-compose up -d --build
```

### Database Management

#### Running Migrations

```bash
# Apply all pending migrations
sqlx migrate run

# Create a new migration
sqlx migrate add <migration_name>

# Revert the last migration
sqlx migrate revert
```

#### Resetting the Database

```bash
# Stop the database
docker-compose stop postgres

# Remove the database volume
docker-compose rm -f postgres
docker volume rm open-container-engine_postgres_data

# Restart and run migrations
docker-compose up postgres -d
sqlx migrate run
```

### Code Development

#### Project Structure

```
src/
├── main.rs              # Application entry point
├── config.rs            # Configuration management
├── database.rs          # Database connection and setup
├── error.rs             # Error handling and types
├── auth/                # Authentication and authorization
│   ├── mod.rs
│   ├── models.rs        # User and API key models
│   ├── jwt.rs           # JWT token management
│   └── middleware.rs    # Authentication middleware
├── user/                # User profile management
│   ├── mod.rs
│   └── models.rs
├── deployment/          # Container deployment management
│   ├── mod.rs
│   └── models.rs
└── handlers/            # HTTP request handlers
    ├── mod.rs
    ├── auth.rs          # Authentication endpoints
    ├── user.rs          # User management endpoints
    └── deployment.rs    # Deployment endpoints
```

#### Running Tests

```bash
# Run all tests
cargo test

# Run tests with output
cargo test -- --nocapture

# Run specific test module
cargo test auth
```

#### Code Formatting and Linting

```bash
# Format code
cargo fmt

# Check for linting issues
cargo clippy

# Check compilation without building
cargo check
```

## API Documentation

The API provides the following main endpoints:

### Authentication
- `POST /v1/auth/register` - Register a new user
- `POST /v1/auth/login` - Login and get tokens
- `POST /v1/auth/refresh` - Refresh access token
- `POST /v1/auth/logout` - Logout

### API Key Management  
- `GET /v1/api-keys` - List API keys
- `POST /v1/api-keys` - Create API key
- `DELETE /v1/api-keys/{id}` - Revoke API key

### User Profile
- `GET /v1/user/profile` - Get user profile
- `PUT /v1/user/profile` - Update profile
- `PUT /v1/user/password` - Change password

### Deployment Management
- `GET /v1/deployments` - List deployments
- `POST /v1/deployments` - Create deployment
- `GET /v1/deployments/{id}` - Get deployment details
- `PUT /v1/deployments/{id}` - Update deployment
- `DELETE /v1/deployments/{id}` - Delete deployment
- `PATCH /v1/deployments/{id}/scale` - Scale deployment
- `POST /v1/deployments/{id}/start` - Start deployment
- `POST /v1/deployments/{id}/stop` - Stop deployment

For detailed API documentation, see [APIs.md](./APIs.md).

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/container_engine` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `PORT` | Server port | `3000` |
| `JWT_SECRET` | JWT signing secret | `your-super-secret-jwt-key-change-this-in-production` |
| `JWT_EXPIRES_IN` | JWT expiration time (seconds) | `3600` |
| `API_KEY_PREFIX` | API key prefix | `ce_api_` |
| `KUBERNETES_NAMESPACE` | Kubernetes namespace | `container-engine` |
| `DOMAIN_SUFFIX` | Domain suffix for deployments | `container-engine.app` |
| `RUST_LOG` | Logging level | `container_engine=debug,tower_http=debug` |

## Troubleshooting

### Database Connection Issues

1. Ensure PostgreSQL is running:
   ```bash
   docker-compose ps postgres
   ```

2. Check database logs:
   ```bash
   docker-compose logs postgres
   ```

3. Test connection manually:
   ```bash
   psql postgresql://postgres:password@localhost:5432/container_engine
   ```

### Redis Connection Issues

1. Ensure Redis is running:
   ```bash
   docker-compose ps redis
   ```

2. Test Redis connection:
   ```bash
   redis-cli ping
   ```

### SQLx Compilation Issues

If you encounter SQLx compilation errors:

1. Ensure the database is running and accessible
2. Set the `DATABASE_URL` environment variable
3. Run `cargo sqlx prepare` to generate the query cache
4. Use `SQLX_OFFLINE=true` for builds without database access

### Port Conflicts

If ports 3000, 5432, or 6379 are already in use:

1. Update the ports in `docker-compose.yml`
2. Update corresponding environment variables
3. Restart the services

## Production Deployment

For production deployment:

1. Use secure values for `JWT_SECRET`
2. Configure proper database credentials
3. Set up SSL/TLS certificates
4. Configure proper logging levels
5. Set up monitoring and alerting
6. Use a reverse proxy (nginx, traefik)
7. Configure Kubernetes cluster access

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and ensure they pass
5. Submit a pull request

For more details, see the main [README.md](./README.md).