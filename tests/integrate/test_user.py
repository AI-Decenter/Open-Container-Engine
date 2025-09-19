"""
Integration tests for user profile management endpoints.
"""
import pytest
import time


@pytest.mark.integration
class TestGetUserProfile:
    """Test get user profile endpoint"""
    
    def test_get_profile_success(self, authenticated_client):
        """Test successful user profile retrieval"""
        client, user_info = authenticated_client
        
        response = client.get("/v1/user/profile")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert data["username"] == user_info["user_data"]["username"]
        assert data["email"] == user_info["user_data"]["email"]
        assert "created_at" in data
        assert "last_login" in data
        assert "deployment_count" in data
        assert "api_key_count" in data
        
        # Verify data types
        assert isinstance(data["deployment_count"], int)
        assert isinstance(data["api_key_count"], int)
        
        # Password should not be included
        assert "password" not in data
    
    def test_get_profile_with_api_key(self, api_key_client):
        """Test getting user profile with API key authentication"""
        client, api_key_info, user_info = api_key_client
        
        response = client.get("/v1/user/profile")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["username"] == user_info["user_data"]["username"]
        assert data["email"] == user_info["user_data"]["email"]
    
    def test_get_profile_without_auth(self, clean_client):
        """Test getting user profile without authentication"""
        response = clean_client.get("/v1/user/profile")
        
        assert response.status_code == 401
        data = response.json()
        assert "error" in data


@pytest.mark.integration
class TestUpdateUserProfile:
    """Test update user profile endpoint"""
    
    def test_update_profile_username(self, authenticated_client):
        """Test updating username"""
        client, user_info = authenticated_client
        
        new_username = f"updated_user_{int(time.time())}"
        update_data = {
            "username": new_username
        }
        
        response = client.put("/v1/user/profile", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["username"] == new_username
        assert data["email"] == user_info["user_data"]["email"]  # Should remain unchanged
        assert "updated_at" in data
        
        # Verify the change persisted by getting profile again
        profile_response = client.get("/v1/user/profile")
        assert profile_response.status_code == 200
        profile_data = profile_response.json()
        assert profile_data["username"] == new_username
    
    def test_update_profile_email(self, authenticated_client):
        """Test updating email"""
        client, user_info = authenticated_client
        
        new_email = f"updated_{int(time.time())}@example.com"
        update_data = {
            "email": new_email
        }
        
        response = client.put("/v1/user/profile", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["email"] == new_email
        assert data["username"] == user_info["user_data"]["username"]  # Should remain unchanged
        assert "updated_at" in data
    
    def test_update_profile_both_fields(self, authenticated_client):
        """Test updating both username and email"""
        client, user_info = authenticated_client
        
        new_username = f"updated_both_{int(time.time())}"
        new_email = f"updated_both_{int(time.time())}@example.com"
        update_data = {
            "username": new_username,
            "email": new_email
        }
        
        response = client.put("/v1/user/profile", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["username"] == new_username
        assert data["email"] == new_email
        assert "updated_at" in data
    
    def test_update_profile_invalid_email(self, authenticated_client):
        """Test updating with invalid email"""
        client, user_info = authenticated_client
        
        update_data = {
            "email": "invalid-email-format"
        }
        
        response = client.put("/v1/user/profile", json=update_data)
        
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
    
    def test_update_profile_duplicate_username(self, authenticated_client, clean_client):
        """Test updating to a username that already exists"""
        client, user_info = authenticated_client
        
        # Create another user first
        from tests.integrate.conftest import create_test_user
        other_user_info = create_test_user(clean_client)
        clean_client.clear_auth()
        
        # Try to update to the other user's username
        update_data = {
            "username": other_user_info["user_data"]["username"]
        }
        
        response = client.put("/v1/user/profile", json=update_data)
        
        assert response.status_code == 401
        data = response.json()
        assert "error" in data
    
    def test_update_profile_empty_request(self, authenticated_client):
        """Test updating with empty request body"""
        client, user_info = authenticated_client
        
        response = client.put("/v1/user/profile", json={})
        
        # Should be successful but no changes
        assert response.status_code == 400
       
    
    def test_update_profile_without_auth(self, clean_client):
        """Test updating profile without authentication"""
        update_data = {
            "username": "unauthorized_update"
        }
        
        response = clean_client.put("/v1/user/profile", json=update_data)
        
        assert response.status_code == 401
        data = response.json()
        assert "error" in data


@pytest.mark.integration
class TestChangePassword:
    """Test change password endpoint"""
    
    def test_change_password_success(self, authenticated_client):
        """Test successful password change"""
        client, user_info = authenticated_client
        
        new_password = "NewTestPassword123!"
        password_data = {
            "current_password": user_info["user_data"]["password"],
            "new_password": new_password,
            "confirm_new_password": new_password
        }
        
        response = client.put("/v1/user/password", json=password_data)
        
        assert response.status_code == 200
       
        
        # Verify we can login with the new password
        client.clear_auth()
        login_response = client.post("/v1/auth/login", json={
            "email": user_info["user_data"]["email"],
            "password": new_password
        })
        
        assert login_response.status_code == 200
        
        # Verify old password no longer works
        old_login_response = client.post("/v1/auth/login", json={
            "email": user_info["user_data"]["email"],
            "password": user_info["user_data"]["password"]
        })
        
        assert old_login_response.status_code == 401
    
    def test_change_password_wrong_current(self, authenticated_client):
        """Test password change with wrong current password"""
        client, user_info = authenticated_client
        
        password_data = {
            "current_password": "WrongCurrentPassword123!",
            "new_password": "NewTestPassword123!",
            "confirm_new_password": "NewTestPassword123!"
        }
        
        response = client.put("/v1/user/password", json=password_data)
        
    
        
        assert response.status_code == 401
       
    
    def test_change_password_mismatch(self, authenticated_client):
        """Test password change with new password mismatch"""
        client, user_info = authenticated_client
        
        password_data = {
            "currentPassword": user_info["user_data"]["password"],
            "newPassword": "NewTestPassword123!",
            "confirmNewPassword": "DifferentPassword123!"
        }
        
        response = client.put("/v1/user/password", json=password_data)
        
        assert response.status_code == 422
        
    
    def test_change_password_weak_password(self, authenticated_client):
        """Test password change with weak new password"""
        client, user_info = authenticated_client
        
        password_data = {
            "currentPassword": user_info["user_data"]["password"],
            "newPassword": "weak",
            "confirmNewPassword": "weak"
        }
        
        response = client.put("/v1/user/password", json=password_data)
        
        assert response.status_code == 422
       
    
    def test_change_password_missing_fields(self, authenticated_client):
        """Test password change with missing fields"""
        client, user_info = authenticated_client
        
        password_data = {
            "current_password": user_info["user_data"]["password"],
            "new_password": "NewTestPassword123!"
            # Missing confirmNewPassword
        }
        
        response = client.put("/v1/user/password", json=password_data)
        
        assert response.status_code == 422
     
    
    def test_change_password_without_auth(self, clean_client):
        """Test password change without authentication"""
        password_data = {
            "current_password": "current",
            "new_password": "new",
            "confirmNewPassword": "new"
        }
        
        response = clean_client.put("/v1/user/password", json=password_data)
        
        assert response.status_code == 401
        data = response.json()
        assert "error" in data