"""
Integration tests for health check endpoint.
"""
import pytest
import requests


@pytest.mark.integration
def test_health_check(clean_client):
    """Test the health check endpoint"""
    response = clean_client.get("/health")
    
    assert response.status_code == 200
    
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "container-engine"
    assert "version" in data


@pytest.mark.integration
def test_health_check_response_format(clean_client):
    """Test health check response format"""
    response = clean_client.get("/health")
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"
    
    data = response.json()
    
    # Verify required fields
    required_fields = ["status", "service", "version"]
    for field in required_fields:
        assert field in data, f"Missing required field: {field}"
    
    # Verify field types
    assert isinstance(data["status"], str)
    assert isinstance(data["service"], str)
    assert isinstance(data["version"], str)


@pytest.mark.integration
def test_server_availability(clean_client):
    """Test that server is accessible and responding"""
    # Test multiple requests to ensure stability
    for i in range(3):
        response = clean_client.get("/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"