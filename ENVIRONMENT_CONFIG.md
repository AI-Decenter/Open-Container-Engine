# Environment Configuration

This project uses environment-specific configuration files to manage different deployment and testing scenarios.

## Environment Files

- `.env.development` - Configuration for local development
- `.env.integrate_test` - Configuration for integration testing  
- `.env.example` - Example configuration template

## Usage

### Development
```bash
# Uses .env.development by default or when ENVIRONMENT=development
cargo run

# Explicitly set development environment
ENVIRONMENT=development cargo run
```

### Integration Testing
```bash
# Run integration tests (automatically uses .env.integrate_test)
ENVIRONMENT=integrate_test cargo run

# Run Python integration tests
python -m pytest tests/integrate/ -v
```

## Key Differences

### Development (.env.development)
- Port: 3000
- Database: `container_engine` 
- Namespace: `container-engine-dev`
- Domain: `dev.container-engine.app`
- Log level: debug

### Integration Test (.env.integrate_test)
- Port: 3001 (avoids conflicts)
- Database: `container_engine_test`
- Namespace: `container-engine-test` 
- Domain: `test.container-engine.app`
- Log level: info

## Port Separation

Different ports are used to prevent conflicts when running development server and tests simultaneously:
- Development: port 3000
- Integration tests: port 3001

This ensures GitHub Actions and local testing won't encounter "port already in use" errors.