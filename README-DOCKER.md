# Open Container Engine - Quick Start Guide

## 🚀 How to Run

### Step 1: Pull the Docker Image
```bash
docker pull decenter/open-container-engine:v1.0.0
```

### Step 2: Create Kubernetes Config File
Create a file named `k8sConfig.yaml` in your current directory:

```bash
# Create the config file
touch k8sConfig.yaml
```

Then edit `k8sConfig.yaml` with your Kubernetes cluster configuration:

```yaml
# Example k8sConfig.yaml content
apiVersion: v1
kind: Config
clusters:
- cluster:
    certificate-authority-data: LS0tLS1CRUdJTi... # Your cluster CA
    server: https://your-k8s-api-server:6443
  name: your-cluster
contexts:
- context:
    cluster: your-cluster
    user: your-user
  name: your-context
current-context: your-context
users:
- name: your-user
  user:
    token: eyJhbGciOiJSUzI1... # Your service account token
```

### Step 3: Run the Container
```bash
docker run -d \
  --name container-engine \
  -p 8080:3000 \
  -v $(pwd)/k8sConfig.yaml:/app/k8sConfig.yaml:ro \
  -e DATABASE_URL="postgresql://user:password@host:5432/database" \
  -e REDIS_URL="redis://host:6379" \
  -e JWT_SECRET="your-super-secret-jwt-key" \
  -e DOMAIN_SUFFIX="yourdomain.com" \
  -e KUBERNETES_NAMESPACE="default" \
  decenter/open-container-engine:v1.0.0
```

### Step 4: Access the Application
- Web Interface: http://localhost:8080
- Health Check: http://localhost:8080/health

## 📋 Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | Redis connection string | `redis://host:6379` |
| `JWT_SECRET` | JWT signing secret | `your-super-secret-jwt-key` |
| `DOMAIN_SUFFIX` | Domain for deployments | `yourdomain.com` |
| `KUBERNETES_NAMESPACE` | K8s namespace (optional) | `default` |

## 🔧 Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `KUBECONFIG_PATH` | Path to kubeconfig | `./k8sConfig.yaml` |
| `ENVIRONMENT` | Environment mode | `development` |

## 📁 File Structure
```
your-project/
├── k8sConfig.yaml          # Your Kubernetes config (required)
└── docker-compose.yml      # Optional: for development
```

## 🛠️ Development with Docker Compose

For local development with included database and Redis:

```bash
git clone <repository>
cd Open-Container-Engine
docker-compose up
```

This will start:
- PostgreSQL database
- Redis cache  
- Container Engine application

Access at: http://localhost:3000