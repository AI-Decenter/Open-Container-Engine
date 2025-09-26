# Container Engine

![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)
![Code Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-green.svg)
![Documentation](https://img.shields.io/badge/docs-latest-informational.svg)
![Docker Pulls](https://img.shields.io/badge/docker%20pulls-10k-blue.svg)

```
   ____            _        _                     _____            _           
  / ___|___  _ __ | |_ __ _(_)_ __   ___ _ __   | ____|_ __   ___(_)_ __   ___ 
 | |   / _ \| '_ \| __/ _` | | '_ \ / _ \ '__|  |  _| | '_ \ / __| | '_ \ / _ \
 | |__| (_) | | | | || (_| | | | | |  __/ |     | |___| | | | (__| | | | |  __/
  \____\___/|_| |_|\__\__,_|_|_| |_|\___|_|     |_____|_| |_|\___|_|_| |_|\___|
                                                                              
```

**Deploy Containers in Seconds. Your App, Live on the Web.**

*An Open-Source Alternative to Google Cloud Run - Built with Rust & Axum*

---

## 🚀 Quick Start Guide

### Prerequisites

Before getting started, ensure you have the following installed:

- **Docker** - For containerization
- **Docker Compose** - For managing multi-container applications
- **Minikube** - Local Kubernetes cluster
- **kubectl** - Kubernetes command-line tool
- **Node.js** (v16+) - For the frontend application
- **Rust** (latest stable) - For the backend
- **PostgreSQL** - Database (can be run via Docker Compose)
- **Redis** - For caching (can be run via Docker Compose)

### Installation & Setup

#### Step 1: Clone the Repository

```bash
git clone https://github.com/secus217/Open-Container-Engine.git
cd Open-Container-Engine
```

#### Step 2: Initial Setup

Run the setup script to install dependencies and configure the environment:

```bash
./setup.sh setup
```

This command will:
- Install required system dependencies
- Set up Rust toolchain
- Install Node.js dependencies for the frontend
- Configure Docker and Docker Compose
- Set up PostgreSQL and Redis via Docker Compose
- Initialize the database schema

#### Step 3: Configure Kubernetes

Create the Kubernetes configuration file by copying from the test template:

```bash
cp k8sConfigTest.yaml k8sConfig.yaml
```

Edit `k8sConfig.yaml` and replace the paths with your actual system paths:

```yaml
apiVersion: v1
clusters:
- cluster:
    certificate-authority: /home/YOUR_USERNAME/.minikube/ca.crt
    server: https://192.168.49.2:8443
  name: minikube
contexts:
- context:
    cluster: minikube
    namespace: default
    user: minikube
  name: minikube
current-context: minikube
kind: Config
users:
- name: minikube
  user:
    client-certificate: /home/YOUR_USERNAME/.minikube/profiles/minikube/client.crt
    client-key: /home/YOUR_USERNAME/.minikube/profiles/minikube/client.key
```

#### Step 4: Environment Configuration

Create your local environment configuration:

```bash
cp .env.development .env.local
```

Edit `.env.local` to match your local setup:

```bash
# Development environment configuration for Container Engine
DATABASE_URL=postgresql://postgres:password@localhost:5432/container_engine
REDIS_URL=redis://localhost:6379
PORT=3000
JWT_SECRET=your-secure-jwt-secret-for-development
JWT_EXPIRES_IN=3600
API_KEY_PREFIX=ce_dev_
KUBERNETES_NAMESPACE=container-engine-dev
DOMAIN_SUFFIX=.local.dev
MAILTRAP_SMTP_HOST=your_host
MAILTRAP_SMTP_PORT=587
MAILTRAP_USERNAME=your_mailtrap_username
MAILTRAP_PASSWORD=your_mailtrap_password
EMAIL_FROM=noreply@containerengine.local
EMAIL_FROM_NAME=Container Engine Dev
RUST_LOG=container_engine=debug,tower_http=debug
KUBECONFIG_PATH=./k8sConfig.yaml
```

#### Step 5: Start Minikube & Enable Ingress

Start your local Kubernetes cluster:

```bash
# Start Minikube
minikube start

# Enable the ingress addon
minikube addons enable ingress

# Verify Minikube is running
minikube status
```

#### Step 6: Run the Development Environment

Start all services in development mode:

```bash
./setup.sh dev
```

This command will:
- Start PostgreSQL and Redis containers
- Run database migrations
- Start the Rust backend server
- Start the React frontend development server
- Set up Kubernetes resources
- Open your browser to `http://localhost:3000`

### 🎯 Accessing the Application

Once the setup is complete, you can access:

- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/docs
- **Database**: localhost:5432 (postgres/password)
- **Redis**: localhost:6379

### 🔧 Development Commands

| Command | Description |
|---------|-------------|
| `./setup.sh setup` | Initial project setup and dependency installation |
| `./setup.sh dev` | Start development environment |
| `./setup.sh build` | Build the project for production |
| `./setup.sh test` | Run all tests |
| `./setup.sh clean` | Clean build artifacts and docker containers |
| `./setup.sh logs` | View application logs |

### 🐛 Troubleshooting

#### Common Issues

**1. Minikube not starting:**
```bash
# Reset Minikube if it fails to start
minikube delete
minikube start --driver=docker
```

**2. Port already in use:**
```bash
# Check which process is using port 3000 or 8080
sudo lsof -i :3000
sudo lsof -i :8080

# Kill the process if needed
sudo kill -9 <PID>
```

**3. Database connection errors:**
```bash
# Restart PostgreSQL container
docker-compose restart postgres

# Check database logs
docker-compose logs postgres
```

**4. Kubernetes configuration issues:**
```bash
# Verify Minikube status
minikube status

# Check Kubernetes cluster info
kubectl cluster-info

# Verify ingress is enabled
minikube addons list | grep ingress
```

**5. Frontend build errors:**
```bash
# Clear npm cache and reinstall
cd apps/container-engine-frontend
rm -rf node_modules package-lock.json
npm install
```

#### Getting Help

- Check the [Issues](https://github.com/secus217/Open-Container-Engine/issues) page for known problems
- Review application logs: `./setup.sh logs`
- Ensure all prerequisites are correctly installed
- Verify that all ports (3000, 8080, 5432, 6379) are available

### 📁 Project Structure

```
Open-Container-Engine/
├── apps/
│   └── container-engine-frontend/     # React frontend application
├── src/                               # Rust backend source code
├── migrations/                        # Database migration files
├── tests/                            # Integration tests
├── scripts/                          # Setup and utility scripts
├── k8sConfig.yaml                    # Kubernetes configuration
├── .env.local                        # Local environment variables
├── docker-compose.yml                # Docker services configuration
├── setup.sh                         # Main setup script
└── README.md                         # This file
```

---

## Introduction

**Container Engine** is an open-source alternative to Google Cloud Run, built with Rust and the Axum framework. This revolutionary service empowers developers to effortlessly deploy containerized applications to the internet with unprecedented simplicity and speed. By intelligently abstracting away the complexity of Kubernetes infrastructure, Container Engine creates a seamless deployment experience that lets you focus entirely on your code and business logic, not on managing infrastructure.

Unlike proprietary solutions, Container Engine provides a complete **User Management System** including user registration, authentication, API key management, and deployment management - all while being fully open-source. With Container Engine, the journey from a Docker image to a live, production-ready URL happens with just a single API call—no YAML configurations to write, no kubectl commands to remember, and no infrastructure headaches.

## Key Features

### User Management System
- **User Registration & Authentication:** Complete user registration and login system with secure password management
- **API Key Management:** Generate, manage, and revoke API keys for secure access to the platform
- **User Dashboard:** Comprehensive user interface for managing deployments, viewing usage, and account settings

### Container Deployment & Management
- **Deploy via API:** Go from container image to live URL with a single API call, reducing deployment time from hours to seconds.
- **Zero Kubernetes Hassle:** No need to write YAML or manage `kubectl`. Our engine translates simple REST API calls into complex Kubernetes configurations behind the scenes.
- **Auto-generated URLs:** Every deployment gets a clean, memorable, and instantly accessible URL with automatic HTTPS certificate provisioning and management.
- **Scalable by Design:** Built on the robust foundation of Kubernetes for reliability and scale, with built-in horizontal scaling capabilities.

### Technical Features
- **Rust + Axum Backend:** High-performance, memory-safe backend built with Rust and the modern Axum web framework
- **OpenAPI Documentation:** Complete API documentation with Swagger UI integration using utoipa
- **Registry Agnostic:** Pull public or private images from Docker Hub, Google Container Registry, Amazon ECR, GitHub Container Registry, or any other container registry with support for authentication.
- **Environment Variables Management:** Securely inject configuration through environment variables without rebuilding images.
- **Deployment Monitoring:** Real-time logs and performance metrics for all your deployments in one unified dashboard.
- **Zero Downtime Updates:** Update your applications seamlessly with rolling updates that guarantee availability.
- **Automated Setup:** Intelligent setup script that checks and installs all required dependencies automatically.

## Technology Stack

**Container Engine** is built with modern, high-performance technologies:

- **Backend:** Rust with Axum framework for maximum performance and memory safety
- **Database:** PostgreSQL for reliable data persistence
- **Container Orchestration:** Kubernetes for scalable container management
- **Authentication:** JWT tokens with bcrypt password hashing
- **Monitoring:** Prometheus metrics with Grafana dashboards
- **Logging:** Structured logging with correlation IDs

The Rust + Axum backend provides exceptional performance while ensuring memory safety and preventing common security vulnerabilities.

## Architecture Overview

Container Engine provides a sophisticated yet simple interface between developers and Kubernetes infrastructure. Users interact with the Container Engine REST API or SDK, and our service intelligently translates these high-level deployment requests into the appropriate Kubernetes objects (Deployment, Service, Ingress) on the backend cluster.

The platform handles all the complex networking configuration, ensuring that only the application's HTTP port is exposed to the internet. HTTPS is automatically configured and managed using industry-standard certificates. Upon successful deployment, users receive a public URL to access their application immediately.

```
                                      +----------------+
                                      |                |
                                      |  Container     |
                                      |  Registry      |
                                      |                |
                                      +--------+-------+
                                               |
                                               | Pull Image
                                               v
+---------------+    API Request    +----------+----------+    Manages    +----------------+
|               |                   |                     |               |                |
|   Developer   +------------------>+  Container Engine   +-------------->+   Kubernetes   |
|               |                   |                     |               |   Cluster      |
+---------------+    API Response   +----------+----------+               +--------+-------+
                                               |                                   |
                                               | Create                            |
                                               v                                   v
                                     +-------------------+              +---------------------+
                                     |                   |              |                     |
                                     |  Public URL       |<-------------+  Deployment,        |
                                     |  user.domain.app  |              |  Service, Ingress   |
                                     |                   |              |                     |
                                     +-------------------+              +---------------------+
```

The architecture is designed to be cloud-agnostic, meaning Container Engine can orchestrate deployments across multiple cloud providers or on-premise Kubernetes clusters with consistent behavior and performance.

## Getting Started

### Prerequisites
- An account with Container Engine (register via API or web interface)
- An API Key generated from your user dashboard or via the API
- A Docker image available in a container registry

## API Documentation

For comprehensive API documentation including authentication, user management, and deployment endpoints, see [APIs.md](./APIs.md).

### Installation Options

#### Python SDK
For Python developers who want programmatic control:
```bash
pip install container-engine-sdk
```

#### JavaScript/TypeScript SDK
For web and Node.js applications:
```bash
npm install container-engine-sdk
# or
yarn add container-engine-sdk
```

#### CLI Tool
For command-line enthusiasts:
```bash
# Install globally
npm install -g container-engine-cli

# Basic usage
container-engine deploy --image nginx:latest --name my-website
```

### Quick Start Guide

1. **Sign up** for a Container Engine account at [your-domain]
2. **Generate an API key** from your user dashboard
3. **Prepare your application** in a Docker container
4. **Deploy your container** using one of our SDKs or the REST API
5. **Access your application** at the automatically generated URL

## Usage (API Example)

Deploy an application using the API:

### Endpoint
`POST /v1/deployments`

### Headers
```http
Authorization: Bearer <your-api-key>
Content-Type: application/json
```

### Request Body
```json
{
	"appName": "hello-world",
	"image": "nginx:latest",
	"port": 80,
	"envVars": {
		"BACKGROUND_COLOR": "blue"
	}
}
```

### Example (curl)
```bash
curl -X POST https://api.[your-domain]/v1/deployments \
	-H "Authorization: Bearer <your-api-key>" \
	-H "Content-Type: application/json" \
	-d '{
		"appName": "hello-world",
		"image": "nginx:latest",
		"port": 80,
		"envVars": {"BACKGROUND_COLOR": "blue"}
	}'
```

### Success Response
```json
{
	"status": "pending",
	"deploymentId": "dpl-a1b2c3d4e5",
	"message": "Deployment 'hello-world' is being processed.",
	"url": "https://hello-world.decenter.app"
}
```

### SDK Examples

#### Python
```python
from container_engine import ContainerEngineClient

# Initialize client
client = ContainerEngineClient(api_key="your-api-key")

# Deploy a container
deployment = client.deploy(
    app_name="hello-world",
    image="nginx:latest",
    port=80,
    env_vars={"BACKGROUND_COLOR": "blue"}
)

# Get deployment URL
print(f"Deployment URL: {deployment.url}")
```

#### JavaScript
```javascript
import { ContainerEngineClient } from 'container-engine-sdk';

// Initialize client
const client = new ContainerEngineClient({ apiKey: 'your-api-key' });

// Deploy a container
async function deployContainer() {
  const deployment = await client.deploy({
    appName: 'hello-world',
    image: 'nginx:latest',
    port: 80,
    envVars: { BACKGROUND_COLOR: 'blue' }
  });
  
  console.log(`Deployment URL: ${deployment.url}`);
}

deployContainer();
```

### Lifecycle Management

Container Engine provides a full suite of API endpoints to manage the complete lifecycle of your deployments:

```
POST   /v1/deployments       # Create a new deployment
GET    /v1/deployments       # List all deployments
GET    /v1/deployments/{id}  # Get deployment details
PUT    /v1/deployments/{id}  # Update a deployment
DELETE /v1/deployments/{id}  # Delete a deployment
GET    /v1/deployments/{id}/logs  # Stream deployment logs
```

## Advanced Features

### Custom Domains

Map your own domain name to your deployment:

```bash
curl -X POST https://api.[your-domain]/v1/deployments/{id}/domains \
  -H "Authorization: Bearer <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "myapp.example.com"
  }'
```

### Horizontal Scaling

Scale your application horizontally to handle more traffic:

```bash
curl -X PATCH https://api.[your-domain]/v1/deployments/{id}/scale \
  -H "Authorization: Bearer <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "replicas": 5
  }'
```

### Health Checks

Configure custom health checks for your application:

```bash
curl -X POST https://api.[your-domain]/v1/deployments \
  -H "Authorization: Bearer <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "appName": "hello-world",
    "image": "nginx:latest",
    "port": 80,
    "healthCheck": {
      "path": "/health",
      "initialDelaySeconds": 5,
      "periodSeconds": 10
    }
  }'
```

## Security

Container Engine takes security seriously at every layer:

```
+------------------------+    +------------------------+    +------------------------+
| Authentication Layer   |    | Network Security       |    | Runtime Security       |
+------------------------+    +------------------------+    +------------------------+
| - API Key Auth         |    | - Auto TLS/SSL         |    | - Container Isolation  |
| - OAuth 2.0 Support    |    | - Network Policies     |    | - Resource Limits      |
| - Rate Limiting        |    | - DDoS Protection      |    | - Vulnerability Scans  |
+------------------------+    +------------------------+    +------------------------+
```

## Contributing

We enthusiastically welcome contributions to the Container Engine project! Whether you're fixing bugs, adding features, improving documentation, or helping with tests, your input is valuable.

### Contribution Process
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`) 
5. Open a Pull Request

### Development Setup

Container Engine includes an automated setup script that handles dependency installation and environment configuration:

```bash
# Clone the repository
git clone https://github.com/ngocbd/Open-Container-Engine.git
cd Open-Container-Engine

# Make setup script executable
chmod +x setup.sh

# Check system dependencies
./setup.sh check

# Full automated setup (installs dependencies if missing)
./setup.sh setup

# Start development server
./setup.sh dev
```

#### Available Setup Commands

```bash
# Get help and see all available commands
./setup.sh help

# Development commands
./setup.sh build          # Build the project
./setup.sh test           # Run Rust tests
./setup.sh format         # Format code
./setup.sh lint           # Run linting

# Integration testing
make test-setup           # Setup integration test environment
make test-integration     # Run comprehensive API integration tests
make test-integration-verbose  # Run integration tests with verbose output
make test-clean          # Clean integration test environment

# Database management
./setup.sh db-up          # Start database services
./setup.sh db-down        # Stop database services
./setup.sh db-reset       # Reset database and volumes
./setup.sh migrate        # Run database migrations
./setup.sh sqlx-prepare   # Prepare SQLx for offline compilation

# Docker operations
./setup.sh docker-build   # Build Docker image
./setup.sh docker-up      # Start all services with Docker
./setup.sh docker-down    # Stop all Docker services

# Cleanup
./setup.sh clean          # Clean build artifacts
```

#### Manual Setup (if needed)

If you prefer manual setup or the automated script doesn't work for your system:

```bash
# Install Rust and Cargo
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install SQLx CLI
cargo install sqlx-cli --no-default-features --features native-tls,postgres

# Start database services
docker compose up postgres redis -d

# Create environment file
cp .env.example .env

# Run migrations
export DATABASE_URL="postgresql://postgres:password@localhost:5432/container_engine"
sqlx migrate run

# Prepare SQLx for offline compilation
cargo sqlx prepare

# Build and run
cargo build
cargo run
```

#### API Documentation

Once the server is running, you can access:

- **Health Check**: http://localhost:3000/health
- **OpenAPI Specification**: http://localhost:3000/api-docs/openapi.json
- **API Endpoints**: All endpoints are documented in the OpenAPI spec

#### Dependencies

The setup script automatically checks for and installs:

- **Rust** (latest stable version)
- **Docker** & **Docker Compose**
- **Git** & **curl**
- **Python 3** (optional, for development tools)
- **SQLx CLI** (for database migrations)

## Testing

Container Engine includes a comprehensive test suite to ensure API reliability and functionality.

### Integration Tests

We maintain a complete integration test suite using pytest that validates all API endpoints:

- **93 integration tests** covering every API endpoint
- **Automated test environment** with Docker management
- **Authentication testing** for JWT tokens and API keys
- **Error case validation** for proper error handling
- **Response format verification** ensuring API consistency

#### Running Integration Tests

```bash
# Setup test environment (install Python dependencies)
make test-setup

# Run all integration tests
make test-integration

# Run tests with verbose output
make test-integration-verbose

# Run specific test category
pytest -m auth              # Authentication tests
pytest -m deployment        # Deployment tests
pytest -m monitoring        # Monitoring tests

# Clean up test environment
make test-clean
```

#### Test Categories

- **Authentication** (13 tests): Registration, login, logout, token refresh
- **API Keys** (12 tests): Creation, listing, revocation, authentication
- **User Profile** (15 tests): Profile management, password changes
- **Deployments** (23 tests): CRUD operations, scaling, lifecycle management
- **Monitoring** (11 tests): Logs, metrics, status endpoints
- **Domains** (12 tests): Custom domain management
- **Health Check** (3 tests): Server health monitoring
- **Infrastructure** (4 tests): Test framework validation

#### Continuous Integration

Integration tests run automatically on every commit to the main branch via GitHub Actions, ensuring:

- Code quality through linting and formatting checks
- Database compatibility with PostgreSQL
- Redis connectivity and caching functionality
- Complete API endpoint validation

For detailed testing documentation, see [tests/README.md](tests/README.md) and [INTEGRATION_TESTS.md](INTEGRATION_TESTS.md).

### Unit Tests

Rust unit tests are available for core functionality:

```bash
# Run Rust unit tests
cargo test

# Run with verbose output
cargo test -- --nocapture
```

## Roadmap

We're continuously improving Container Engine with new features and enhancements:

- **Q4 2025**: Multi-cluster deployment support and advanced traffic routing
- **Q1 2026**: Native serverless function support
- **Q2 2026**: Advanced monitoring and observability features
- **Q3 2026**: Machine learning model deployment specialization

## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

```
MIT License

Copyright (c) 2025 Container Engine Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files...
```

## Contact / Acknowledgments

- **Website**: [your-domain]
- **Documentation**: [docs.your-domain]
- **GitHub**: [github.com/ngocbd/Open-Container-Engine](https://github.com/ngocbd/Open-Container-Engine)
- **Community**: [Join our Slack](https://slack.your-domain)
- **Twitter**: [@ContainerEngine](https://twitter.com/ContainerEngine)

Special thanks to all contributors and the open-source projects that make Container Engine possible, including Kubernetes, Docker, and the vibrant cloud-native ecosystem.