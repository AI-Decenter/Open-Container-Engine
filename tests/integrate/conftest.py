"""
Test configuration and utilities for Container Engine integration tests.
"""
import os
import time
import docker
import requests
import subprocess
from typing import Dict, Optional
import psycopg2
import redis
from dotenv import load_dotenv

# Load environment-specific .env file for tests
environment = os.getenv("ENVIRONMENT", "integrate_test")
env_file = f".env.{environment}"

# Try to load environment-specific file, fallback to .env.test, then .env
if os.path.exists(env_file):
    load_dotenv(env_file)
elif os.path.exists("tests/.env.test"):
    load_dotenv("tests/.env.test")
else:
    load_dotenv()

class TestConfig:
    """Test configuration settings"""
    
    # Server settings
    BASE_URL = os.getenv("TEST_BASE_URL", "http://localhost:3001")  # Use port 3001 for tests
    HEALTH_ENDPOINT = "/health"
    
    # Database settings
    DB_HOST = os.getenv("TEST_DB_HOST", "localhost")
    DB_PORT = int(os.getenv("TEST_DB_PORT", "5432"))
    DB_USER = os.getenv("TEST_DB_USER", "postgres")
    DB_PASSWORD = os.getenv("TEST_DB_PASSWORD", "password")
    DB_NAME = os.getenv("TEST_DB_NAME", "container_engine_test")
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    
    # Redis settings
    REDIS_HOST = os.getenv("TEST_REDIS_HOST", "localhost")
    REDIS_PORT = int(os.getenv("TEST_REDIS_PORT", "6379"))
    REDIS_URL = f"redis://{REDIS_HOST}:{REDIS_PORT}"
    
    # Test timeouts
    SERVER_START_TIMEOUT = 60  # seconds
    HEALTH_CHECK_TIMEOUT = 30  # seconds
    REQUEST_TIMEOUT = 10  # seconds
    
    # Docker settings
    DOCKER_COMPOSE_FILE = "docker-compose.test.yml"


