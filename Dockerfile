# Multi-stage build for full-stack Open Container Engine

# Frontend builder stage
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy frontend package files
COPY apps/container-engine-frontend/package*.json ./

# Install frontend dependencies
RUN npm ci

# Copy frontend source
COPY apps/container-engine-frontend ./

# Build frontend
RUN npm run build

# Backend build stage
FROM rustlang/rust:nightly as backend-builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Accept DATABASE_URL as build argument
ARG DATABASE_URL

# Copy everything and build
COPY Cargo.toml ./
COPY src ./src
COPY migrations ./migrations
# Copy SQLx offline data if exists
COPY .sqlx ./.sqlx

# Build the backend application
# Use DATABASE_URL if provided, otherwise use offline mode
ENV K8S_OPENAPI_ENABLED_VERSION=1.30
RUN if [ -n "$DATABASE_URL" ]; then \
    echo "Building with online database"; \
    DATABASE_URL="$DATABASE_URL" cargo build --release --verbose; \
else \
    echo "Building with offline mode"; \
    SQLX_OFFLINE=true cargo build --release --verbose; \
fi
    
    # Final stage - Runtime (use Ubuntu 24.04 for newer GLIBC)
FROM ubuntu:24.04

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN useradd -m -u 1001 appuser

# Set the working directory
WORKDIR /app

# Copy the backend binary from builder stage
COPY --from=backend-builder /app/target/release/container-engine /app/container-engine

# Copy the frontend build from frontend-builder stage
COPY --from=frontend-builder /app/dist ./apps/container-engine-frontend/dist

# Copy migrations
COPY --from=backend-builder /app/migrations ./migrations

# Note: k8sConfig.yaml should be mounted at runtime
# User should create k8sConfig.yaml locally and mount it with:
# docker run -v $(pwd)/k8sConfig.yaml:/app/k8sConfig.yaml:ro

# Change ownership to app user
RUN chown -R appuser:appuser /app

# Switch to app user
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Run the application
CMD ["./container-engine"]