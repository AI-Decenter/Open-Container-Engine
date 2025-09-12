# Container Engine API Documentation

This document provides comprehensive documentation for all API endpoints available in the Container Engine platform. The backend is built with Rust and the Axum framework, providing high-performance and memory-safe container orchestration.

## Base URL

```
https://api.container-engine.app
```

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
  "confirmPassword": "string"
}
```

**Response (201 Created):**
```json
{
  "id": "usr-a1b2c3d4e5",
  "username": "string",
  "email": "string",
  "createdAt": "2025-01-01T00:00:00Z",
  "status": "active"
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
  "accessToken": "string",
  "refreshToken": "string",
  "expiresAt": "2025-01-01T01:00:00Z",
  "user": {
    "id": "usr-a1b2c3d4e5",
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
  "refreshToken": "string"
}
```

**Response (200 OK):**
```json
{
  "accessToken": "string",
  "expiresAt": "2025-01-01T01:00:00Z"
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
  "description": "string",
  "expiresAt": "2025-12-31T23:59:59Z" // optional
}
```

**Response (201 Created):**
```json
{
  "id": "key-a1b2c3d4e5",
  "name": "string",
  "description": "string",
  "apiKey": "ce_api_1234567890abcdef...",
  "createdAt": "2025-01-01T00:00:00Z",
  "expiresAt": "2025-12-31T23:59:59Z",
  "lastUsed": null
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
  "apiKeys": [
    {
      "id": "key-a1b2c3d4e5",
      "name": "string",
      "description": "string",
      "createdAt": "2025-01-01T00:00:00Z",
      "expiresAt": "2025-12-31T23:59:59Z",
      "lastUsed": "2025-01-01T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
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
  "id": "usr-a1b2c3d4e5",
  "username": "string",
  "email": "string",
  "createdAt": "2025-01-01T00:00:00Z",
  "lastLogin": "2025-01-01T12:00:00Z",
  "deploymentCount": 5,
  "apiKeyCount": 2
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
  "id": "usr-a1b2c3d4e5",
  "username": "string",
  "email": "string",
  "updatedAt": "2025-01-01T12:00:00Z"
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
  "currentPassword": "string",
  "newPassword": "string",
  "confirmNewPassword": "string"
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
  "appName": "string",
  "image": "string",
  "port": 80,
  "envVars": {
    "ENV_VAR_NAME": "value"
  },
  "replicas": 1, // optional, default: 1
  "resources": { // optional
    "cpu": "100m",
    "memory": "128Mi"
  },
  "healthCheck": { // optional
    "path": "/health",
    "initialDelaySeconds": 5,
    "periodSeconds": 10,
    "timeoutSeconds": 5,
    "failureThreshold": 3
  },
  "registryAuth": { // optional, for private registries
    "username": "string",
    "password": "string"
  }
}
```

**Response (201 Created):**
```json
{
  "id": "dpl-a1b2c3d4e5",
  "appName": "string",
  "image": "string",
  "status": "pending",
  "url": "https://app-name.container-engine.app",
  "createdAt": "2025-01-01T00:00:00Z",
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
      "id": "dpl-a1b2c3d4e5",
      "appName": "string",
      "image": "string",
      "status": "running",
      "url": "https://app-name.container-engine.app",
      "replicas": 1,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:05:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
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
  "id": "dpl-a1b2c3d4e5",
  "appName": "string",
  "image": "string",
  "status": "running",
  "url": "https://app-name.container-engine.app",
  "port": 80,
  "replicas": 1,
  "envVars": {
    "ENV_VAR_NAME": "value"
  },
  "resources": {
    "cpu": "100m",
    "memory": "128Mi"
  },
  "healthCheck": {
    "path": "/health",
    "initialDelaySeconds": 5,
    "periodSeconds": 10,
    "timeoutSeconds": 5,
    "failureThreshold": 3
  },
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:05:00Z",
  "deployedAt": "2025-01-01T00:05:00Z"
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
  "image": "string", // optional
  "envVars": { // optional
    "ENV_VAR_NAME": "new_value"
  },
  "replicas": 2, // optional
  "resources": { // optional
    "cpu": "200m",
    "memory": "256Mi"
  }
}
```

**Response (200 OK):**
```json
{
  "id": "dpl-a1b2c3d4e5",
  "status": "updating",
  "message": "Deployment update in progress",
  "updatedAt": "2025-01-01T12:00:00Z"
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
  "id": "dpl-a1b2c3d4e5",
  "replicas": 5,
  "status": "scaling",
  "message": "Deployment scaling in progress"
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
  "id": "dpl-a1b2c3d4e5",
  "status": "stopping",
  "message": "Deployment is being stopped"
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
  "id": "dpl-a1b2c3d4e5",
  "status": "starting",
  "message": "Deployment is being started"
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
  "message": "Deployment deleted successfully"
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

**Response (201 Created):**
```json
{
  "id": "dom-a1b2c3d4e5",
  "domain": "myapp.example.com",
  "status": "pending",
  "createdAt": "2025-01-01T00:00:00Z",
  "dnsRecords": [
    {
      "type": "CNAME",
      "name": "myapp.example.com",
      "value": "app-name.container-engine.app"
    }
  ]
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
  "domains": [
    {
      "id": "dom-a1b2c3d4e5",
      "domain": "myapp.example.com",
      "status": "active",
      "createdAt": "2025-01-01T00:00:00Z",
      "verifiedAt": "2025-01-01T00:15:00Z"
    }
  ]
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

**Response (200 OK):**
```json
{
  "message": "Custom domain removed successfully"
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
- `since` (optional): Return logs since timestamp (ISO 8601)
- `until` (optional): Return logs until timestamp (ISO 8601)

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
wss://api.container-engine.app/v1/deployments/{deploymentId}/logs/stream
```

---

### Get Deployment Metrics

Get performance metrics for a deployment.

**Endpoint:** `GET /v1/deployments/{deploymentId}/metrics`

**Headers:**
```http
Authorization: Bearer <api-key>
```

**Query Parameters:**
- `from` (optional): Start time for metrics (ISO 8601)
- `to` (optional): End time for metrics (ISO 8601)
- `resolution` (optional): Metric resolution (1m, 5m, 1h, 1d)

**Response (200 OK):**
```json
{
  "metrics": {
    "cpu": [
      {
        "timestamp": "2025-01-01T12:00:00Z",
        "value": 0.25
      }
    ],
    "memory": [
      {
        "timestamp": "2025-01-01T12:00:00Z",
        "value": 134217728
      }
    ],
    "requests": [
      {
        "timestamp": "2025-01-01T12:00:00Z",
        "value": 100
      }
    ]
  }
}
```

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
  "lastHealthCheck": "2025-01-01T12:00:00Z",
  "uptime": "2h 30m 45s",
  "restartCount": 0
}
```

---

## Error Handling

All API endpoints return consistent error responses:

**Error Response Format:**
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {} // optional additional error details
  }
}
```

**Common HTTP Status Codes:**
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate name)
- `422 Unprocessable Entity`: Invalid data format
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

## Rate Limiting

API requests are rate-limited per API key:

- **Authentication endpoints**: 10 requests per minute
- **Deployment operations**: 30 requests per minute
- **Read operations**: 100 requests per minute
- **Logs and metrics**: 60 requests per minute

Rate limit headers are included in all responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1641024000
```

---

## WebSocket Events

Real-time events are available via WebSocket connection:

**Connection URL:**
```
wss://api.container-engine.app/v1/events
```

**Authentication:**
Include API key in connection query parameter:
```
wss://api.container-engine.app/v1/events?token=<api-key>
```

**Event Format:**
```json
{
  "type": "deployment.status.changed",
  "deploymentId": "dpl-a1b2c3d4e5",
  "timestamp": "2025-01-01T12:00:00Z",
  "data": {
    "status": "running",
    "previousStatus": "pending"
  }
}
```

**Available Event Types:**
- `deployment.created`
- `deployment.status.changed`
- `deployment.updated`
- `deployment.deleted`
- `domain.verified`
- `domain.failed`

---

This API documentation covers all the essential endpoints for a complete container engine platform with user management, authentication, deployment management, and monitoring capabilities.