#!/bin/bash

# Container Engine Development Setup Script
# This script replaces the Makefile and provides automated setup for the development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/container_engine"
REDIS_URL="redis://localhost:6379"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Show help
show_help() {
    cat << EOF
Container Engine Development Setup Script

USAGE:
    ./setup.sh [COMMAND]

COMMANDS:
    help            Show this help message
    setup           Initial project setup (install dependencies)
    check           Check system dependencies
    db-up           Start database services
    db-down         Stop database services
    db-reset        Reset database and volumes
    migrate         Run database migrations
    sqlx-prepare    Prepare SQLx queries for offline compilation
    dev             Start development server
    build           Build the project
    test            Run tests
    format          Format code
    lint            Run linting
    clean           Clean build artifacts
    docker-build    Build Docker image
    docker-up       Start all services with Docker
    docker-down     Stop all Docker services

EXAMPLES:
    ./setup.sh setup       # Full initial setup
    ./setup.sh dev         # Start development server
    ./setup.sh db-reset    # Reset database
EOF
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if Docker service is running
is_docker_running() {
    docker info >/dev/null 2>&1
}

# Check system dependencies
check_dependencies() {
    log_info "Checking system dependencies..."
    
    local missing_deps=()
    
    # Check Rust
    if command_exists rustc && command_exists cargo; then
        local rust_version=$(rustc --version)
        log_success "Rust found: $rust_version"
    else
        log_error "Rust not found"
        missing_deps+=("rust")
    fi
    
    # Check Docker
    if command_exists docker; then
        local docker_version=$(docker --version)
        log_success "Docker found: $docker_version"
        
        if is_docker_running; then
            log_success "Docker daemon is running"
        else
            log_warning "Docker daemon is not running"
        fi
    else
        log_error "Docker not found"
        missing_deps+=("docker")
    fi
    
    # Check Docker Compose
    if command_exists docker && docker compose version >/dev/null 2>&1; then
        local compose_version=$(docker compose version)
        log_success "Docker Compose found: $compose_version"
    elif command_exists docker-compose; then
        local compose_version=$(docker-compose --version)
        log_success "Docker Compose found: $compose_version"
    else
        log_error "Docker Compose not found"
        missing_deps+=("docker-compose")
    fi
    
    # Check Python (optional, for future tooling)
    if command_exists python3; then
        local python_version=$(python3 --version)
        log_success "Python 3 found: $python_version"
    elif command_exists python; then
        local python_version=$(python --version)
        log_success "Python found: $python_version"
    else
        log_warning "Python not found (optional for development tools)"
    fi
    
    # Check Git
    if command_exists git; then
        local git_version=$(git --version)
        log_success "Git found: $git_version"
    else
        log_error "Git not found"
        missing_deps+=("git")
    fi
    
    # Check curl
    if command_exists curl; then
        log_success "curl found"
    else
        log_warning "curl not found (optional for API testing)"
    fi
    
    if [ ${#missing_deps[@]} -eq 0 ]; then
        log_success "All required dependencies are installed!"
        return 0
    else
        log_error "Missing dependencies: ${missing_deps[*]}"
        return 1
    fi
}

# Install dependencies
install_dependencies() {
    log_info "Installing missing dependencies..."
    
    # Detect OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command_exists apt-get; then
            # Ubuntu/Debian
            log_info "Detected Ubuntu/Debian system"
            
            # Update package list
            sudo apt-get update
            
            # Install Rust if missing
            if ! command_exists rustc; then
                log_info "Installing Rust..."
                curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
                source ~/.cargo/env
            fi
            
            # Install Docker if missing
            if ! command_exists docker; then
                log_info "Installing Docker..."
                sudo apt-get install -y docker.io
                sudo systemctl start docker
                sudo systemctl enable docker
                sudo usermod -aG docker $USER
                log_warning "You may need to log out and back in for Docker permissions to take effect"
            fi
            
            # Install Docker Compose if missing
            if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
                log_info "Installing Docker Compose..."
                sudo apt-get install -y docker-compose-plugin
            fi
            
            # Install other tools
            sudo apt-get install -y git curl python3 python3-pip
            
        elif command_exists yum; then
            # RHEL/CentOS/Fedora
            log_info "Detected RHEL/CentOS/Fedora system"
            
            # Install Rust if missing
            if ! command_exists rustc; then
                log_info "Installing Rust..."
                curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
                source ~/.cargo/env
            fi
            
            # Install Docker if missing
            if ! command_exists docker; then
                log_info "Installing Docker..."
                sudo yum install -y docker
                sudo systemctl start docker
                sudo systemctl enable docker
                sudo usermod -aG docker $USER
            fi
            
            # Install other tools
            sudo yum install -y git curl python3 python3-pip
        fi
        
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        log_info "Detected macOS system"
        
        if ! command_exists brew; then
            log_info "Installing Homebrew..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        fi
        
        # Install Rust if missing
        if ! command_exists rustc; then
            log_info "Installing Rust..."
            curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
            source ~/.cargo/env
        fi
        
        # Install Docker if missing
        if ! command_exists docker; then
            log_info "Installing Docker..."
            brew install --cask docker
            log_warning "Please start Docker Desktop manually"
        fi
        
        # Install other tools
        brew install git curl python3
        
    else
        log_error "Unsupported operating system: $OSTYPE"
        log_info "Please install the following manually:"
        log_info "- Rust: https://rustup.rs/"
        log_info "- Docker: https://docs.docker.com/get-docker/"
        log_info "- Git: https://git-scm.com/downloads"
        return 1
    fi
    
    log_success "Dependencies installation completed!"
}

# Setup environment file
setup_env() {
    if [ ! -f .env ]; then
        log_info "Creating .env file..."
        cp .env.example .env
        log_success "Created .env file from .env.example"
    else
        log_info ".env file already exists"
    fi
}

# Install Rust dependencies
install_rust_deps() {
    log_info "Installing Rust dependencies..."
    
    # Install SQLx CLI if not present
    if ! command_exists sqlx; then
        log_info "Installing SQLx CLI..."
        cargo install sqlx-cli --no-default-features --features native-tls,postgres
    else
        log_info "SQLx CLI already installed"
    fi
    
    log_success "Rust dependencies installed"
}

# Database operations
start_database() {
    log_info "Starting database services..."
    
    if ! is_docker_running; then
        log_error "Docker is not running. Please start Docker first."
        return 1
    fi
    
    if command_exists docker && docker compose version >/dev/null 2>&1; then
        docker compose up postgres redis -d
    elif command_exists docker-compose; then
        docker-compose up postgres redis -d
    else
        log_error "Docker Compose not found"
        return 1
    fi
    
    log_info "Waiting for databases to be ready..."
    sleep 5
    
    # Test database connection
    if docker exec open-container-engine-postgres-1 pg_isready -U postgres >/dev/null 2>&1; then
        log_success "PostgreSQL is ready"
    else
        log_warning "PostgreSQL might not be ready yet"
    fi
    
    # Test Redis connection
    if docker exec open-container-engine-redis-1 redis-cli ping >/dev/null 2>&1; then
        log_success "Redis is ready"
    else
        log_warning "Redis might not be ready yet"
    fi
}

stop_database() {
    log_info "Stopping database services..."
    
    if command_exists docker && docker compose version >/dev/null 2>&1; then
        docker compose stop postgres redis
    elif command_exists docker-compose; then
        docker-compose stop postgres redis
    else
        log_error "Docker Compose not found"
        return 1
    fi
    
    log_success "Database services stopped"
}

reset_database() {
    log_info "Resetting database..."
    
    if command_exists docker && docker compose version >/dev/null 2>&1; then
        docker compose stop postgres redis
        docker compose rm -f postgres redis
        docker volume rm open-container-engine_postgres_data open-container-engine_redis_data 2>/dev/null || true
    elif command_exists docker-compose; then
        docker-compose stop postgres redis
        docker-compose rm -f postgres redis
        docker volume rm open-container-engine_postgres_data open-container-engine_redis_data 2>/dev/null || true
    else
        log_error "Docker Compose not found"
        return 1
    fi
    
    start_database
    sleep 5
    run_migrations
    
    log_success "Database reset completed"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    export DATABASE_URL="$DATABASE_URL"
    sqlx migrate run
    
    log_success "Database migrations completed"
}

# Prepare SQLx queries for offline compilation
prepare_sqlx() {
    log_info "Preparing SQLx queries for offline compilation..."
    
    export DATABASE_URL="$DATABASE_URL"
    cargo sqlx prepare
    
    log_success "SQLx queries prepared for offline compilation"
}

# Development operations
start_dev() {
    log_info "Starting development server..."
    
    # Ensure database is running
    if ! docker ps | grep -q postgres; then
        log_info "Database not running, starting it..."
        start_database
        sleep 5
    fi
    
    # Run migrations if needed
    export DATABASE_URL="$DATABASE_URL"
    if ! sqlx migrate info >/dev/null 2>&1; then
        run_migrations
    fi
    
    log_info "Starting server at http://localhost:3000"
    log_info "API documentation available at http://localhost:3000/api-docs/openapi.json"
    cargo run
}

build_project() {
    log_info "Building project..."
    cargo build
    log_success "Build completed"
}

test_project() {
    log_info "Running tests..."
    cargo test
    log_success "Tests completed"
}

format_code() {
    log_info "Formatting code..."
    cargo fmt
    log_success "Code formatting completed"
}

lint_code() {
    log_info "Running linter..."
    cargo clippy -- -D warnings
    log_success "Linting completed"
}

clean_project() {
    log_info "Cleaning build artifacts..."
    cargo clean
    docker system prune -f 2>/dev/null || true
    log_success "Cleanup completed"
}

# Docker operations
docker_build() {
    log_info "Building Docker image..."
    docker build -t container-engine .
    log_success "Docker image built"
}

docker_up() {
    log_info "Starting all services with Docker..."
    
    if command_exists docker && docker compose version >/dev/null 2>&1; then
        docker compose up --build
    elif command_exists docker-compose; then
        docker-compose up --build
    else
        log_error "Docker Compose not found"
        return 1
    fi
}

docker_down() {
    log_info "Stopping all Docker services..."
    
    if command_exists docker && docker compose version >/dev/null 2>&1; then
        docker compose down
    elif command_exists docker-compose; then
        docker-compose down
    else
        log_error "Docker Compose not found"
        return 1
    fi
    
    log_success "All Docker services stopped"
}

# Full setup
full_setup() {
    log_info "Starting full Container Engine setup..."
    
    # Check dependencies first
    if ! check_dependencies; then
        log_info "Installing missing dependencies..."
        install_dependencies
    fi
    
    # Setup environment
    setup_env
    
    # Install Rust dependencies
    install_rust_deps
    
    # Start database
    start_database
    
    # Run migrations
    run_migrations
    
    # Prepare SQLx
    prepare_sqlx
    
    log_success "Full setup completed!"
    log_info "You can now run: ./setup.sh dev"
}

# Main script logic
case "${1:-help}" in
    help)
        show_help
        ;;
    setup)
        full_setup
        ;;
    check)
        check_dependencies
        ;;
    db-up)
        start_database
        ;;
    db-down)
        stop_database
        ;;
    db-reset)
        reset_database
        ;;
    migrate)
        run_migrations
        ;;
    sqlx-prepare)
        prepare_sqlx
        ;;
    dev)
        start_dev
        ;;
    build)
        build_project
        ;;
    test)
        test_project
        ;;
    format)
        format_code
        ;;
    lint)
        lint_code
        ;;
    clean)
        clean_project
        ;;
    docker-build)
        docker_build
        ;;
    docker-up)
        docker_up
        ;;
    docker-down)
        docker_down
        ;;
    *)
        log_error "Unknown command: $1"
        echo
        show_help
        exit 1
        ;;
esac