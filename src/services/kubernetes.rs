use k8s_openapi::api::apps::v1::{Deployment as K8sDeployment, DeploymentSpec};
use k8s_openapi::api::core::v1::{
    Service, ServiceSpec, ServicePort, Container, ContainerPort,
    EnvVar, ResourceRequirements as K8sResourceRequirements, Probe, HTTPGetAction,
};
use kube::{Client, Api, api::PostParams};
use std::collections::BTreeMap;
use uuid::Uuid;
use serde_json::Value;
use tracing::{info, warn};

use crate::jobs::deployment_job::DeploymentJob;
use crate::AppError;

#[derive(Clone)]
pub struct KubernetesService {
    client: Client,
    namespace: String,
}

impl KubernetesService {
    pub async fn new(namespace: Option<String>) -> Result<Self, AppError> {
        let client = Client::try_default().await
            .map_err(|e| AppError::internal(&format!("Failed to create k8s client: {}", e)))?;
        
        let namespace = namespace.unwrap_or_else(|| "default".to_string());
        
        info!("Initialized Kubernetes service for namespace: {}", namespace);
        Ok(Self { client, namespace })
    }

    pub async fn deploy_application(&self, job: &DeploymentJob) -> Result<(), AppError> {
        info!("Deploying application: {} to Kubernetes", job.app_name);
        
        // Create deployment first
        self.create_deployment(job).await?;
        
        // Create service
        self.create_service(job).await?;
        
        info!("Successfully created Kubernetes resources for: {}", job.app_name);
        Ok(())
    }

    async fn create_deployment(&self, job: &DeploymentJob) -> Result<K8sDeployment, AppError> {
        let deployment_name = self.generate_deployment_name(&job.deployment_id);
        let labels = self.generate_labels(job);

        // Environment variables
        let env_vars: Vec<EnvVar> = job.env_vars
            .iter()
            .map(|(k, v)| EnvVar {
                name: k.clone(),
                value: Some(v.clone()),
                ..Default::default()
            })
            .collect();

        // Resource requirements
        let resources = self.parse_resource_requirements(&job.resources);

        // Health checks
        let (readiness_probe, liveness_probe) = self.parse_health_probes(&job.health_check, job.port);

        let container = Container {
            name: "app".to_string(),
            image: Some(job.github_image_tag.clone()),
            ports: Some(vec![ContainerPort {
                container_port: job.port,
                name: Some("http".to_string()),
                protocol: Some("TCP".to_string()),
                ..Default::default()
            }]),
            env: if env_vars.is_empty() { None } else { Some(env_vars) },
            resources,
            readiness_probe,
            liveness_probe,
            image_pull_policy: Some("Always".to_string()),
            ..Default::default()
        };

        let deployment = K8sDeployment {
            metadata: k8s_openapi::apimachinery::pkg::apis::meta::v1::ObjectMeta {
                name: Some(deployment_name.clone()),
                namespace: Some(self.namespace.clone()),
                labels: Some(labels.clone()),
                ..Default::default()
            },
            spec: Some(DeploymentSpec {
                replicas: Some(job.replicas),
                selector: k8s_openapi::apimachinery::pkg::apis::meta::v1::LabelSelector {
                    match_labels: Some(labels.clone()),
                    ..Default::default()
                },
                template: k8s_openapi::api::core::v1::PodTemplateSpec {
                    metadata: Some(k8s_openapi::apimachinery::pkg::apis::meta::v1::ObjectMeta {
                        labels: Some(labels),
                        ..Default::default()
                    }),
                    spec: Some(k8s_openapi::api::core::v1::PodSpec {
                        containers: vec![container],
                        restart_policy: Some("Always".to_string()),
                        ..Default::default()
                    }),
                },
                ..Default::default()
            }),
            ..Default::default()
        };

        let deployments: Api<K8sDeployment> = Api::namespaced(self.client.clone(), &self.namespace);
        
        let result = deployments.create(&PostParams::default(), &deployment).await
            .map_err(|e| AppError::internal(&format!("Failed to create k8s deployment: {}", e)))?;
        
        info!("Created k8s deployment: {}", deployment_name);
        Ok(result)
    }

