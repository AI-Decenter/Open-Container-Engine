# Container Engine API Documentation

This document provides comprehensive documentation for all API endpoints available in the Container Engine platform. The backend is built with Rust and the Axum framework, providing high-performance and memory-safe container orchestration.

## Base URL

```
http://localhost:3000
```

For production deployment: Replace with your actual domain.

**Domain Suffix:** `vinhomes.co.uk` (configured in environment)

## Authentication

All API endpoints (except registration and login) require authentication via API key in the Authorization header:

```http
Authorization: Bearer <your-api-key>
```

---

## User Management & Authentication

### User Registration

Register a new user account.

**Endpoint:** `POST /v1/auth/register`

**Headers:**
```http
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "confirm_password": "string"
}
```

**Response (201 Created):**
```json
{
  "access_token": "string",
  "refresh_token": "string", 
  "expires_at": "2025-01-01T01:00:00Z",
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input data
- `409 Conflict`: Username or email already exists

---

### User Login

Authenticate a user and receive an access token.

**Endpoint:** `POST /v1/auth/login`

**Headers:**
```http
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200 OK):**
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "expires_at": "2025-01-01T01:00:00Z",
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
- `404 Not Found`: User not found

---

### Refresh Token

Refresh an expired access token.

**Endpoint:** `POST /v1/auth/refresh`

**Headers:**
```http
Content-Type: application/json
```

**Request Body:**
```json
{
  "refresh_token": "string"
}
```

**Response (200 OK):**
```json
{
  "access_token": "string",
  "expires_at": "2025-01-01T01:00:00Z"
}
```

---

### Logout

Invalidate user session and tokens.

**Endpoint:** `POST /v1/auth/logout`

**Headers:**
```http
Authorization: Bearer <access-token>
```

**Response (200 OK):**
```json
{
  "message": "Successfully logged out"
}
```

---

## Forgot Password

Request a password reset link.

**Endpoint:** `POST /v1/auth/forgot-password`

**Headers:**
```http
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "string"
}
```

**Response (200 OK):**
```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

---

## Reset Password

Reset password using a token.

**Endpoint:** `POST /v1/auth/reset-password`

**Headers:**
```http
Content-Type: application/json
```

**Request Body:**
```json
{
  "token": "string",
  "new_password": "string"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset successfully"
}
```

---

## API Key Management

### Create API Key

Generate a new API key for programmatic access.

**Endpoint:** `POST /v1/api-keys`

**Headers:**
```http
Authorization: Bearer <access-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "string",
  "description": "string"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "string", 
  "key": "ce_dev_1234567890abcdef...",
  "created_at": "2025-01-01T00:00:00Z"
}
```

---

### List API Keys

Get all API keys for the authenticated user.

**Endpoint:** `GET /v1/api-keys`

**Headers:**
```http
Authorization: Bearer <access-token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

**Response (200 OK):**
```json
{
  "api_keys": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "key_prefix": "ce_dev_",
      "created_at": "2025-01-01T00:00:00Z",
      "expires_at": "2025-12-31T23:59:59Z",
      "last_used": "2025-01-01T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "total_pages": 1
  }
}
```

---

### Revoke API Key

Revoke an API key (cannot be undone).

**Endpoint:** `DELETE /v1/api-keys/{keyId}`

**Headers:**
```http
Authorization: Bearer <access-token>
```

**Response (200 OK):**
```json
{
  "message": "API key revoked successfully"
}
```

---

## User Profile Management

### Get User Profile

Get the authenticated user's profile information.

**Endpoint:** `GET /v1/user/profile`

**Headers:**
```http
Authorization: Bearer <access-token>
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "username": "string",
  "email": "string",
  "created_at": "2025-01-01T00:00:00Z",
  "last_login": "2025-01-01T12:00:00Z",
  "is_active": true
}
```

---

### Update User Profile

Update user profile information.

**Endpoint:** `PUT /v1/user/profile`

**Headers:**
```http
Authorization: Bearer <access-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "string", // optional
  "email": "string" // optional
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "username": "string",
  "email": "string",
  "updated_at": "2025-01-01T12:00:00Z"
}
```

---

### Change Password

Change user password.

**Endpoint:** `PUT /v1/user/password`

**Headers:**
```http
Authorization: Bearer <access-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "current_password": "string",
  "new_password": "string",
  "confirm_new_password": "string"
}
```

**Response (200 OK):**
```json
{
  "message": "Password updated successfully"
}
```

---

## Container Deployment Management

### Create Deployment

Deploy a new container application.

**Endpoint:** `POST /v1/deployments`

**Headers:**
```http
Authorization: Bearer <api-key>
Content-Type: application/json
```

