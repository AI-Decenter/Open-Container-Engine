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

# Save real user information for sudo operations
if [ ! -z "$SUDO_USER" ]; then
    REAL_USER=$SUDO_USER
else
    REAL_USER=$USER
fi

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
    help               Show this help message
    setup              Initial project setup (install dependencies)
    setup-k8s          Setup with Kubernetes (includes Minikube)
    check              Check system dependencies
    check-k8s          Check Kubernetes dependencies
    install-minikube   Install and setup Minikube
    start-minikube     Start Minikube cluster
    stop-minikube      Stop Minikube cluster
    k8s-status         Check Kubernetes cluster status
    db-up              Start database services
    db-down            Stop database services
    db-reset           Reset database and volumes
    migrate            Run database migrations
    sqlx-prepare       Prepare SQLx queries for offline compilation
    dev                Start development server
    build              Build the project
    test               Run tests
    format             Format code
    lint               Run linting
    clean              Clean build artifacts
    docker-build       Build Docker image
    docker-up          Start all services with Docker
    docker-down        Stop all Docker services

EXAMPLES:
    ./setup.sh setup           # Full initial setup
    ./setup.sh setup-k8s       # Setup with Kubernetes support
    ./setup.sh install-minikube # Install Minikube only
    ./setup.sh dev             # Start development server
    ./setup.sh db-reset        # Reset database
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

# Function to detect OS
detect_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$NAME
        VERSION=$VERSION_ID
    else
        log_error "Cannot determine OS"
        return 1
    fi
    log_info "Detected OS: $OS $VERSION"
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

