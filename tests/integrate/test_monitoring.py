"""
Integration tests for deployment monitoring endpoints (logs, metrics, status).
"""
import pytest
import time


@pytest.mark.integration
class TestDeploymentLogs:
    """Test deployment logs endpoint"""
    
    def test_get_logs_success(self, api_key_client):
        """Test successful log retrieval"""
        client, api_key_info, user_info = api_key_client
        
        # Create a deployment first
        deployment_data = {
            "appName": f"logs-test-app-{int(time.time())}",
            "image": "nginx:latest",
            "port": 80
        }
        create_response = client.post("/v1/deployments", json=deployment_data)
        assert create_response.status_code == 201
        created_deployment = create_response.json()
        
        deployment_id = created_deployment["id"]
        
        # Get logs
        response = client.get(f"/v1/deployments/{deployment_id}/logs")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "logs" in data
        assert isinstance(data["logs"], list)
        
        # If there are logs, verify their structure
        if data["logs"]:
            log_entry = data["logs"][0]
            assert "timestamp" in log_entry
            assert "level" in log_entry or "message" in log_entry
            assert "source" in log_entry or "message" in log_entry
    
    def test_get_logs_with_parameters(self, api_key_client):
        """Test log retrieval with query parameters"""
        client, api_key_info, user_info = api_key_client
        
        # Create a deployment first
        deployment_data = {
            "appName": f"logs-params-app-{int(time.time())}",
            "image": "nginx:latest",
            "port": 80
        }
        create_response = client.post("/v1/deployments", json=deployment_data)
        assert create_response.status_code == 201
        created_deployment = create_response.json()
        
        deployment_id = created_deployment["id"]
        
        # Test with tail parameter
        response = client.get(f"/v1/deployments/{deployment_id}/logs?tail=50")
        assert response.status_code == 200
        
        # Test with since parameter
        response = client.get(f"/v1/deployments/{deployment_id}/logs?since=2025-01-01T00:00:00Z")
        assert response.status_code == 200
        
        # Test with multiple parameters
        response = client.get(f"/v1/deployments/{deployment_id}/logs?tail=100&follow=false")
        assert response.status_code == 200
    
    def test_get_logs_nonexistent_deployment(self, api_key_client):
        """Test getting logs for non-existent deployment"""
        client, api_key_info, user_info = api_key_client
        
        fake_deployment_id = "dpl-nonexistent"
        response = client.get(f"/v1/deployments/{fake_deployment_id}/logs")
        
        assert response.status_code == 404
        data = response.json()
        assert "error" in data
    
    def test_get_logs_without_auth(self, clean_client):
        """Test getting logs without authentication"""
        response = clean_client.get("/v1/deployments/some-id/logs")
        
        assert response.status_code == 401
        data = response.json()
        assert "error" in data


@pytest.mark.integration
class TestDeploymentMetrics:
    """Test deployment metrics endpoint"""
    
    def test_get_metrics_success(self, api_key_client):
        """Test successful metrics retrieval"""
        client, api_key_info, user_info = api_key_client
        
        # Create a deployment first
        deployment_data = {
            "appName": f"metrics-test-app-{int(time.time())}",
            "image": "nginx:latest",
            "port": 80
        }
        create_response = client.post("/v1/deployments", json=deployment_data)
        assert create_response.status_code == 201
        created_deployment = create_response.json()
        
        deployment_id = created_deployment["id"]
        
        # Get metrics
        response = client.get(f"/v1/deployments/{deployment_id}/metrics")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "metrics" in data
        metrics = data["metrics"]
        
        # Common metrics that should be available
        expected_metrics = ["cpu", "memory", "requests"]
        for metric in expected_metrics:
            if metric in metrics:
                assert isinstance(metrics[metric], list)
                # If there are data points, verify structure
                if metrics[metric]:
                    data_point = metrics[metric][0]
                    assert "timestamp" in data_point
                    assert "value" in data_point
    
    def test_get_metrics_with_parameters(self, api_key_client):
        """Test metrics retrieval with query parameters"""
        client, api_key_info, user_info = api_key_client
        
        # Create a deployment first
        deployment_data = {
            "appName": f"metrics-params-app-{int(time.time())}",
            "image": "nginx:latest",
            "port": 80
        }
        create_response = client.post("/v1/deployments", json=deployment_data)
        assert create_response.status_code == 201
        created_deployment = create_response.json()
        
        deployment_id = created_deployment["id"]
        
        # Test with time range parameters
        response = client.get(f"/v1/deployments/{deployment_id}/metrics?from=2025-01-01T00:00:00Z&to=2025-01-01T01:00:00Z")
        assert response.status_code == 200
        
        # Test with resolution parameter
        response = client.get(f"/v1/deployments/{deployment_id}/metrics?resolution=1m")
        assert response.status_code == 200
        
        # Test with all parameters
        response = client.get(f"/v1/deployments/{deployment_id}/metrics?from=2025-01-01T00:00:00Z&to=2025-01-01T01:00:00Z&resolution=5m")
        assert response.status_code == 200
    
    def test_get_metrics_nonexistent_deployment(self, api_key_client):
        """Test getting metrics for non-existent deployment"""
        client, api_key_info, user_info = api_key_client
        
        fake_deployment_id = "dpl-nonexistent"
        response = client.get(f"/v1/deployments/{fake_deployment_id}/metrics")
        
        assert response.status_code == 404
        data = response.json()
        assert "error" in data
    
    def test_get_metrics_without_auth(self, clean_client):
        """Test getting metrics without authentication"""
        response = clean_client.get("/v1/deployments/some-id/metrics")
        
        assert response.status_code == 401
        data = response.json()
        assert "error" in data


@pytest.mark.integration
class TestDeploymentStatus:
    """Test deployment status endpoint"""
    
    def test_get_status_success(self, api_key_client):
        """Test successful status retrieval"""
        client, api_key_info, user_info = api_key_client
        
        # Create a deployment first
        deployment_data = {
            "appName": f"status-test-app-{int(time.time())}",
            "image": "nginx:latest",
            "port": 80,
            "replicas": 2
        }
        create_response = client.post("/v1/deployments", json=deployment_data)
        assert create_response.status_code == 201
        created_deployment = create_response.json()
        
        deployment_id = created_deployment["id"]
        
        # Get status
        response = client.get(f"/v1/deployments/{deployment_id}/status")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "status" in data
        assert "health" in data
        assert "replicas" in data
        
        # Verify replica information
        replicas = data["replicas"]
        assert "desired" in replicas
        assert "ready" in replicas
        assert "available" in replicas
        
        # Verify other status fields
        assert "lastHealthCheck" in data
        assert "uptime" in data
        assert "restartCount" in data
        
        # Verify data types
        assert isinstance(data["restartCount"], int)
        assert data["replicas"]["desired"] == 2  # Should match what we created
    
    def test_get_status_nonexistent_deployment(self, api_key_client):
        """Test getting status for non-existent deployment"""
        client, api_key_info, user_info = api_key_client
        
        fake_deployment_id = "dpl-nonexistent"
        response = client.get(f"/v1/deployments/{fake_deployment_id}/status")
        
        assert response.status_code == 404
        data = response.json()
        assert "error" in data
    
    def test_get_status_without_auth(self, clean_client):
        """Test getting status without authentication"""
        response = clean_client.get("/v1/deployments/some-id/status")
        
        assert response.status_code == 401
        data = response.json()
        assert "error" in data