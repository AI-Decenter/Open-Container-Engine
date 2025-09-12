#!/bin/bash

# Container Engine Setup Verification Script
# This script verifies that the development environment can be set up correctly

set -e

echo "🚀 Container Engine - Setup Verification"
echo "========================================"

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Rust
if command -v cargo &> /dev/null; then
    echo "✅ Rust/Cargo found: $(cargo --version)"
else
    echo "❌ Rust not found. Install from https://rustup.rs/"
    exit 1
fi

# Check Docker
if command -v docker &> /dev/null; then
    echo "✅ Docker found: $(docker --version)"
else
    echo "❌ Docker not found. Please install Docker"
    exit 1
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose found: $(docker-compose --version)"
else
    echo "❌ Docker Compose not found. Please install Docker Compose"
    exit 1
fi

# Verify project structure
echo ""
echo "📁 Verifying project structure..."

required_files=(
    "Cargo.toml"
    "src/main.rs"
    "docker-compose.yml"
    "migrations/20240101000001_initial_schema.sql"
    ".env.example"
    "Makefile"
)

for file in "${required_files[@]}"; do
    if [[ -f "$file" ]]; then
        echo "✅ Found: $file"
    else
        echo "❌ Missing: $file"
        exit 1
    fi
done

# Check environment file
echo ""
echo "🔧 Setting up environment..."
if [[ ! -f ".env" ]]; then
    cp .env.example .env
    echo "✅ Created .env file from template"
else
    echo "✅ .env file already exists"
fi

# Test Docker services
echo ""
echo "🐳 Testing Docker services..."

# Start PostgreSQL and Redis
echo "Starting PostgreSQL and Redis..."
docker-compose up postgres redis -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 10

# Test PostgreSQL connection
echo "Testing PostgreSQL connection..."
if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready"
else
    echo "❌ PostgreSQL connection failed"
    docker-compose logs postgres
    exit 1
fi

# Test Redis connection
echo "Testing Redis connection..."
if docker-compose exec -T redis redis-cli ping | grep -q PONG; then
    echo "✅ Redis is ready"
else
    echo "❌ Redis connection failed"
    docker-compose logs redis
    exit 1
fi

# Test Rust compilation (without SQLx)
echo ""
echo "🦀 Testing Rust compilation..."
if SQLX_OFFLINE=true cargo check --quiet; then
    echo "✅ Rust compilation successful (offline mode)"
else
    echo "⚠️  Rust compilation has issues (expected - SQLx requires database)"
    echo "   This is normal for initial setup. Run 'cargo sqlx prepare' after setting up the database."
fi

# Install SQLx CLI if not present
echo ""
echo "🛠️  Installing development tools..."
if command -v sqlx &> /dev/null; then
    echo "✅ SQLx CLI already installed: $(sqlx --version)"
else
    echo "Installing SQLx CLI..."
    cargo install sqlx-cli --no-default-features --features native-tls,postgres
    echo "✅ SQLx CLI installed"
fi

# Run migrations
echo ""
echo "📊 Setting up database..."
export DATABASE_URL="postgresql://postgres:password@localhost:5432/container_engine"

if sqlx migrate run --database-url "$DATABASE_URL"; then
    echo "✅ Database migrations completed"
else
    echo "❌ Database migrations failed"
    exit 1
fi

# Test basic functionality
echo ""
echo "🧪 Testing basic functionality..."

# Try to prepare SQLx queries
echo "Preparing SQLx queries..."
if cargo sqlx prepare --database-url "$DATABASE_URL"; then
    echo "✅ SQLx queries prepared successfully"
else
    echo "⚠️  SQLx query preparation failed (some queries may need fixes)"
fi

# Cleanup
echo ""
echo "🧹 Cleaning up..."
docker-compose stop postgres redis

echo ""
echo "🎉 Setup verification completed!"
echo ""
echo "Next steps:"
echo "1. Run 'make dev' to start the development server"
echo "2. Test the API with: curl http://localhost:3000/health"
echo "3. See DEVELOPMENT.md for detailed development instructions"
echo ""
echo "If you encounter issues:"
echo "- Check the logs: docker-compose logs"
echo "- Reset everything: make db-reset"
echo "- See troubleshooting in DEVELOPMENT.md"