# Check Kubernetes dependencies
check_k8s_dependencies() {
    log_info "Checking Kubernetes dependencies..."
    
    local missing_deps=()
    
    # Check minikube
    if command_exists minikube; then
        local minikube_version=$(minikube version --short 2>/dev/null | cut -d' ' -f3)
        log_success "Minikube found: $minikube_version"
    else
        log_warning "Minikube not found"
        missing_deps+=("minikube")
    fi
    
    # Check kubectl
    if command_exists kubectl; then
        local kubectl_version=$(kubectl version --client --short 2>/dev/null | cut -d' ' -f3)
        log_success "kubectl found: $kubectl_version"
    else
        log_warning "kubectl not found"
        missing_deps+=("kubectl")
    fi
    
    # Check Docker (required for minikube)
    if command_exists docker; then
        if systemctl is-active --quiet docker 2>/dev/null || is_docker_running; then
            log_success "Docker is running (required for Minikube)"
        else
            log_warning "Docker is installed but not running"
            missing_deps+=("docker-running")
        fi
    else
        log_error "Docker not found (required for Minikube)"
        missing_deps+=("docker")
    fi
    
    if [ ${#missing_deps[@]} -eq 0 ]; then
        log_success "All Kubernetes dependencies are installed!"
        return 0
    else
        log_error "Missing Kubernetes dependencies: ${missing_deps[*]}"
        return 1
    fi
}

# Install dependencies
install_dependencies() {
    log_info "Installing missing dependencies..."
    
    # Detect OS
    detect_os
    
    # Check if we need sudo
    local need_sudo=false
    if [ "$EUID" -ne 0 ]; then
        need_sudo=true
    fi
    
    # Linux installation
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [[ $OS == *"Ubuntu"* ]] || [[ $OS == *"Debian"* ]]; then
            # Ubuntu/Debian
            log_info "Installing for Ubuntu/Debian system"
            
            if [ "$need_sudo" = true ]; then
                sudo apt-get update
            else
                apt-get update
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
                if [ "$need_sudo" = true ]; then
                    sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
                    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
                    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
                    sudo apt-get update
                    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
                    sudo systemctl start docker
                    sudo systemctl enable docker
                    sudo usermod -aG docker $USER
                else
                    apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
                    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
                    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
                    apt-get update
                    apt-get install -y docker-ce docker-ce-cli containerd.io
                    systemctl start docker
                    systemctl enable docker
                    usermod -aG docker $REAL_USER
                fi
                log_warning "You may need to log out and back in for Docker permissions to take effect"
            fi
            
            # Install Docker Compose if missing
            if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
                log_info "Installing Docker Compose..."
                if [ "$need_sudo" = true ]; then
                    sudo apt-get install -y docker-compose-plugin
                else
                    apt-get install -y docker-compose-plugin
                fi
            fi
            
            # Install other tools
            if [ "$need_sudo" = true ]; then
                sudo apt-get install -y git curl python3 python3-pip
            else
                apt-get install -y git curl python3 python3-pip
            fi
            
        elif [[ $OS == *"CentOS"* ]] || [[ $OS == *"Red Hat"* ]] || [[ $OS == *"Fedora"* ]]; then
            # RHEL/CentOS/Fedora
            log_info "Installing for RHEL/CentOS/Fedora system"
            
            # Install Rust if missing
            if ! command_exists rustc; then
                log_info "Installing Rust..."
                curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
                source ~/.cargo/env
            fi
            
            # Install Docker if missing
            if ! command_exists docker; then
                log_info "Installing Docker..."
                if [ "$need_sudo" = true ]; then
                    sudo yum install -y yum-utils
                    sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
                    sudo yum install -y docker-ce docker-ce-cli containerd.io
                    sudo systemctl start docker
                    sudo systemctl enable docker
                    sudo usermod -aG docker $USER
                else
                    yum install -y yum-utils
                    yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
                    yum install -y docker-ce docker-ce-cli containerd.io
                    systemctl start docker
                    systemctl enable docker
                    usermod -aG docker $REAL_USER
                fi
            fi
            
            # Install other tools
            if [ "$need_sudo" = true ]; then
                sudo yum install -y git curl python3 python3-pip
            else
                yum install -y git curl python3 python3-pip
            fi
        fi
        
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        log_info "Installing for macOS system"
        
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

# Install kubectl
install_kubectl() {
    log_info "Installing kubectl..."
    
    local need_sudo=false
    if [ "$EUID" -ne 0 ]; then
        need_sudo=true
    fi
    
    # Download kubectl
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
    
    # Validate binary
    curl -LO "https://dl.k8s.io/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl.sha256"
    echo "$(cat kubectl.sha256) kubectl" | sha256sum --check
    
    # Install kubectl
    if [ "$need_sudo" = true ]; then
        sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
    else
        install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
    fi
    
    # Clean up
    rm -f kubectl kubectl.sha256
    
    log_success "kubectl installed successfully!"
}

# Install minikube
install_minikube_binary() {
    log_info "Installing Minikube..."
    
    local need_sudo=false
    if [ "$EUID" -ne 0 ]; then
        need_sudo=true
    fi
    
    # Download minikube
    curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
    
    # Install minikube
    if [ "$need_sudo" = true ]; then
        sudo install minikube-linux-amd64 /usr/local/bin/minikube
    else
        install minikube-linux-amd64 /usr/local/bin/minikube
    fi
    
    # Clean up
    rm -f minikube-linux-amd64
    
    log_success "Minikube installed successfully!"
}

# Full Minikube installation and setup
install_minikube() {
    log_info "=== Starting Minikube Installation ==="
    
    # Check if running as root, if not, re-run with sudo for system installations
    if [ "$EUID" -ne 0 ] && [[ "$OSTYPE" == "linux-gnu"* ]]; then
        log_info "Re-running with sudo for system package installations..."
        sudo -E bash "$0" install-minikube
        return $?
    fi
    
    # Detect OS
    detect_os
    
    # Check if minikube is already installed
    if command_exists minikube; then
        local minikube_version=$(minikube version --short 2>/dev/null | cut -d' ' -f3)
        log_success "Minikube is already installed - Version: $minikube_version"
    else
        # Check and install Docker if needed
        if ! command_exists docker || ! (systemctl is-active --quiet docker 2>/dev/null || is_docker_running); then
            log_info "Installing Docker (required for Minikube)..."
            install_dependencies
        fi
        
        # Install kubectl if needed
        if ! command_exists kubectl; then
            install_kubectl
        fi
        
        # Install minikube
        install_minikube_binary
    fi
    
    # Start minikube
    start_minikube
    
    log_success "=== Minikube installation and setup complete! ==="
}

# Start minikube
start_minikube() {
    log_info "Starting Minikube..."
    
    # Run minikube with real user if we're running as root
    if [ "$EUID" -eq 0 ] && [ ! -z "$SUDO_USER" ]; then
        log_info "Running minikube with user $REAL_USER..."
        if su - $REAL_USER -c "minikube status >/dev/null 2>&1"; then
            log_success "Minikube is already running"
        else
            su - $REAL_USER -c "minikube start --driver=docker"
            log_success "Minikube started successfully!"
        fi
    else
        # Check if minikube is already running
        if minikube status >/dev/null 2>&1; then
            log_success "Minikube is already running"
        else
            # Start with retry logic for docker group membership
            local max_retries=3
            local retry_count=0
            
            while [ $retry_count -lt $max_retries ]; do
                if minikube start --driver=docker 2>/dev/null; then
                    log_success "Minikube started successfully!"
                    break
                else
                    retry_count=$((retry_count + 1))
                    if [ $retry_count -lt $max_retries ]; then
                        log_warning "Start failed, trying again... ($retry_count/$max_retries)"
                        sleep 5
                    else
                        log_error "Could not start Minikube after $max_retries attempts"
                        log_error "You may need to logout/login for docker group permissions to take effect"
                        return 1
                    fi
                fi
            done
        fi
    fi
    
    # Show status
    k8s_status
}

# Stop minikube
stop_minikube() {
    log_info "Stopping Minikube..."
    
    if [ "$EUID" -eq 0 ] && [ ! -z "$SUDO_USER" ]; then
        su - $REAL_USER -c "minikube stop"
    else
        minikube stop
    fi
    
    log_success "Minikube stopped successfully!"
}

# Check Kubernetes status
k8s_status() {
    log_info "Checking Kubernetes cluster status..."
    
    if [ "$EUID" -eq 0 ] && [ ! -z "$SUDO_USER" ]; then
        log_info "Minikube status:"
        su - $REAL_USER -c "minikube status"
        log_info "Cluster information:"
        su - $REAL_USER -c "kubectl cluster-info"
        log_info "Nodes:"
        su - $REAL_USER -c "kubectl get nodes"
    else
        log_info "Minikube status:"
        minikube status
        log_info "Cluster information:"
        kubectl cluster-info
        log_info "Nodes:"
        kubectl get nodes
    fi
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

# Full setup with Kubernetes
full_setup_k8s() {
    log_info "Starting full Container Engine setup with Kubernetes..."
    
    # Run full setup first
    full_setup
    
    # Install Minikube
    install_minikube
    
    log_success "Full setup with Kubernetes completed!"
    log_info "Available commands:"
    log_info "  - ./setup.sh dev          : Start development server"
    log_info "  - ./setup.sh k8s-status   : Check Kubernetes status"
    log_info "  - minikube dashboard      : Open Kubernetes dashboard"
}

# Main script logic
case "${1:-help}" in
    help)
        show_help
        ;;
    setup)
        full_setup
        ;;
    setup-k8s)
        full_setup_k8s
        ;;
    check)
        check_dependencies
        ;;
    check-k8s)
        check_k8s_dependencies
        ;;
    install-minikube)
        install_minikube
        ;;
    start-minikube)
        start_minikube
        ;;
    stop-minikube)
        stop_minikube
        ;;
    k8s-status)
        k8s_status
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