    async fn create_service(&self, job: &DeploymentJob) -> Result<Service, AppError> {
        let service_name = self.generate_service_name(&job.deployment_id);
        let selector_labels = BTreeMap::from([
            ("app".to_string(), job.app_name.clone()),
            ("deployment-id".to_string(), job.deployment_id.to_string()),
        ]);

        let service = Service {
            metadata: k8s_openapi::apimachinery::pkg::apis::meta::v1::ObjectMeta {
                name: Some(service_name.clone()),
                namespace: Some(self.namespace.clone()),
                ..Default::default()
            },
            spec: Some(ServiceSpec {
                selector: Some(selector_labels),
                ports: Some(vec![ServicePort {
                    port: 80,
                    target_port: Some(k8s_openapi::apimachinery::pkg::util::intstr::IntOrString::Int(job.port)),
                    name: Some("http".to_string()),
                    protocol: Some("TCP".to_string()),
                    ..Default::default()
                }]),
                type_: Some("LoadBalancer".to_string()),
                ..Default::default()
            }),
            ..Default::default()
        };

        let services: Api<Service> = Api::namespaced(self.client.clone(), &self.namespace);
        
        let result = services.create(&PostParams::default(), &service).await
            .map_err(|e| AppError::internal(&format!("Failed to create k8s service: {}", e)))?;
        
        info!("Created k8s service: {}", service_name);
        Ok(result)
    }

    pub async fn get_service_external_ip(&self, deployment_id: &Uuid) -> Result<Option<String>, AppError> {
        let service_name = self.generate_service_name(deployment_id);
        let services: Api<Service> = Api::namespaced(self.client.clone(), &self.namespace);
        
        match services.get(&service_name).await {
            Ok(service) => {
                if let Some(status) = service.status {
                    if let Some(load_balancer) = status.load_balancer {
                        if let Some(ingress_list) = load_balancer.ingress {
                            if let Some(ingress) = ingress_list.first() {
                                return Ok(ingress.ip.clone());
                            }
                        }
                    }
                }
                Ok(None)
            }
            Err(e) => {
                warn!("Failed to get service {}: {}", service_name, e);
                Ok(None)
            }
        }
    }

    pub async fn get_deployment_status(&self, deployment_id: &Uuid) -> Result<String, AppError> {
        let deployment_name = self.generate_deployment_name(deployment_id);
        let deployments: Api<K8sDeployment> = Api::namespaced(self.client.clone(), &self.namespace);
        
        match deployments.get(&deployment_name).await {
            Ok(deployment) => {
                if let Some(status) = deployment.status {
                    let ready_replicas = status.ready_replicas.unwrap_or(0);
                    let replicas = status.replicas.unwrap_or(0);
                    
                    if ready_replicas == replicas && replicas > 0 {
                        Ok("running".to_string())
                    } else {
                        Ok("deploying".to_string())
                    }
                } else {
                    Ok("deploying".to_string())
                }
            }
            Err(_) => Ok("failed".to_string()),
        }
    }

    pub async fn delete_deployment(&self, deployment_id: &Uuid) -> Result<(), AppError> {
        let deployment_name = self.generate_deployment_name(deployment_id);
        let service_name = self.generate_service_name(deployment_id);
        
        let deployments: Api<K8sDeployment> = Api::namespaced(self.client.clone(), &self.namespace);
        let services: Api<Service> = Api::namespaced(self.client.clone(), &self.namespace);
        
        // Delete deployment
        if let Err(e) = deployments.delete(&deployment_name, &kube::api::DeleteParams::default()).await {
            warn!("Failed to delete deployment {}: {}", deployment_name, e);
        } else {
            info!("Deleted k8s deployment: {}", deployment_name);
        }
        
        // Delete service
        if let Err(e) = services.delete(&service_name, &kube::api::DeleteParams::default()).await {
            warn!("Failed to delete service {}: {}", service_name, e);
        } else {
            info!("Deleted k8s service: {}", service_name);
        }
        
        Ok(())
    }

