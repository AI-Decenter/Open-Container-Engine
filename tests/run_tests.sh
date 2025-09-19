#!/bin/bash

# Test runner script for Container Engine integration tests
# This script sets up the test environment and runs the pytest suite

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Container Engine Integration Test Runner${NC}"
echo "=========================================="

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not in PATH"
    exit 1
fi

if ! docker info &> /dev/null; then
    print_error "Docker daemon is not running"
    exit 1
fi

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed or not in PATH"
    exit 1
fi

# Check if Rust/Cargo is available
if ! command -v cargo &> /dev/null; then
    print_error "Rust/Cargo is not installed or not in PATH"
    exit 1
fi

print_status "Installing Python test dependencies..."
# Get the directory containing the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
pip3 install -r "${SCRIPT_DIR}/requirements.txt"

# Set test environment - these should match your running backend or use defaults
export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:password@localhost:5432/container_engine}"
export REDIS_URL="${REDIS_URL:-redis://localhost:6379}"
export JWT_SECRET="${JWT_SECRET:-your-super-secret-jwt-key-change-this-in-production}"
export JWT_EXPIRES_IN="${JWT_EXPIRES_IN:-3600}"
export API_KEY_PREFIX="${API_KEY_PREFIX:-ce_api_}"
export KUBERNETES_NAMESPACE="${KUBERNETES_NAMESPACE:-container-engine}"
export DOMAIN_SUFFIX="${DOMAIN_SUFFIX:-container-engine.app}"
export RUST_LOG="${RUST_LOG:-container_engine=info,tower_http=info}"

print_status "Environment variables configured for testing"

# Parse command line arguments
PYTEST_ARGS=""
RUN_SPECIFIC_TEST=""
CLEANUP_ONLY=false
SKIP_BUILD=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --cleanup-only)
            CLEANUP_ONLY=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --test)
            RUN_SPECIFIC_TEST="$2"
            shift 2
            ;;
        --verbose|-v)
            PYTEST_ARGS="$PYTEST_ARGS -v"
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --cleanup-only    Only cleanup test environment"
            echo "  --skip-build      Skip building the Rust application"
            echo "  --test <pattern>  Run specific test(s) matching pattern"
            echo "  --verbose, -v     Verbose output"
            echo "  --help, -h        Show this help message"
            exit 0
            ;;
        *)
            PYTEST_ARGS="$PYTEST_ARGS $1"
            shift
            ;;
    esac
done

# Cleanup function
cleanup() {
    print_status "Cleaning up test environment..."
    
    # Only stop containers if not in GitHub Actions (they're managed by GitHub)
    if [ "$GITHUB_ACTIONS" != "true" ] && [ "$CI" != "true" ]; then
        # Stop any running containers
        docker stop test_postgres test_redis 2>/dev/null || true
        docker rm test_postgres test_redis 2>/dev/null || true
    else
        print_status "Skipping container cleanup in CI environment"
    fi
    
    # Kill any running server processes
    pkill -f "cargo run" 2>/dev/null || true
    
    print_status "Cleanup completed"
}

# If cleanup only, run cleanup and exit
if [ "$CLEANUP_ONLY" = true ]; then
    cleanup
    exit 0
fi

# Set trap for cleanup on exit
trap cleanup EXIT

# Build the Rust application if not skipping
if [ "$SKIP_BUILD" = false ]; then
    print_status "Building Container Engine..."
    cargo build
    print_status "Build completed"
fi

# Run pytest
print_status "Starting integration tests..."

# Install pytest-forked if not installed
if ! python3 -c "import pytest_forked" 2>/dev/null; then
    print_status "Installing pytest-forked..."
    pip3 install pytest-forked
fi

# Run pytest with forked mode for better isolation
print_status "Starting integration tests (forked mode)..."

# Base arguments with forked mode
FORKED_ARGS="--forked -v --tb=short"

if [ -n "$RUN_SPECIFIC_TEST" ]; then
    print_status "Running specific test: $RUN_SPECIFIC_TEST"
    python3 -m pytest "${SCRIPT_DIR}/integrate" \
        -k "$RUN_SPECIFIC_TEST" \
        $FORKED_ARGS \
        $PYTEST_ARGS
else
    print_status "Running all integration tests..."
    python3 -m pytest "${SCRIPT_DIR}/integrate" \
        $FORKED_ARGS \
        $PYTEST_ARGS
fi


print_status "Integration tests completed"