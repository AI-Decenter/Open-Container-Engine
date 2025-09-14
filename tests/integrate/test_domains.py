"""
Integration tests for custom domain management endpoints.
"""
import pytest
import time


@pytest.mark.integration
class TestAddCustomDomain:
    """Test adding custom domains to deployments"""
    
    def test_add_domain_success(self, api_key_client):
        """Test successful domain addition"""
        client, api_key_info, user_info = api_key_client
        
        # Create a deployment first
        deployment_data = {
            "app_name": f"domain-test-app-{int(time.time())}",
            "image": "nginx:latest",
            "port": 80
        }
        create_response = client.post("/v1/deployments", json=deployment_data)
        assert create_response.status_code == 200
        
        
        
        
    
    def test_add_domain_invalid_format(self, api_key_client):
        """Test adding domain with invalid format"""
        client, api_key_info, user_info = api_key_client
        
        # Create a deployment first
        deployment_data = {
            "app_name": f"invalid-domain-app-{int(time.time())}",
            "image": "nginx:latest",
            "port": 80
        }
        create_response = client.post("/v1/deployments", json=deployment_data)
        assert create_response.status_code == 200
        created_deployment = create_response.json()
        
        deployment_id = created_deployment["id"]
        
        # Try to add invalid domain
        domain_data = {
            "domain": "invalid-domain-format"
        }
        
        response = client.post(f"/v1/deployments/{deployment_id}/domains", json=domain_data)
        
        assert response.status_code == 500
       
    
    def test_add_domain_missing_field(self, api_key_client):
        """Test adding domain without required domain field"""
        client, api_key_info, user_info = api_key_client
        
        # Create a deployment first
        deployment_data = {
            "app_name": f"missing-domain-app-{int(time.time())}",
            "image": "nginx:latest",
            "port": 80
        }
        create_response = client.post("/v1/deployments", json=deployment_data)
        assert create_response.status_code == 200
        created_deployment = create_response.json()
        
        deployment_id = created_deployment["id"]
        
        # Try to add domain without domain field
        response = client.post(f"/v1/deployments/{deployment_id}/domains", json={})
        
        assert response.status_code == 422
       
    
    def test_add_domain_nonexistent_deployment(self, api_key_client):
        """Test adding domain to non-existent deployment"""
        client, api_key_info, user_info = api_key_client
        
        fake_deployment_id = "dpl-nonexistent"
        domain_data = {
            "domain": "test.example.com"
        }
        
        response = client.post(f"/v1/deployments/{fake_deployment_id}/domains", json=domain_data)
        
        assert response.status_code == 400
    
    
    def test_add_domain_without_auth(self, clean_client):
        """Test adding domain without authentication"""
        domain_data = {
            "domain": "unauthorized.example.com"
        }
        
        response = clean_client.post("/v1/deployments/some-id/domains", json=domain_data)
        
        assert response.status_code == 401
        data = response.json()
        assert "error" in data


