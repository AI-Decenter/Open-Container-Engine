# Container Engine Integration Tests

This directory contains comprehensive integration tests for the Container Engine API using pytest.

## Overview

The integration test suite validates all API endpoints documented in `APIs.md`, covering:

- ✅ Authentication endpoints (register, login, logout, refresh)
- ✅ API key management (create, list, revoke)
- ✅ User profile management (get, update, change password)
- ✅ Deployment management (CRUD operations, scaling, lifecycle)
- ✅ Monitoring endpoints (logs, metrics, status)
- ✅ Custom domain management
- ✅ Health check endpoint

## Test Structure

```
tests/
├── __init__.py                    # Test package initialization
├── conftest.py                    # Global pytest fixtures
├── requirements.txt               # Python test dependencies
├── run_tests.sh                   # Test runner script
├── .env.test                      # Test environment configuration
└── integrate/
    ├── __init__.py                # Integration test package
    ├── conftest.py                # Test utilities and helpers
    ├── test_health.py             # Health check tests
    ├── test_auth.py               # Authentication tests
    ├── test_api_keys.py           # API key management tests
    ├── test_user.py               # User profile tests
    ├── test_deployments.py        # Deployment management tests
    ├── test_monitoring.py         # Logs, metrics, status tests
    └── test_domains.py            # Custom domain tests
```

## Prerequisites

### System Requirements

- Python 3.8+
- Docker and Docker Compose
- Rust 1.70+ with Cargo
- PostgreSQL client (for migrations)

### Install Dependencies

```bash
# Install Python dependencies
pip install -r tests/requirements.txt

# Install SQLx CLI for database migrations
cargo install sqlx-cli --no-default-features --features postgres
```

## Running Tests

### Quick Start

Use the provided test runner script:

```bash
# Run all integration tests
./tests/run_tests.sh

# Run with verbose output
./tests/run_tests.sh --verbose

# Run specific test file
./tests/run_tests.sh --test test_auth

# Run specific test function
./tests/run_tests.sh --test "test_register_user_success"

# Skip building (if already built)
./tests/run_tests.sh --skip-build

# Cleanup only
./tests/run_tests.sh --cleanup-only
```

### Manual Test Execution

1. **Start test dependencies:**
   ```bash
   # Start PostgreSQL and Redis
   docker run -d --name test_postgres \
     -e POSTGRES_DB=container_engine_test \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=password \
     -p 5432:5432 postgres:16

   docker run -d --name test_redis \
     -p 6379:6379 redis:7-alpine
   ```

2. **Set environment variables:**
   ```bash
   export DATABASE_URL="postgresql://postgres:password@localhost:5432/container_engine_test"
   export REDIS_URL="redis://localhost:6379"
   export JWT_SECRET="test-jwt-secret-key"
   export API_KEY_PREFIX="ce_test_"
   export RUST_LOG="container_engine=info"
   ```

3. **Run migrations:**
   ```bash
   sqlx migrate run --database-url $DATABASE_URL
   ```

4. **Start the server:**
   ```bash
   cargo run &
   ```

5. **Run tests:**
   ```bash
   python -m pytest tests/integrate/ -v
   ```

6. **Cleanup:**
   ```bash
   docker stop test_postgres test_redis
   docker rm test_postgres test_redis
   pkill -f "cargo run"
   ```

## Test Configuration

### Environment Variables

Test behavior can be configured via environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `TEST_BASE_URL` | Server base URL | `http://localhost:3000` |
| `TEST_DB_HOST` | PostgreSQL host | `localhost` |
| `TEST_DB_PORT` | PostgreSQL port | `5432` |
| `TEST_DB_NAME` | Test database name | `container_engine_test` |
| `TEST_REDIS_HOST` | Redis host | `localhost` |
| `TEST_REDIS_PORT` | Redis port | `6379` |

### Pytest Configuration

The test suite uses the following pytest configuration (`pytest.ini`):

- Test discovery in `tests/integrate/`
- Custom markers for test categorization
- Verbose output with duration reporting
- Timeout protection (5 minutes default)

### Test Markers

Use markers to run specific test categories:

```bash
# Run only authentication tests
pytest -m auth

# Run all except slow tests
pytest -m "not slow"

# Run deployment-related tests
pytest -m deployment

# Run monitoring tests
pytest -m monitoring
```

## Test Features

### Automatic Server Management

The test suite automatically:
- Starts PostgreSQL and Redis containers
- Manages database migrations
- Starts and stops the Container Engine server
- Handles cleanup on test completion

### Fixture-Based User Management

Tests use pytest fixtures for user management:
- `clean_client`: Unauthenticated API client
- `authenticated_client`: Client with JWT authentication
- `api_key_client`: Client with API key authentication

### Comprehensive API Coverage

Each test file covers a specific API area:

- **Authentication (`test_auth.py`)**:
  - User registration with validation
  - Login/logout flow
  - Token refresh mechanism
  - Error handling for invalid credentials

- **API Keys (`test_api_keys.py`)**:
  - API key creation and listing
  - Key revocation and cleanup
  - API key authentication validation

- **User Profile (`test_user.py`)**:
  - Profile retrieval and updates
  - Password change with validation
  - Duplicate username/email handling

- **Deployments (`test_deployments.py`)**:
  - Full CRUD operations
  - Scaling and lifecycle management
  - Validation of deployment configurations

- **Monitoring (`test_monitoring.py`)**:
  - Log retrieval with filtering
  - Metrics collection and formatting
  - Status reporting and health checks

- **Domains (`test_domains.py`)**:
  - Custom domain addition and removal
  - DNS record generation
  - Domain validation

### Error Handling Validation

All tests verify:
- Correct HTTP status codes
- Proper error response format
- Authentication and authorization
- Input validation and sanitization

## CI/CD Integration

### GitHub Actions

The test suite runs automatically on:
- Push to `main` branch
- Pull requests to `main` branch

The workflow (`.github/workflows/integration-tests.yml`):
- Sets up PostgreSQL and Redis services
- Installs Rust and Python dependencies
- Runs linting and formatting checks
- Executes the full integration test suite
- Uploads test results as artifacts

### Local CI Simulation

To simulate the CI environment locally:

```bash
# Run the same checks as CI
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
cargo build --verbose
./tests/run_tests.sh --verbose
```

## Debugging Tests

### Common Issues

1. **Server won't start**: Check that ports 3000, 5432, and 6379 are available
2. **Database connection errors**: Ensure PostgreSQL is running and migrations are applied
3. **Redis connection errors**: Verify Redis is running and accessible
4. **Test timeouts**: Increase timeout values or check server performance

### Debugging Tools

```bash
# Run single test with extra output
pytest tests/integrate/test_auth.py::test_register_user_success -v -s

# Run tests with Python debugger
pytest tests/integrate/test_auth.py --pdb

# Generate test coverage report
pytest tests/integrate/ --cov=tests --cov-report=html

# Run tests with timing information
pytest tests/integrate/ --durations=0
```

### Test Data Inspection

Tests create isolated data for each test run. To inspect test data:

1. Run tests with `--pdb` to drop into debugger
2. Use `client.get("/v1/user/profile")` to inspect created users
3. Check database directly: `psql postgresql://postgres:password@localhost:5432/container_engine_test`

## Contributing

When adding new API endpoints:

1. **Create corresponding tests** in the appropriate test file
2. **Follow naming conventions**: `test_<operation>_<scenario>`
3. **Test both success and error cases**
4. **Verify response structure and data types**
5. **Include authentication/authorization tests**
6. **Add appropriate pytest markers**

### Test Writing Guidelines

- Use descriptive test names that explain the scenario
- Test one specific behavior per test function
- Use fixtures for common setup (authentication, test data)
- Verify both response status codes and response body structure
- Clean up test data when possible (though isolation handles this)
- Add comments for complex test logic

## Performance Considerations

- Tests run in parallel where possible using pytest-xdist
- Database and Redis use Docker for isolation
- Server startup is optimized with health checks
- Test data is minimal to reduce execution time

## Troubleshooting

For common issues and solutions, see the `TROUBLESHOOTING.md` file or check the GitHub Actions logs for CI-specific problems.