**Request Body:**
```json
{
  "app_name": "string",
  "image": "string",
  "port": 80,
  "env_vars": {
    "ENV_VAR_NAME": "value"
  },
  "replicas": 1,
  "resources": {
    "cpu": "100m",
    "memory": "128Mi"
  },
  "health_check": {
    "path": "/health",
    "initial_delay_seconds": 30,
    "period_seconds": 10,
    "timeout_seconds": 5,
    "failure_threshold": 3
  },
  "registry_auth": {
    "username": "string",
    "password": "string"
  }
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "app_name": "string",
  "image": "string",
  "status": "pending",
  "url": null,
  "created_at": "2025-01-01T00:00:00Z",
  "message": "Deployment is being processed"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid deployment configuration
- `409 Conflict`: App name already exists
- `422 Unprocessable Entity`: Invalid image or registry access

---

### List Deployments

Get all deployments for the authenticated user.

**Endpoint:** `GET /v1/deployments`

**Headers:**
```http
Authorization: Bearer <api-key>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `status` (optional): Filter by status (pending, running, stopped, failed)

**Response (200 OK):**
```json
{
  "deployments": [
    {
      "id": "uuid",
      "app_name": "string",
      "image": "string",
      "status": "running",
      "url": "https://app-name.vinhomes.co.uk",
      "replicas": 1,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:05:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "total_pages": 1
  }
}
```

---

### Get Deployment Details

Get detailed information about a specific deployment.

**Endpoint:** `GET /v1/deployments/{deploymentId}`

**Headers:**
```http
Authorization: Bearer <api-key>
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "user_id": "uuid", 
  "app_name": "string",
  "image": "string",
  "status": "running",
  "url": "https://app-name.vinhomes.co.uk",
  "port": 80,
  "env_vars": {
    "ENV_VAR_NAME": "value"
  },
  "replicas": 1,
  "resources": {
    "cpu": "100m",
    "memory": "128Mi"
  },
  "health_check": {
    "path": "/health",
    "initial_delay_seconds": 30,
    "period_seconds": 10,
    "timeout_seconds": 5,
    "failure_threshold": 3
  },
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:05:00Z",
  "deployed_at": "2025-01-01T00:05:00Z",
  "error_message": null
}
```

---

### Update Deployment

Update an existing deployment.

**Endpoint:** `PUT /v1/deployments/{deploymentId}`

**Headers:**
```http
Authorization: Bearer <api-key>
Content-Type: application/json
```

**Request Body:**
```json
{
  "image": "string",
  "env_vars": {
    "ENV_VAR_NAME": "new_value"
  },
  "replicas": 2,
  "resources": {
    "cpu": "200m",
    "memory": "256Mi"
  }
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "status": "updating",
  "message": "Deployment update in progress",
  "updated_at": "2025-01-01T12:00:00Z"
}
```

---

### Scale Deployment

Scale the number of replicas for a deployment.

**Endpoint:** `PATCH /v1/deployments/{deploymentId}/scale`

**Headers:**
```http
Authorization: Bearer <api-key>
Content-Type: application/json
```

**Request Body:**
```json
{
  "replicas": 5
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "replicas": 5,
  "status": "running",
  "message": "Deployment scaled successfully"
}
```

---

### Stop Deployment

Stop a running deployment.

**Endpoint:** `POST /v1/deployments/{deploymentId}/stop`

**Headers:**
```http
Authorization: Bearer <api-key>
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "status": "stopped",
  "message": "Deployment stopped successfully"
}
```

---

### Start Deployment

Start a stopped deployment.

**Endpoint:** `POST /v1/deployments/{deploymentId}/start`

**Headers:**
```http
Authorization: Bearer <api-key>
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "status": "running",
  "replicas": 1,
  "message": "Deployment started successfully"
}
```

---

### Delete Deployment

Permanently delete a deployment.

**Endpoint:** `DELETE /v1/deployments/{deploymentId}`

**Headers:**
```http
Authorization: Bearer <api-key>
```

**Response (200 OK):**
```json
{
  "message": "Deployment deleted successfully",
  "deployment_id": "uuid",
  "app_name": "string",
  "namespace_deleted": true
}
```

---

## Custom Domain Management

### Add Custom Domain

Map a custom domain to a deployment.

**Endpoint:** `POST /v1/deployments/{deploymentId}/domains`

**Headers:**
```http
Authorization: Bearer <api-key>
Content-Type: application/json
```

**Request Body:**
```json
{
  "domain": "myapp.example.com"
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": {
    "message": "Domain management not yet implemented"
  }
}
```

---

### List Custom Domains

Get all custom domains for a deployment.

**Endpoint:** `GET /v1/deployments/{deploymentId}/domains`

**Headers:**
```http
Authorization: Bearer <api-key>
```

**Response (200 OK):**
```json
{
  "domains": []
}
```

---

### Remove Custom Domain

Remove a custom domain from a deployment.

