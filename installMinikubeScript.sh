#!/bin/bash

# Check and automatically run with sudo if needed
if [ "$EUID" -ne 0 ]; then
    echo "Running script with sudo privileges..."
    sudo -E bash "$0" "$@"
    exit $?
fi

# Script to check and install Minikube (Fully automated)
# Supports Ubuntu/Debian and CentOS/RHEL/Fedora

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function for colored logging
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Save real user information
if [ ! -z "$SUDO_USER" ]; then
    REAL_USER=$SUDO_USER
else
    REAL_USER=$USER
fi

# Function to detect OS
detect_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$NAME
        VERSION=$VERSION_ID
    else
        log_error "Cannot determine OS"
        exit 1
    fi

    log_info "Detected OS: $OS $VERSION"
}

# Function to check if minikube is installed
check_minikube() {
    if command -v minikube >/dev/null 2>&1; then
        MINIKUBE_VERSION=$(minikube version --short 2>/dev/null | cut -d' ' -f3)
        log_info "Minikube is already installed - Version: $MINIKUBE_VERSION"
        return 0
    else
        log_warning "Minikube is not installed"
        return 1
    fi
}

# Function to check kubectl
check_kubectl() {
    if command -v kubectl >/dev/null 2>&1; then
        KUBECTL_VERSION=$(kubectl version --client --short 2>/dev/null | cut -d' ' -f3)
        log_info "kubectl is already installed - Version: $KUBECTL_VERSION"
        return 0
    else
        log_warning "kubectl is not installed, will install with minikube"
        return 1
    fi
}

# Function to check Docker
check_docker() {
    if command -v docker >/dev/null 2>&1; then
        if systemctl is-active --quiet docker 2>/dev/null; then
            log_info "Docker is installed and running"
            return 0
        else
            log_warning "Docker is installed but not running"
            return 1
        fi
    else
        log_warning "Docker is not installed"
        return 1
    fi
}

# Function to install Docker (automated)
install_docker() {
    log_info "Automatically installing Docker..."

    if [[ $OS == *"Ubuntu"* ]] || [[ $OS == *"Debian"* ]]; then
        apt-get update -y
        apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release

        # Add Docker's official GPG key
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

        # Set up stable repository
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

        apt-get update -y
        apt-get install -y docker-ce docker-ce-cli containerd.io

    elif [[ $OS == *"CentOS"* ]] || [[ $OS == *"Red Hat"* ]] || [[ $OS == *"Fedora"* ]]; then
        yum install -y yum-utils
        yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        yum install -y docker-ce docker-ce-cli containerd.io
    else
        log_error "OS not supported for automatic Docker installation"
        exit 1
    fi

    # Start and enable Docker
    systemctl start docker
    systemctl enable docker

    # Add user to docker group
    usermod -aG docker $REAL_USER
    log_info "Docker has been successfully installed!"
    log_info "User $REAL_USER has been added to docker group"
}

# Function to install kubectl
install_kubectl() {
    log_info "Automatically installing kubectl..."

    # Download kubectl
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

    # Validate binary
    curl -LO "https://dl.k8s.io/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl.sha256"
    echo "$(cat kubectl.sha256) kubectl" | sha256sum --check

    # Install kubectl
    install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

    # Clean up
    rm -f kubectl kubectl.sha256

    log_info "kubectl has been successfully installed!"
}

# Function to install minikube
install_minikube() {
    log_info "Automatically installing Minikube..."

    # Download minikube
    curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64

    # Install minikube
    install minikube-linux-amd64 /usr/local/bin/minikube

    # Clean up
    rm -f minikube-linux-amd64

    log_info "Minikube has been successfully installed!"
}

# Function to start minikube (automated)
start_minikube() {
    log_info "Automatically starting Minikube..."

    # Run minikube with real user
    if [ ! -z "$SUDO_USER" ]; then
        log_info "Running minikube with user $REAL_USER..."
        su - $REAL_USER -c "minikube status >/dev/null 2>&1 || minikube start --driver=docker"
    else
        # Check if minikube is already running
        if minikube status >/dev/null 2>&1; then
            log_info "Minikube is already running"
        else
            # Start with retry logic for docker group membership
            local max_retries=3
            local retry_count=0

            while [ $retry_count -lt $max_retries ]; do
                if minikube start --driver=docker 2>/dev/null; then
                    log_info "Minikube has been started successfully!"
                    break
                else
                    retry_count=$((retry_count + 1))
                    if [ $retry_count -lt $max_retries ]; then
                        log_warning "Start failed, trying again... ($retry_count/$max_retries)"
                        sleep 5
                    else
                        log_error "Could not start Minikube after $max_retries attempts"
                        log_error "You may need to logout/login for docker group permissions to take effect"
                        exit 1
                    fi
                fi
            done
        fi
    fi

    # Verify installation
    log_info "Checking Minikube status:"
    if [ ! -z "$SUDO_USER" ]; then
        su - $REAL_USER -c "minikube status"
        log_info "Cluster information:"
        su - $REAL_USER -c "kubectl cluster-info"
    else
        minikube status
        log_info "Cluster information:"
        kubectl cluster-info
    fi
}

# Main function
main() {
    log_info "=== Starting Automated Minikube Installation ==="

    # Detect OS
    detect_os

    # Check minikube
    if check_minikube; then
        log_info "Minikube is already installed, checking status..."
        if [ ! -z "$SUDO_USER" ]; then
            if su - $REAL_USER -c "minikube status >/dev/null 2>&1"; then
                log_info "Minikube is running, complete!"
            else
                log_info "Minikube is not running, starting automatically..."
                start_minikube
            fi
        else
            if minikube status >/dev/null 2>&1; then
                log_info "Minikube is running, complete!"
            else
                log_info "Minikube is not running, starting automatically..."
                start_minikube
            fi
        fi
        exit 0
    fi

    # Check and automatically install Docker if needed
    if ! check_docker; then
        log_info "Automatically installing Docker..."
        install_docker
    fi

    # Check and automatically install kubectl if needed
    if ! check_kubectl; then
        install_kubectl
    fi

    # Automatically install minikube
    install_minikube

    # Automatically start minikube
    start_minikube

    log_info "=== Automated installation complete! ==="
    log_info "Minikube has been successfully installed and started!"
    log_info ""
    log_info "Useful commands:"
    log_info "  - minikube status     : check status"
    log_info "  - minikube stop       : stop cluster"
    log_info "  - minikube start      : start cluster"
    log_info "  - kubectl get nodes   : view nodes"
    log_info "  - minikube dashboard  : open web dashboard"

    log_info "Note: You may need to logout and login again for docker group permissions to take effect"
}

# Run main function
main "$@"
