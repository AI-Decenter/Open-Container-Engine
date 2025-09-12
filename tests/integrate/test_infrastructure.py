"""
Simple validation test to check if the test infrastructure works
"""
import pytest
import requests
import sys
import os

# Add the project root to the Python path for standalone execution
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

from tests.integrate.conftest import TestConfig, APIClient


def test_config_values():
    """Test that configuration values are set correctly"""
    assert TestConfig.BASE_URL == "http://localhost:3000"
    assert TestConfig.DB_NAME == "container_engine_test"
    assert TestConfig.REDIS_URL == "redis://localhost:6379"


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
    """Test that request URLs are constructed correctly"""
    client = APIClient()
    
    # Mock the request method to check URL construction
    original_request = client.session.request
    captured_url = None
    
    def mock_request(method, url, **kwargs):
        nonlocal captured_url
        captured_url = url
        # Create a mock response
        response = requests.Response()
        response.status_code = 200
        response._content = b'{"test": "response"}'
        return response
    
    client.session.request = mock_request
    
    # Test URL construction
    client.get("/test/endpoint")
    assert captured_url == "http://localhost:3000/test/endpoint"
    
    # Restore original method
    client.session.request = original_request


if __name__ == "__main__":
    # Run basic tests
    test_config_values()
    test_api_client_creation()
    test_api_client_auth_methods()
    test_request_url_construction()
    print("✅ All infrastructure tests passed!")