**Endpoint:** `DELETE /v1/deployments/{deploymentId}/domains/{domainId}`

**Headers:**
```http
Authorization: Bearer <api-key>
```

**Response (500 Internal Server Error):**
```json
{
  "error": {
    "message": "Domain management not yet implemented"
  }
}
```

---

## Monitoring & Logging

### Get Deployment Logs

Stream or fetch logs for a deployment.

**Endpoint:** `GET /v1/deployments/{deploymentId}/logs`

**Headers:**
```http
Authorization: Bearer <api-key>
```

**Query Parameters:**
- `tail` (optional): Number of lines to return from the end (default: 100)
- `follow` (optional): Stream logs in real-time (default: false)

**Response (200 OK):**
```json
{
  "logs": [
    {
      "timestamp": "2025-01-01T12:00:00Z",
      "level": "info", 
      "message": "Application started successfully",
      "source": "app"
    }
  ]
}
```

**WebSocket Endpoint for Real-time Logs:**
```
ws://localhost:3000/v1/deployments/{deploymentId}/logs/stream
```

---

### Get Deployment Metrics

Get performance metrics for a deployment.

**Endpoint:** `GET /v1/deployments/{deploymentId}/metrics`

**Headers:**
```http
Authorization: Bearer <api-key>
```

**Response (200 OK):**
```json
{
  "metrics": {}
}
```

Note: Metrics implementation is currently a stub.

---

### Get Deployment Status

Get the current status and health of a deployment.

**Endpoint:** `GET /v1/deployments/{deploymentId}/status`

**Headers:**
```http
Authorization: Bearer <api-key>
```

**Response (200 OK):**
```json
{
  "status": "running",
  "health": "healthy",
  "replicas": {
    "desired": 2,
    "ready": 2,
    "available": 2
  },
  "last_health_check": "2025-01-01T12:00:00Z",
  "uptime": "0s",
  "restart_count": 0
}
```

---

## Health Check

Check the overall health of the Container Engine API.

**Endpoint:** `GET /health`

**Response (200 OK):**
```json
{
  "status": "healthy",
  "service": "container-engine", 
  "version": "0.1.0"
}
```

---

## WebSocket Notifications

Real-time notifications are available via WebSocket connection:

**Connection URL:**
```
ws://localhost:3000/v1/ws/notifications
```

**Health Check URL:**
```
ws://localhost:3000/v1/ws/health
```

**Authentication:**
Include Authorization header with Bearer token when connecting.

**Event Format:**
```json
{
  "type": "deployment_status_changed",
  "deployment_id": "uuid",
  "timestamp": "2025-01-01T12:00:00Z",
  "data": {
    "status": "running",
    "url": "https://app-name.vinhomes.co.uk"
  }
}
```

---

## Testing Endpoints

### Send Test Notification

Trigger a test notification (for development).

**Endpoint:** `GET /v1/notifications/test`

**Headers:**
```http
Authorization: Bearer <api-key>
```

### Get Notification Stats

Get notification system statistics.

**Endpoint:** `GET /v1/notifications/stats`

**Headers:**
```http
Authorization: Bearer <api-key>
```

---

## Error Handling

All API endpoints return consistent error responses:

**Error Response Format:**
```json
{
  "error": {
    "message": "string",
    "details": "string"
  }
}
```

**Common HTTP Status Codes:**
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid authentication  
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate app name)
- `422 Unprocessable Entity`: Invalid data format
- `500 Internal Server Error`: Server error

---

## Environment Configuration

The API uses the following environment variables:

**Required:**
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secret key for JWT tokens

**Optional:**
- `PORT`: Server port (default: 3000)
- `DOMAIN_SUFFIX`: Domain suffix for deployments (default: vinhomes.co.uk)
- `WEBHOOK_URL`: Webhook URL for deployment events
- `KUBECONFIG_PATH`: Path to Kubernetes config file
- `KUBERNETES_NAMESPACE`: Default Kubernetes namespace

**Email Configuration (Optional):**
- `AWS_SES_SMTP_HOST`: SMTP host for email service
- `AWS_SES_SMTP_PORT`: SMTP port (default: 587)
- `AWS_SES_USERNAME`: SMTP username
- `AWS_SES_PASSWORD`: SMTP password
- `EMAIL_FROM`: From email address
- `EMAIL_FROM_NAME`: From email name

---

## Webhook Integration

When enabled, the API sends webhook notifications for deployment events to the configured `WEBHOOK_URL`.

**Webhook Payload:**
```json
{
  "deployment_id": "uuid",
  "status": "completed|failed|started",
  "type": "deployment_completed|deployment_failed|deployment_started",
  "timestamp": "2025-01-01T12:00:00Z",
  "app_name": "string",
  "user_id": "uuid",
  "url": "https://app-name.vinhomes.co.uk"
}
```

---