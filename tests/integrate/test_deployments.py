"""
Integration tests for deployment management endpoints.
"""
import pytest
import time


@pytest.mark.integration
class TestCreateDeployment:
    """Test deployment creation endpoint"""
    
    def test_create_deployment_success(self, api_key_client):
        """Test successful deployment creation"""
        client, api_key_info, user_info = api_key_client
        
        deployment_data = {
            "app_name": f"test-app-{int(time.time())}",
            "image": "nginx:latest",
            "port": 80,
            "env_vars": {
                "ENV": "test",
                "APP_NAME": "test-nginx"
            },
            "replicas": 1,
            "resources": {
                "cpu": "100m",
                "memory": "128Mi"
            },
            "healthCheck": {
                "path": "/",
                "initialDelaySeconds": 5,
                "periodSeconds": 10,
                "timeoutSeconds": 5,
                "failureThreshold": 3
            }
        }
        
        response = client.post("/v1/deployments", json=deployment_data)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert data["app_name"] == deployment_data["app_name"]
        assert data["image"] == deployment_data["image"]
        assert data["status"] == "pending"
        assert "url" in data
        assert data["url"].startswith("https://")
        assert deployment_data["app_name"] in data["url"]
        assert "created_at" in data
        assert "message" in data
        
        return data  # Return for use in other tests
    
    def test_create_deployment_minimal(self, api_key_client):
        """Test deployment creation with minimal required fields"""
        client, api_key_info, user_info = api_key_client
        
        deployment_data = {
            "app_name": f"minimal-app-{int(time.time())}",
            "image": "nginx:latest",
            "port": 80
        }
        
        response = client.post("/v1/deployments", json=deployment_data)
        
        assert response.status_code == 200
        # data = response.json()
        
        # assert data["app_name"] == deployment_data["app_name"]
        # assert data["image"] == deployment_data["image"]
        # assert data["status"] == "pending"
    
    def test_create_deployment_duplicate_name(self, api_key_client):
        """Test deployment creation with duplicate app name"""
        client, api_key_info, user_info = api_key_client
        
        app_name = f"duplicate-app-{int(time.time())}"
        deployment_data = {
            "app_name": app_name,
            "image": "nginx:latest",
            "port": 80
        }
        
        # Create first deployment
        response1 = client.post("/v1/deployments", json=deployment_data)
        assert response1.status_code == 200
        
        # Try to create another with same name
        response2 = client.post("/v1/deployments", json=deployment_data)
        
        assert response2.status_code == 409
       
    
    def test_create_deployment_missing_fields(self, api_key_client):
        """Test deployment creation with missing required fields"""
        client, api_key_info, user_info = api_key_client
        
        incomplete_data = {
            "app_name": f"incomplete-app-{int(time.time())}",
            # Missing image and port
        }
        
        response = client.post("/v1/deployments", json=incomplete_data)
        
        assert response.status_code == 422
      
    
    def test_create_deployment_without_auth(self, clean_client):
        """Test deployment creation without authentication"""
        deployment_data = {
            "app_name": "unauthorized-app",
            "image": "nginx:latest",
            "port": 80
        }
        
        response = clean_client.post("/v1/deployments", json=deployment_data)
        
        assert response.status_code == 401
        data = response.json()
        assert "error" in data


@pytest.mark.integration
class TestListDeployments:
    """Test deployment listing endpoint"""
    
    def test_list_deployments_success(self, api_key_client):
        """Test successful deployment listing"""
        client, api_key_info, user_info = api_key_client
        
        # Create a test deployment first
        deployment_data = {
            "app_name": f"list-test-app-{int(time.time())}",
            "image": "nginx:latest",
            "port": 80
        }
        create_response = client.post("/v1/deployments", json=deployment_data)
        print("Create response:", create_response.text)
        assert create_response.status_code == 200
        
        # List deployments
        response = client.get("/v1/deployments")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "deployments" in data
        assert "pagination" in data
        
        # Verify pagination structure
        pagination = data["pagination"]
        assert "page" in pagination
        assert "limit" in pagination
        assert "total" in pagination
        assert "total_pages" in pagination
        
        # Verify at least our created deployment is in the list
        deployments = data["deployments"]
        assert len(deployments) > 0
        
        # Find our created deployment
        our_deployment = next((d for d in deployments if d["app_name"] == deployment_data["app_name"]), None)
        assert our_deployment is not None
        assert "id" in our_deployment
        assert "status" in our_deployment
        assert "url" in our_deployment
        assert "created_at" in our_deployment
    
    def test_list_deployments_pagination(self, api_key_client):
        """Test deployment listing with pagination"""
        client, api_key_info, user_info = api_key_client
        
        # Test with pagination parameters
        response = client.get("/v1/deployments?page=1&limit=5")
        
        assert response.status_code == 200
        data = response.json()
        
        pagination = data["pagination"]
        assert pagination["page"] == 1
        assert pagination["limit"] == 5
    
    def test_list_deployments_filter_by_status(self, api_key_client):
        """Test deployment listing with status filter"""
        client, api_key_info, user_info = api_key_client
        
        # Test filtering by status
        response = client.get("/v1/deployments?status=pending")
        print("Response:", response.text)
        
        assert response.status_code == 200
        data = response.json()
        
        # All returned deployments should have pending status
        deployments = data["deployments"]
        for deployment in deployments:
            assert deployment["status"] == "pending"
    
    def test_list_deployments_without_auth(self, clean_client):
        """Test deployment listing without authentication"""
        response = clean_client.get("/v1/deployments")
        
        assert response.status_code == 401
        data = response.json()
        assert "error" in data


