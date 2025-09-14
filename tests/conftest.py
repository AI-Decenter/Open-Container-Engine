"""
Pytest configuration and fixtures for Container Engine integration tests.
"""
import pytest
from tests.integrate.conftest import TestServerManager, APIClient, TestConfig


# Pytest configuration
def pytest_configure(config):
    """Configure pytest"""
    config.addinivalue_line("markers", "slow: marks tests as slow")
    config.addinivalue_line("markers", "integration: marks tests as integration tests")


@pytest.fixture(scope="session")
def server_manager():
    """Fixture to manage test server lifecycle"""
    manager = TestServerManager()
    
    # Start dependencies and server
    manager.start_dependencies()
    manager.start_server()
    
    yield manager
    
    # Cleanup
    manager.stop_server()


@pytest.fixture(scope="session")
def api_client(server_manager):
    """Fixture to provide API client"""
    client = APIClient()
    
    # Verify server is running
    assert server_manager.is_server_running(), "Server is not running"
    
    return client


@pytest.fixture
def clean_client(api_client):
    """Fixture to provide a clean API client (no auth)"""
    api_client.clear_auth()
    return api_client


@pytest.fixture
def authenticated_client(api_client):
    """Fixture to provide an authenticated API client"""
    from tests.integrate.conftest import create_test_user
    
    user_info = create_test_user(api_client)
    yield api_client, user_info
    
    # Cleanup auth
    api_client.clear_auth()


@pytest.fixture(scope="function")
def api_key_client(authenticated_client):
    """Fixture to provide API client with API key authentication"""
    from tests.integrate.conftest import create_test_api_key
    import time
    client, user_info = authenticated_client
    api_key_info = create_test_api_key(client)
    time.sleep(0.1)
    # Switch to API key authentication
    client.clear_auth()
    time.sleep(0.1)
    client.set_api_key(api_key_info["api_key"])
    
    yield client, api_key_info, user_info
    
    # Cleanup
    client.clear_auth()