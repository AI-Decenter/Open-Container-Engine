"""
Integration tests for authentication endpoints.
"""
import pytest
import time
from tests.integrate.conftest import create_test_user


@pytest.mark.integration
class TestUserRegistration:
    """Test user registration endpoint"""
    
    def test_register_user_success(self, clean_client):
        """Test successful user registration"""
        user_data = {
            "username": f"testuser_{int(time.time())}",
            "email": f"test_{int(time.time())}@example.com",
            "password": "TestPassword123!",
            "confirm_password": "TestPassword123!"
        }
        
        response = clean_client.post("/v1/auth/register", json=user_data)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert data["username"] == user_data["username"]
        assert data["email"] == user_data["email"]
        assert "created_at" in data
        assert data["status"] == "active"
        assert "password" not in data  # Password should not be returned
    
    def test_register_user_password_mismatch(self, clean_client):
        """Test registration with password mismatch"""
        user_data = {
            "username": f"testuser_{int(time.time())}",
            "email": f"test_{int(time.time())}@example.com",
            "password": "TestPassword123!",
            "confirm_password": "DifferentPassword123!"
        }
        
        response = clean_client.post("/v1/auth/register", json=user_data)
        
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
        assert "do not match" in data["error"]["message"].lower()
    
    def test_register_user_duplicate_email(self, clean_client):
        """Test registration with duplicate email"""
        user_data = {
            "username": f"testuser1_{int(time.time())}",
            "email": f"duplicate_{int(time.time())}@example.com",
            "password": "TestPassword123!",
            "confirm_password": "TestPassword123!"
        }
        
        # Register first user
        response1 = clean_client.post("/v1/auth/register", json=user_data)
        assert response1.status_code == 200
        
        # Try to register with same email but different username
        user_data["username"] = f"testuser2_{int(time.time())}"
        response2 = clean_client.post("/v1/auth/register", json=user_data)
        
        assert response2.status_code == 409
        data = response2.json()
        assert "error" in data
    
    def test_register_user_invalid_email(self, clean_client):
        """Test registration with invalid email"""
        user_data = {
            "username": f"testuser_{int(time.time())}",
            "email": "invalid-email",
            "password": "TestPassword123!",
            "confirm_password": "TestPassword123!"
        }
        
        response = clean_client.post("/v1/auth/register", json=user_data)
        
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
    
    def test_register_user_missing_fields(self, clean_client):
        """Test registration with missing required fields"""
        incomplete_data = {
            "username": f"testuser_{int(time.time())}",
            "password": "TestPassword123!"
            # Missing email and confirm_password
        }
        
        response = clean_client.post("/v1/auth/register", json=incomplete_data)
        
        assert response.status_code == 422
        # Note: Some validation errors may not return JSON
        if response.headers.get('content-type', '').startswith('application/json'):
            data = response.json()
            assert "error" in data


@pytest.mark.integration
class TestUserLogin:
    """Test user login endpoint"""
    
    def test_login_success(self, clean_client):
        """Test successful user login"""
        # First register a user
        user_info = create_test_user(clean_client)
        clean_client.clear_auth()  # Clear auth set by create_test_user
        
        # Now login
        login_data = {
            "email": user_info["user_data"]["email"],
            "password": user_info["user_data"]["password"]
        }
        
        response = clean_client.post("/v1/auth/login", json=login_data)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "access_token" in data
        assert "refresh_token" in data
        assert "expires_at" in data
        assert "user" in data
        
        user = data["user"]
        assert user["email"] == user_info["user_data"]["email"]
        assert user["username"] == user_info["user_data"]["username"]
        assert "password" not in user
    
    def test_login_invalid_credentials(self, clean_client):
        """Test login with invalid credentials"""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "WrongPassword123!"
        }
        
        response = clean_client.post("/v1/auth/login", json=login_data)
        
        assert response.status_code == 401
        data = response.json()
        assert "error" in data
    
    def test_login_missing_fields(self, clean_client):
        """Test login with missing fields"""
        incomplete_data = {
            "email": "test@example.com"
            # Missing password
        }
        
        response = clean_client.post("/v1/auth/login", json=incomplete_data)
        
        assert response.status_code == 422
        # Note: Some validation errors may not return JSON
        if response.headers.get('content-type', '').startswith('application/json'):
            data = response.json()
            assert "error" in data


@pytest.mark.integration
class TestTokenRefresh:
    """Test token refresh endpoint"""
    
    def test_refresh_token_success(self, clean_client):
        """Test successful token refresh"""
        # Create user and get tokens
        user_info = create_test_user(clean_client)
        clean_client.clear_auth()
        
        refresh_token = user_info["login_data"]["refresh_token"]
        
        response = clean_client.post("/v1/auth/refresh", json={
            "refresh_token": refresh_token
        })
        
        assert response.status_code == 200
        data = response.json()
        
        assert "access_token" in data
        assert "expires_at" in data
        # Note: New token might be the same if generated too quickly
        assert len(data["access_token"]) > 0
    
    def test_refresh_token_invalid(self, clean_client):
        """Test refresh with invalid token"""
        response = clean_client.post("/v1/auth/refresh", json={
            "refresh_token": "invalid-refresh-token"
        })
        
        assert response.status_code == 401
        data = response.json()
        assert "error" in data


@pytest.mark.integration
class TestLogout:
    """Test logout endpoint"""
    
    def test_logout_success(self, authenticated_client):
        """Test successful logout"""
        client, user_info = authenticated_client
        
        response = client.post("/v1/auth/logout")
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "logged out" in data["message"].lower()
    
    def test_logout_without_auth(self, clean_client):
        """Test logout without authentication"""
        response = clean_client.post("/v1/auth/logout")
        
        assert response.status_code == 401
        data = response.json()
        assert "error" in data