@pytest.mark.integration
class TestGetDeployment:
    """Test get deployment details endpoint"""
    
    def test_get_deployment_success(self, api_key_client):
        """Test successful deployment retrieval"""
        client, api_key_info, user_info = api_key_client
        
        # Create a deployment first
        deployment_data = {
            "app_name": f"get-test-app-{int(time.time())}",
            "image": "nginx:latest",
            "port": 80,
            "env_vars": {"TEST": "value"},
            "replicas": 2
        }
        create_response = client.post("/v1/deployments", json=deployment_data)
        assert create_response.status_code == 200
        created_deployment = create_response.json()
        
        deployment_id = created_deployment["id"]
        
        # Get deployment details
        response = client.get(f"/v1/deployments/{deployment_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify detailed response structure
        assert data["id"] == deployment_id
        assert data["app_name"] == deployment_data["app_name"]
        assert data["image"] == deployment_data["image"]
        assert data["port"] == deployment_data["port"]
        assert data["replicas"] == deployment_data["replicas"]
        assert "status" in data
        assert "url" in data
        assert "env_vars" in data
        assert data["env_vars"] == deployment_data["env_vars"]
        assert "created_at" in data
        assert "updated_at" in data
    
    def test_get_nonexistent_deployment(self, api_key_client):
        """Test getting a non-existent deployment"""
        client, api_key_info, user_info = api_key_client
        
        fake_deployment_id = "dpl-nonexistent"
        response = client.get(f"/v1/deployments/{fake_deployment_id}")
        
        assert response.status_code == 400
    
    def test_get_deployment_without_auth(self, clean_client):
        """Test getting deployment without authentication"""
        response = clean_client.get("/v1/deployments/some-id")
        
        assert response.status_code == 401
        data = response.json()
        assert "error" in data


@pytest.mark.integration
class TestUpdateDeployment:
    """Test deployment update endpoint"""
    
    def test_update_deployment_image(self, api_key_client):
        """Test updating deployment image"""
        client, api_key_info, user_info = api_key_client
        
        # Create a deployment first
        deployment_data = {
            "app_name": f"update-test-app-{int(time.time())}",
            "image": "nginx:1.20",
            "port": 80
        }
        create_response = client.post("/v1/deployments", json=deployment_data)
        assert create_response.status_code == 200
        created_deployment = create_response.json()
        
        deployment_id = created_deployment["id"]
        
        # Update the deployment
        update_data = {
            "image": "nginx:latest"
        }
        
        response = client.put(f"/v1/deployments/{deployment_id}", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == deployment_id
        assert data["status"] == "updating"
        assert "message" in data
        assert "updated_at" in data
    
    def test_update_deployment_env_vars(self, api_key_client):
        """Test updating deployment environment variables"""
        client, api_key_info, user_info = api_key_client
        
        # Create a deployment first
        deployment_data = {
            "app_name": f"env-update-app-{int(time.time())}",
            "image": "nginx:latest",
            "port": 80,
            "env_vars": {"OLD_VAR": "old_value"}
        }
        create_response = client.post("/v1/deployments", json=deployment_data)
        assert create_response.status_code == 200
        created_deployment = create_response.json()
        
        deployment_id = created_deployment["id"]
        
        # Update environment variables
        update_data = {
            "env_vars": {
                "NEW_VAR": "new_value",
                "ANOTHER_VAR": "another_value"
            }
        }
        
        response = client.put(f"/v1/deployments/{deployment_id}", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == deployment_id
        assert data["status"] == "updating"
    
    def test_update_nonexistent_deployment(self, api_key_client):
        """Test updating a non-existent deployment"""
        client, api_key_info, user_info = api_key_client
        
        fake_deployment_id = "dpl-nonexistent"
        update_data = {"image": "nginx:latest"}
        
        response = client.put(f"/v1/deployments/{fake_deployment_id}", json=update_data)
        
        assert response.status_code == 400
      


@pytest.mark.integration
class TestScaleDeployment:
    """Test deployment scaling endpoint"""
    
    def test_scale_deployment_success(self, api_key_client):
        """Test successful deployment scaling"""
        client, api_key_info, user_info = api_key_client
        
        # Create a deployment first
        deployment_data = {
            "app_name": f"scale-test-app-{int(time.time())}",
            "image": "nginx:latest",
            "port": 80,
            "replicas": 1
        }
        create_response = client.post("/v1/deployments", json=deployment_data)
        assert create_response.status_code == 200
        created_deployment = create_response.json()
        
        deployment_id = created_deployment["id"]
        
        # Scale the deployment
        scale_data = {"replicas": 3}
        
        response = client.patch(f"/v1/deployments/{deployment_id}/scale", json=scale_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == deployment_id
        assert data["replicas"] == 3
        assert data["status"] == "scaling"
        assert "message" in data
    
    def test_scale_deployment_invalid_replicas(self, api_key_client):
        """Test scaling with invalid replica count"""
        client, api_key_info, user_info = api_key_client
        
        # Create a deployment first
        deployment_data = {
            "app_name": f"invalid-scale-app-{int(time.time())}",
            "image": "nginx:latest",
            "port": 80
        }
        create_response = client.post("/v1/deployments", json=deployment_data)
        assert create_response.status_code == 200
        created_deployment = create_response.json()
        
        deployment_id = created_deployment["id"]
        
        # Try to scale to invalid number
        scale_data = {"replicas": -1}
        
        response = client.patch(f"/v1/deployments/{deployment_id}/scale", json=scale_data)
        
        assert response.status_code == 400
        data = response.json()
        assert "error" in data


@pytest.mark.integration
class TestDeploymentLifecycle:
    """Test deployment start/stop endpoints"""
    
    def test_stop_deployment(self, api_key_client):
        """Test stopping a deployment"""
        client, api_key_info, user_info = api_key_client
        
        # Create a deployment first
        deployment_data = {
            "app_name": f"stop-test-app-{int(time.time())}",
            "image": "nginx:latest",
            "port": 80
        }
        create_response = client.post("/v1/deployments", json=deployment_data)
        assert create_response.status_code == 200
        created_deployment = create_response.json()
        
        deployment_id = created_deployment["id"]
        
        # Stop the deployment
        response = client.post(f"/v1/deployments/{deployment_id}/stop")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == deployment_id
        assert data["status"] == "stopping"
        assert "message" in data
    
    def test_start_deployment(self, api_key_client):
        """Test starting a deployment"""
        client, api_key_info, user_info = api_key_client
        
        # Create a deployment first
        deployment_data = {
            "app_name": f"start-test-app-{int(time.time())}",
            "image": "nginx:latest",
            "port": 80
        }
        create_response = client.post("/v1/deployments", json=deployment_data)
        assert create_response.status_code == 200
        created_deployment = create_response.json()
        
        deployment_id = created_deployment["id"]
        
        # Start the deployment
        response = client.post(f"/v1/deployments/{deployment_id}/start")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == deployment_id
        assert data["status"] == "starting"
        assert "message" in data


@pytest.mark.integration
class TestDeleteDeployment:
    """Test deployment deletion endpoint"""
    
    def test_delete_deployment_success(self, api_key_client):
        """Test successful deployment deletion"""
        client, api_key_info, user_info = api_key_client
        
        # Create a deployment first
        deployment_data = {
            "app_name": f"delete-test-app-{int(time.time())}",
            "image": "nginx:latest",
            "port": 80
        }
        create_response = client.post("/v1/deployments", json=deployment_data)
        assert create_response.status_code == 200
        created_deployment = create_response.json()
        
        deployment_id = created_deployment["id"]
        
        # Delete the deployment
        response = client.delete(f"/v1/deployments/{deployment_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "deleted" in data["message"].lower()
        
        # Verify the deployment is no longer accessible
        get_response = client.get(f"/v1/deployments/{deployment_id}")
        assert get_response.status_code == 404
    
    def test_delete_nonexistent_deployment(self, api_key_client):
        """Test deleting a non-existent deployment"""
        client, api_key_info, user_info = api_key_client
        
        fake_deployment_id = "dpl-nonexistent"
        response = client.delete(f"/v1/deployments/{fake_deployment_id}")
        
        assert response.status_code == 400
        