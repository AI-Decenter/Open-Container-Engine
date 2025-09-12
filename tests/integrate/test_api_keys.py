"""
Integration tests for API key management endpoints.
"""
import pytest
import time


@pytest.mark.integration
class TestCreateApiKey:
    """Test API key creation endpoint"""
    
    def test_create_api_key_success(self, authenticated_client):
        """Test successful API key creation"""
        client, user_info = authenticated_client
        
        api_key_data = {
            "name": f"test_key_{int(time.time())}",
            "description": "Test API key for integration tests"
        }
        
        response = client.post("/v1/api-keys", json=api_key_data)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert data["name"] == api_key_data["name"]
        assert data["description"] == api_key_data["description"]
        assert "api_key" in data
        assert data["api_key"].startswith("ce_test_")  # Based on test config
        assert "created_at" in data
        assert data["last_used"] is None
    
    def test_create_api_key_with_expiry(self, authenticated_client):
        """Test API key creation with expiry date"""
        client, user_info = authenticated_client
        
        api_key_data = {
            "name": f"expiring_key_{int(time.time())}",
            "description": "Test API key with expiry",
            "expires_at": "2025-12-31T23:59:59Z"
        }
        
        response = client.post("/v1/api-keys", json=api_key_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["name"] == api_key_data["name"]
        assert "expires_at" in data
        assert data["expires_at"] == api_key_data["expires_at"]
    
    def test_create_api_key_missing_name(self, authenticated_client):
        """Test API key creation without name"""
        client, user_info = authenticated_client
        
        api_key_data = {
            "description": "Test API key without name"
        }
        
        response = client.post("/v1/api-keys", json=api_key_data)
        
        assert response.status_code == 422
        data = response.json()
        assert "error" in data
    
    def test_create_api_key_without_auth(self, clean_client):
        """Test API key creation without authentication"""
        api_key_data = {
            "name": "unauthorized_key",
            "description": "This should fail"
        }
        
        response = clean_client.post("/v1/api-keys", json=api_key_data)
        
        assert response.status_code == 401
        data = response.json()
        assert "error" in data


@pytest.mark.integration
class TestListApiKeys:
    """Test API key listing endpoint"""
    
    def test_list_api_keys_success(self, authenticated_client):
        """Test successful API key listing"""
        client, user_info = authenticated_client
        
        # Create a test API key first
        api_key_data = {
            "name": f"list_test_key_{int(time.time())}",
            "description": "Key for list test"
        }
        create_response = client.post("/v1/api-keys", json=api_key_data)
        assert create_response.status_code == 200
        
        # List API keys
        response = client.get("/v1/api-keys")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "api_keys" in data
        assert "pagination" in data
        
        # Verify pagination structure
        pagination = data["pagination"]
        assert "page" in pagination
        assert "limit" in pagination
        assert "total" in pagination
        assert "totalPages" in pagination
        
        # Verify at least our created key is in the list
        api_keys = data["api_keys"]
        assert len(api_keys) > 0
        
        # Find our created key
        our_key = next((key for key in api_keys if key["name"] == api_key_data["name"]), None)
        assert our_key is not None
        assert our_key["description"] == api_key_data["description"]
        assert "id" in our_key
        assert "created_at" in our_key
        assert "api_key" not in our_key  # API key value should not be in list response
    
    def test_list_api_keys_pagination(self, authenticated_client):
        """Test API key listing with pagination"""
        client, user_info = authenticated_client
        
        # Test with pagination parameters
        response = client.get("/v1/api-keys?page=1&limit=5")
        
        assert response.status_code == 200
        data = response.json()
        
        pagination = data["pagination"]
        assert pagination["page"] == 1
        assert pagination["limit"] == 5
    
    def test_list_api_keys_without_auth(self, clean_client):
        """Test API key listing without authentication"""
        response = clean_client.get("/v1/api-keys")
        
        assert response.status_code == 401
        data = response.json()
        assert "error" in data


@pytest.mark.integration
class TestRevokeApiKey:
    """Test API key revocation endpoint"""
    
    def test_revoke_api_key_success(self, authenticated_client):
        """Test successful API key revocation"""
        client, user_info = authenticated_client
        
        # Create an API key to revoke
        api_key_data = {
            "name": f"revoke_test_key_{int(time.time())}",
            "description": "Key to be revoked"
        }
        create_response = client.post("/v1/api-keys", json=api_key_data)
        assert create_response.status_code == 200
        created_key = create_response.json()
        
        key_id = created_key["id"]
        
        # Revoke the API key
        response = client.delete(f"/v1/api-keys/{key_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "revoked" in data["message"].lower()
        
        # Verify the key is no longer in the list
        list_response = client.get("/v1/api-keys")
        assert list_response.status_code == 200
        list_data = list_response.json()
        
        # The revoked key should not be in the active keys list
        active_keys = list_data["api_keys"]
        revoked_key = next((key for key in active_keys if key["id"] == key_id), None)
        assert revoked_key is None
    
    def test_revoke_nonexistent_api_key(self, authenticated_client):
        """Test revoking a non-existent API key"""
        client, user_info = authenticated_client
        
        fake_key_id = "key-nonexistent"
        response = client.delete(f"/v1/api-keys/{fake_key_id}")
        
        assert response.status_code == 400  # Invalid UUID format
        data = response.json()
        assert "error" in data
    
    def test_revoke_api_key_without_auth(self, clean_client):
        """Test API key revocation without authentication"""
        response = clean_client.delete("/v1/api-keys/some-key-id")
        
        assert response.status_code == 401
        data = response.json()
        assert "error" in data


@pytest.mark.integration
class TestApiKeyAuthentication:
    """Test using API keys for authentication"""
    
    def test_api_key_authentication(self, api_key_client):
        """Test making requests with API key authentication"""
        client, api_key_info, user_info = api_key_client
        
        # Test accessing user profile with API key
        response = client.get("/v1/user/profile")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should get the user profile for the user who created the API key
        assert data["email"] == user_info["user_data"]["email"]
        assert data["username"] == user_info["user_data"]["username"]
    
    def test_invalid_api_key_authentication(self, clean_client):
        """Test authentication with invalid API key"""
        clean_client.set_api_key("ce_test_invalid_key")
        
        response = clean_client.get("/v1/user/profile")
        
        assert response.status_code == 401
        data = response.json()
        assert "error" in data