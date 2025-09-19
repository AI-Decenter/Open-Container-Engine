"""
Simple validation test to check if the test infrastructure is working correctly.
"""
import pytest
import requests
import sys
import os
from unittest.mock import MagicMock

# Add the project root to the Python path for standalone execution
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

from tests.integrate.conftest import TestConfig, APIClient


def test_config_values():
    """Test that test configuration has correct values"""
    assert TestConfig.BASE_URL == "http://localhost:3004"
    assert TestConfig.DB_HOST == "localhost"
    assert TestConfig.DB_PORT == 5432
    assert TestConfig.DB_USER == "postgres"
    assert TestConfig.DB_PASSWORD == "password"
    assert TestConfig.DB_NAME == "container_engine"
    assert TestConfig.REDIS_HOST == "localhost"
    assert TestConfig.REDIS_PORT == 6379


def test_api_client_creation():
    """Test that API client can be created"""
    client = APIClient()
    assert client.base_url == TestConfig.BASE_URL
    assert client.auth_token is None
    assert client.api_key is None


def test_api_client_auth_methods():
    """Test API client authentication methods"""
    client = APIClient()
    
    # Test setting auth token
    client.set_auth_token("test-token")
    assert client.auth_token == "test-token"
    assert "Authorization" in client.session.headers
    assert client.session.headers["Authorization"] == "Bearer test-token"
    
    # Test setting API key
    client.set_api_key("test-api-key")
    assert client.api_key == "test-api-key"
    assert client.session.headers["Authorization"] == "Bearer test-api-key"
    
    # Test clearing auth
    client.clear_auth()
    assert client.auth_token is None
    assert client.api_key is None
    assert "Authorization" not in client.session.headers


def test_request_url_construction():
    """Test that API client constructs URLs correctly"""
    base_url = "http://localhost:3004"
    endpoint = "/test/endpoint"
    session = MagicMock()
    session.request.return_value = MagicMock()
    
    client = APIClient(base_url)
    client.session = session
    
    client.get(endpoint)
    
    # Capture the URL that was called - session.request(method, url, **kwargs)
    captured_url = session.request.call_args[0][1] if session.request.call_args else None
    
    assert captured_url == "http://localhost:3004/test/endpoint"


if __name__ == "__main__":
    # Run basic tests
    test_config_values()
    test_api_client_creation()
    test_api_client_auth_methods()
    test_request_url_construction()
    print("✅ All infrastructure tests passed!")