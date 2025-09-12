# GitHub Actions Port Conflict Fix

## Problem
GitHub Actions integration tests were failing due to port conflicts. The issue occurred because:

1. GitHub Actions provides PostgreSQL (port 5432) and Redis (port 6379) as services
2. The test setup code attempted to start its own Docker containers on the same ports
3. This caused port binding conflicts and test failures

## Solution
Added environment detection to automatically handle both CI and local development environments:

### Key Changes

1. **Environment Detection** (`tests/integrate/conftest.py`)
   - Added `_detect_github_actions()` method that checks for:
     - `GITHUB_ACTIONS=true`
     - `CI=true` 
     - `RUNNER_OS` environment variable

2. **Conditional Container Management**
   - **In GitHub Actions**: Skip Docker container creation, use provided services
   - **In Local Development**: Start Docker containers as before

3. **Updated Cleanup Logic** (`tests/run_tests.sh`)
   - Skip container cleanup in CI environments
   - Preserve normal cleanup in local development

### Testing
The fix was comprehensively tested with 6 test cases covering:
- Environment detection in various CI scenarios
- Container management logic for both environments
- Proper cleanup behavior

## Usage

### Local Development
```bash
# Works as before - containers are started automatically
make test-integration
```

### GitHub Actions
```yaml
# No changes needed - detection is automatic
- name: Run integration tests
  run: python -m pytest tests/integrate/ -v
```

The fix automatically detects the environment and handles container management appropriately, eliminating port conflicts while maintaining compatibility with existing workflows.