    // Helper methods
    fn generate_deployment_name(&self, deployment_id: &Uuid) -> String {
        format!("app-{}", deployment_id.to_string().replace("-", "").chars().take(8).collect::<String>())
    }

    fn generate_service_name(&self, deployment_id: &Uuid) -> String {
        format!("svc-{}", deployment_id.to_string().replace("-", "").chars().take(8).collect::<String>())
    }

    fn generate_labels(&self, job: &DeploymentJob) -> BTreeMap<String, String> {
        BTreeMap::from([
            ("app".to_string(), job.app_name.clone()),
            ("deployment-id".to_string(), job.deployment_id.to_string()),
            ("managed-by".to_string(), "deployment-service".to_string()),
        ])
    }

    fn parse_resource_requirements(&self, resources: &Option<Value>) -> Option<K8sResourceRequirements> {
        if let Some(res) = resources {
            let mut limits = BTreeMap::new();
            let mut requests = BTreeMap::new();

            // Parse limits
            if let Some(cpu_limit) = res.get("cpu_limit").and_then(|v| v.as_str()) {
                limits.insert("cpu".to_string(), 
                    k8s_openapi::apimachinery::pkg::api::resource::Quantity(cpu_limit.to_string()));
            }
            if let Some(memory_limit) = res.get("memory_limit").and_then(|v| v.as_str()) {
                limits.insert("memory".to_string(), 
                    k8s_openapi::apimachinery::pkg::api::resource::Quantity(memory_limit.to_string()));
            }

            // Parse requests
            if let Some(cpu_request) = res.get("cpu_request").and_then(|v| v.as_str()) {
                requests.insert("cpu".to_string(), 
                    k8s_openapi::apimachinery::pkg::api::resource::Quantity(cpu_request.to_string()));
            }
            if let Some(memory_request) = res.get("memory_request").and_then(|v| v.as_str()) {
                requests.insert("memory".to_string(), 
                    k8s_openapi::apimachinery::pkg::api::resource::Quantity(memory_request.to_string()));
            }

            Some(K8sResourceRequirements {
                claims: None,
                limits: if limits.is_empty() { None } else { Some(limits) },
                requests: if requests.is_empty() { None } else { Some(requests) },
            })
        } else {
            None
        }
    }

    fn parse_health_probes(&self, health_check: &Option<Value>, default_port: i32) -> (Option<Probe>, Option<Probe>) {
        if let Some(hc) = health_check {
            if let Some(path) = hc.get("path").and_then(|v| v.as_str()) {
                let port = hc.get("port").and_then(|v| v.as_i64()).unwrap_or(default_port as i64) as i32;
                let initial_delay = hc.get("initial_delay").and_then(|v| v.as_i64()).unwrap_or(30) as i32;
                let period = hc.get("period").and_then(|v| v.as_i64()).unwrap_or(10) as i32;
                let timeout = hc.get("timeout").and_then(|v| v.as_i64()).unwrap_or(5) as i32;

                let probe = Probe {
                    http_get: Some(HTTPGetAction {
                        path: Some(path.to_string()),
                        port: k8s_openapi::apimachinery::pkg::util::intstr::IntOrString::Int(port),
                        scheme: Some("HTTP".to_string()),
                        ..Default::default()
                    }),
                    initial_delay_seconds: Some(initial_delay),
                    period_seconds: Some(period),
                    timeout_seconds: Some(timeout),
                    failure_threshold: Some(3),
                    success_threshold: Some(1),
                    ..Default::default()
                };
                
                return (Some(probe.clone()), Some(probe));
            }
        }
        
        (None, None)
    }
}