class TestServerManager:
    """Manages test server lifecycle"""
    
    def __init__(self):
        self.docker_client = docker.from_env()
        self.server_process = None
        self.containers_started = []
        self.is_github_actions = self._detect_github_actions()
    
    def _detect_github_actions(self) -> bool:
        """Detect if running in GitHub Actions environment"""
        return (
            os.getenv("GITHUB_ACTIONS") == "true" or 
            os.getenv("CI") == "true" or
            os.getenv("RUNNER_OS") is not None
        )
    
    def start_dependencies(self):
        """Start PostgreSQL and Redis using Docker"""
        print("Starting test dependencies...")
        
        # Skip Docker container creation in GitHub Actions since services are provided
        if self.is_github_actions:
            print("Detected GitHub Actions environment - using provided services")
            self._wait_for_dependencies()
            return
        
        # Start PostgreSQL
        try:
            postgres_container = self.docker_client.containers.run(
                "postgres:16",
                environment={
                    "POSTGRES_DB": TestConfig.DB_NAME,
                    "POSTGRES_USER": TestConfig.DB_USER,
                    "POSTGRES_PASSWORD": TestConfig.DB_PASSWORD,
                },
                ports={"5432/tcp": TestConfig.DB_PORT},
                detach=True,
                remove=True,
                name="test_postgres"
            )
            self.containers_started.append(postgres_container)
            print(f"Started PostgreSQL container: {postgres_container.id[:12]}")
        except docker.errors.APIError as e:
            if "already in use" in str(e):
                print("PostgreSQL container already running")
            else:
                raise
        
        # Start Redis
        try:
            redis_container = self.docker_client.containers.run(
                "redis:7-alpine",
                ports={"6379/tcp": TestConfig.REDIS_PORT},
                detach=True,
                remove=True,
                name="test_redis"
            )
            self.containers_started.append(redis_container)
            print(f"Started Redis container: {redis_container.id[:12]}")
        except docker.errors.APIError as e:
            if "already in use" in str(e):
                print("Redis container already running")
            else:
                raise
        
        # Wait for containers to be ready
        self._wait_for_dependencies()
    
    def _wait_for_dependencies(self):
        """Wait for PostgreSQL and Redis to be ready"""
        print("Waiting for dependencies to be ready...")
        
        # Wait for PostgreSQL
        for i in range(30):
            try:
                conn = psycopg2.connect(
                    host=TestConfig.DB_HOST,
                    port=TestConfig.DB_PORT,
                    user=TestConfig.DB_USER,
                    password=TestConfig.DB_PASSWORD,
                    database=TestConfig.DB_NAME
                )
                conn.close()
                print("PostgreSQL is ready")
                break
            except psycopg2.OperationalError:
                time.sleep(1)
        else:
            raise Exception("PostgreSQL failed to start")
        
        # Wait for Redis
        for i in range(30):
            try:
                r = redis.Redis(host=TestConfig.REDIS_HOST, port=TestConfig.REDIS_PORT)
                r.ping()
                print("Redis is ready")
                break
            except redis.ConnectionError:
                time.sleep(1)
        else:
            raise Exception("Redis failed to start")
    
    def start_server(self):
        """Start the Container Engine server"""
        print("Starting Container Engine server...")
        
        # Set environment variables for the server
        env = os.environ.copy()
        env.update({
            "ENVIRONMENT": "integrate_test",  # This will load .env.integrate_test
            "DATABASE_URL": TestConfig.DATABASE_URL,
            "REDIS_URL": TestConfig.REDIS_URL,
            "PORT": "3001",  # Use port 3001 to avoid conflicts
            "JWT_SECRET": "test-jwt-secret-key",
            "JWT_EXPIRES_IN": "3600",
            "API_KEY_PREFIX": "ce_test_",
            "KUBERNETES_NAMESPACE": "test",
            "DOMAIN_SUFFIX": "test.local",
            "RUST_LOG": "container_engine=info,tower_http=info"
        })
        
        # Start the server
        self.server_process = subprocess.Popen(
            ["cargo", "run"],
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Wait for server to be ready
        self._wait_for_server()
    
    def _wait_for_server(self):
        """Wait for the server to respond to health checks"""
        print("Waiting for server to be ready...")
        
        for i in range(TestConfig.SERVER_START_TIMEOUT):
            try:
                response = requests.get(
                    f"{TestConfig.BASE_URL}{TestConfig.HEALTH_ENDPOINT}",
                    timeout=TestConfig.REQUEST_TIMEOUT
                )
                if response.status_code == 200:
                    print("Server is ready")
                    return
            except requests.exceptions.RequestException:
                pass
            time.sleep(1)
        
        raise Exception("Server failed to start")
    
    def stop_server(self):
        """Stop the server and containers"""
        print("Stopping test environment...")
        
        if self.server_process:
            self.server_process.terminate()
            self.server_process.wait()
            print("Server stopped")
        
        # Only stop containers if we started them (not in GitHub Actions)
        if not self.is_github_actions:
            for container in self.containers_started:
                try:
                    container.stop()
                    print(f"Stopped container: {container.id[:12]}")
                except docker.errors.NotFound:
                    pass
        else:
            print("Skipping container cleanup in GitHub Actions environment")
    
    def is_server_running(self) -> bool:
        """Check if the server is running"""
        try:
            response = requests.get(
                f"{TestConfig.BASE_URL}{TestConfig.HEALTH_ENDPOINT}",
                timeout=TestConfig.REQUEST_TIMEOUT
            )
            return response.status_code == 200
        except requests.exceptions.RequestException:
            return False


class APIClient:
    """HTTP client for making API requests"""
    
    def __init__(self, base_url: str = None):
        self.base_url = base_url or TestConfig.BASE_URL
        self.session = requests.Session()
        self.auth_token = None
        self.api_key = None
    
    def set_auth_token(self, token: str):
        """Set authentication token for requests"""
        self.auth_token = token
        self.session.headers.update({"Authorization": f"Bearer {token}"})
    
    def set_api_key(self, api_key: str):
        """Set API key for requests"""
        self.api_key = api_key
        self.session.headers.update({"Authorization": f"Bearer {api_key}"})
    
    def clear_auth(self):
        """Clear authentication headers"""
        self.auth_token = None
        self.api_key = None
        if "Authorization" in self.session.headers:
            del self.session.headers["Authorization"]
    
    def request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """Make an HTTP request"""
        url = f"{self.base_url}{endpoint}"
        kwargs.setdefault("timeout", TestConfig.REQUEST_TIMEOUT)
        return self.session.request(method, url, **kwargs)
    
    def get(self, endpoint: str, **kwargs) -> requests.Response:
        """Make a GET request"""
        return self.request("GET", endpoint, **kwargs)
    
    def post(self, endpoint: str, **kwargs) -> requests.Response:
        """Make a POST request"""
        return self.request("POST", endpoint, **kwargs)
    
    def put(self, endpoint: str, **kwargs) -> requests.Response:
        """Make a PUT request"""
        return self.request("PUT", endpoint, **kwargs)
    
    def patch(self, endpoint: str, **kwargs) -> requests.Response:
        """Make a PATCH request"""
        return self.request("PATCH", endpoint, **kwargs)
    
    def delete(self, endpoint: str, **kwargs) -> requests.Response:
        """Make a DELETE request"""
        return self.request("DELETE", endpoint, **kwargs)


def create_test_user(client: APIClient) -> Dict:
    """Create a test user and return user data with token"""
    user_data = {
        "username": f"testuser_{int(time.time())}",
        "email": f"test_{int(time.time())}@example.com",
        "password": "TestPassword123!",
        "confirm_password": "TestPassword123!"
    }
    
    # Register user
    response = client.post("/v1/auth/register", json=user_data)
    if response.status_code != 200:
        raise Exception(f"Failed to create test user: {response.text}")
    
    # Login to get token
    login_response = client.post("/v1/auth/login", json={
        "email": user_data["email"],
        "password": user_data["password"]
    })
    if login_response.status_code != 200:
        raise Exception(f"Failed to login test user: {login_response.text}")
    
    login_data = login_response.json()
    client.set_auth_token(login_data["access_token"])
    
    return {
        "user_data": user_data,
        "login_data": login_data,
        "token": login_data["access_token"]
    }


def create_test_api_key(client: APIClient) -> Dict:
    """Create a test API key and return key data"""
    api_key_data = {
        "name": f"test_key_{int(time.time())}",
        "description": "Test API key for integration tests"
    }
    
    response = client.post("/v1/api-keys", json=api_key_data)
    if response.status_code != 200:
        raise Exception(f"Failed to create test API key: {response.text}")
    
    return response.json()