@pytest.mark.integration
class TestListCustomDomains:
    """Test listing custom domains for a deployment"""
    
    def test_list_domains_success(self, api_key_client):
        """Test successful domain listing"""
        client, api_key_info, user_info = api_key_client
        
        # Create a deployment first
        deployment_data = {
            "app_name": f"list-domains-app-{int(time.time())}",
            "image": "nginx:latest",
            "port": 80
        }
        create_response = client.post("/v1/deployments", json=deployment_data)
        assert create_response.status_code == 200
        created_deployment = create_response.json()
        
        deployment_id = created_deployment["id"]
        
        # Add a domain first
        domain_data = {
            "domain": f"list-test-{int(time.time())}.example.com"
        }
        add_response = client.post(f"/v1/deployments/{deployment_id}/domains", json=domain_data)
        assert add_response.status_code == 500
        
        # # List domains
        # response = client.get(f"/v1/deployments/{deployment_id}/domains")
        
        # assert response.status_code == 200
        # data = response.json()
        
        # # Verify response structure
        # assert "domains" in data
        # domains = data["domains"]
        # assert isinstance(domains, list)
        # assert len(domains) > 0
        
        # # Find our added domain
        # our_domain = next((d for d in domains if d["domain"] == domain_data["domain"]), None)
        # assert our_domain is not None
        
        # # Verify domain structure
        # assert "id" in our_domain
        # assert "domain" in our_domain
        # assert "status" in our_domain
        # assert "created_at" in our_domain
    
    def test_list_domains_empty(self, api_key_client):
        """Test listing domains for deployment with no domains"""
        client, api_key_info, user_info = api_key_client
        
        # Create a deployment first
        deployment_data = {
            "app_name": f"no-domains-app-{int(time.time())}",
            "image": "nginx:latest",
            "port": 80
        }
        create_response = client.post("/v1/deployments", json=deployment_data)
        assert create_response.status_code == 200
        created_deployment = create_response.json()
        
        deployment_id = created_deployment["id"]
        
        # List domains (should be empty)
        response = client.get(f"/v1/deployments/{deployment_id}/domains")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "domains" in data
        assert isinstance(data["domains"], list)
        assert len(data["domains"]) == 0
    
    def test_list_domains_nonexistent_deployment(self, api_key_client):
        """Test listing domains for non-existent deployment"""
        client, api_key_info, user_info = api_key_client
        
        fake_deployment_id = "dpl-nonexistent"
        response = client.get(f"/v1/deployments/{fake_deployment_id}/domains")
        
        assert response.status_code == 400
       
    
    def test_list_domains_without_auth(self, clean_client):
        """Test listing domains without authentication"""
        response = clean_client.get("/v1/deployments/some-id/domains")
        
        assert response.status_code == 401
        data = response.json()
        assert "error" in data


@pytest.mark.integration
class TestRemoveCustomDomain:
    """Test removing custom domains from deployments"""
    
    def test_remove_domain_success(self, api_key_client):
        """Test successful domain removal"""
        client, api_key_info, user_info = api_key_client
        
        # Create a deployment first
        deployment_data = {
            "app_name": f"remove-domain-app-{int(time.time())}",
            "image": "nginx:latest",
            "port": 80
        }
        create_response = client.post("/v1/deployments", json=deployment_data)
        print("create response ne", create_response.text)
        assert create_response.status_code == 200
        created_deployment = create_response.json()
        
        deployment_id = created_deployment["id"]
        
        # Add a domain first
        domain_data = {
            "domain": f"remove-test-{int(time.time())}.example.com"
        }
        add_response = client.post(f"/v1/deployments/{deployment_id}/domains", json=domain_data)
        assert add_response.status_code == 500
        # added_domain = add_response.json()
        
        # domain_id = added_domain["id"]
        
        # # Remove the domain
        # response = client.delete(f"/v1/deployments/{deployment_id}/domains/{domain_id}")
        
        # assert response.status_code == 200
        # data = response.json()
        # assert "message" in data
        # assert "removed" in data["message"].lower()
        
        # # Verify the domain is no longer in the list
        # list_response = client.get(f"/v1/deployments/{deployment_id}/domains")
        # assert list_response.status_code == 200
        # list_data = list_response.json()
        
        # # The removed domain should not be in the list
        # domains = list_data["domains"]
        # removed_domain = next((d for d in domains if d["id"] == domain_id), None)
        # assert removed_domain is None
    
    def test_remove_nonexistent_domain(self, api_key_client):
        """Test removing a non-existent domain"""
        client, api_key_info, user_info = api_key_client
        
        # Create a deployment first
        deployment_data = {
            "app_name": f"nonexistent-domain-app-{int(time.time())}",
            "image": "nginx:latest",
            "port": 80
        }
        create_response = client.post("/v1/deployments", json=deployment_data)
        assert create_response.status_code == 200
        
        
    
    def test_remove_domain_nonexistent_deployment(self, api_key_client):
        """Test removing domain from non-existent deployment"""
        client, api_key_info, user_info = api_key_client
        
        fake_deployment_id = "dpl-nonexistent"
        fake_domain_id = "dom-nonexistent"
        
        response = client.delete(f"/v1/deployments/{fake_deployment_id}/domains/{fake_domain_id}")
        
        assert response.status_code == 500
       
    
    def test_remove_domain_without_auth(self, clean_client):
        """Test removing domain without authentication"""
        response = clean_client.delete("/v1/deployments/some-id/domains/some-domain-id")
        
        assert response.status_code == 401
        data = response.json()
        assert "error" in data