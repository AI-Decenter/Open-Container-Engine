use anyhow::Result;
use base64::{engine::general_purpose, Engine as _};
use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use tokio::fs;
use tracing::info;
use uuid::Uuid;

use crate::services::domain_validator::{DomainValidator, DnsRecord};
use crate::AppError;

#[derive(Clone)]
pub struct SslCertificateManager {
    domain_validator: DomainValidator,
    storage_path: String,
    use_staging: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CertificateInfo {
    pub id: Uuid,
    pub domain: String,
    pub certificate_pem: String,
    pub private_key_pem: String,
    pub chain_pem: Option<String>,
    pub issued_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
    pub issuer: String,
    pub status: CertificateStatus,
    pub auto_renew: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CertificateStatus {
    Pending,
    Validating,
    Issued,
    Expired,
    Failed,
    Revoked,
}

#[derive(Debug, Clone)]
pub struct CertificateRequest {
    pub domain: String,
    pub email: String,
    pub challenge_type: ChallengeType,
}

#[derive(Debug, Clone)]
pub enum ChallengeType {
    Dns,
    Http,
}

#[derive(Debug, Clone)]
pub struct ValidationChallenge {
    pub domain: String,
    pub token: String,
    pub key_authorization: String,
    pub dns_record: Option<DnsRecord>,
    pub expires_at: DateTime<Utc>,
}

impl SslCertificateManager {
    pub async fn new(
        storage_path: String,
        use_staging: bool,
    ) -> Result<Self, AppError> {
        // Create storage directory
        fs::create_dir_all(&storage_path)
            .await
            .map_err(|e| AppError::internal(&format!("Failed to create storage directory: {}", e)))?;

        let domain_validator = DomainValidator::new()?;

        Ok(Self {
            domain_validator,
            storage_path,
            use_staging,
        })
    }

    /// Request a new SSL certificate for a domain (Mock implementation)
    pub async fn request_certificate(
        &self,
        request: CertificateRequest,
    ) -> Result<ValidationChallenge, AppError> {
        info!("Requesting SSL certificate for domain: {} (MOCK)", request.domain);

        // Validate domain format
        self.domain_validator
            .validate_domain_format(&request.domain)?;

        // Generate mock DNS challenge token
        let token = format!("mock-token-{}", Uuid::new_v4());
        let key_authorization = format!("mock-key-auth-{}", Uuid::new_v4());

        // Generate DNS record for DNS challenge
        let dns_record = match request.challenge_type {
            ChallengeType::Dns => {
                let dns_challenge_value = self.calculate_dns_challenge_value(&key_authorization)?;
                Some(DnsRecord {
                    record_type: "TXT".to_string(),
                    name: format!("_acme-challenge.{}", request.domain),
                    value: dns_challenge_value,
                    ttl: 120,
                })
            }
            ChallengeType::Http => None,
        };

        Ok(ValidationChallenge {
            domain: request.domain.clone(),
            token,
            key_authorization,
            dns_record,
            expires_at: Utc::now() + Duration::hours(24),
        })
    }

    /// Complete the certificate validation and issuance (Mock implementation)
    pub async fn complete_certificate_validation(
        &self,
        domain: &str,
        _email: &str,
    ) -> Result<CertificateInfo, AppError> {
        info!("Completing certificate validation for domain: {} (MOCK)", domain);

        // Generate mock certificate and private key
        let cert_pem = self.generate_mock_certificate(domain).await?;
        let private_key_pem = self.generate_mock_private_key().await?;

        // Set certificate dates
        let issued_at = Utc::now();
        let expires_at = issued_at + Duration::days(90); // Mock 90-day certificate

        let certificate_info = CertificateInfo {
            id: Uuid::new_v4(),
            domain: domain.to_string(),
            certificate_pem: cert_pem,
            private_key_pem: private_key_pem,
            chain_pem: None,
            issued_at,
            expires_at,
            issuer: if self.use_staging { "Let's Encrypt Staging" } else { "Let's Encrypt" }.to_string(),
            status: CertificateStatus::Issued,
            auto_renew: true,
        };

        info!("Successfully issued mock certificate for domain: {}", domain);
        Ok(certificate_info)
    }

    /// Check if certificate needs renewal (within 30 days of expiration)
    pub fn needs_renewal(&self, certificate: &CertificateInfo) -> bool {
        let renewal_threshold = Utc::now() + Duration::days(30);
        certificate.expires_at < renewal_threshold
    }

    /// Renew an existing certificate
    pub async fn renew_certificate(
        &self,
        certificate: &CertificateInfo,
        email: &str,
    ) -> Result<CertificateInfo, AppError> {
        info!("Renewing certificate for domain: {}", certificate.domain);

        // For renewal, we essentially request a new certificate
        let request = CertificateRequest {
            domain: certificate.domain.clone(),
            email: email.to_string(),
            challenge_type: ChallengeType::Dns,
        };

        // Generate new validation challenge
        let _challenge = self.request_certificate(request).await?;

        // Wait for DNS propagation (this would be handled by the calling code)
        tokio::time::sleep(std::time::Duration::from_secs(60)).await;

        // Complete validation and get new certificate
        self.complete_certificate_validation(&certificate.domain, email)
            .await
    }

    /// Revoke a certificate (Mock implementation)
    pub async fn revoke_certificate(
        &self,
        certificate: &CertificateInfo,
        _email: &str,
    ) -> Result<(), AppError> {
        info!("Revoking certificate for domain: {} (MOCK)", certificate.domain);
        // In a real implementation, this would revoke the certificate via ACME
        info!("Successfully revoked certificate for domain: {}", certificate.domain);
        Ok(())
    }

    /// Get certificate status from Let's Encrypt
    pub async fn check_certificate_status(
        &self,
        certificate: &CertificateInfo,
    ) -> Result<CertificateStatus, AppError> {
        // Check if certificate is expired
        if certificate.expires_at < Utc::now() {
            return Ok(CertificateStatus::Expired);
        }

        // For more detailed status checking, you could implement OCSP checking here
        Ok(certificate.status.clone())
    }

    /// List all managed certificates
    pub async fn list_certificates(&self) -> Result<Vec<CertificateInfo>, AppError> {
        // In a real implementation, this would read from storage/database
        // For now, return empty list
        Ok(vec![])
    }

    // Private helper methods
    fn calculate_dns_challenge_value(&self, key_authorization: &str) -> Result<String, AppError> {
        use sha2::{Digest, Sha256};

        let mut hasher = Sha256::new();
        hasher.update(key_authorization);
        let hash = hasher.finalize();

        Ok(general_purpose::URL_SAFE_NO_PAD.encode(hash))
    }

    fn parse_certificate_dates(
        &self,
        _cert_pem: &str,
    ) -> Result<(DateTime<Utc>, DateTime<Utc>), AppError> {
        // For mock implementation, we'll set default dates
        // In a real implementation, you'd parse the X.509 certificate
        let now = Utc::now();
        let issued_at = now;
        let expires_at = now + Duration::days(90); // Let's Encrypt default

        Ok((issued_at, expires_at))
    }

    /// Generate a mock certificate for testing/development
    async fn generate_mock_certificate(&self, domain: &str) -> Result<String, AppError> {
        // This is a mock self-signed certificate
        let cert_pem = format!(r#"-----BEGIN CERTIFICATE-----
MIICljCCAX4CCQDKKKKKKKKKKjANBgkqhkiG9w0BAQsFADASMRAwDgYDVQQDDAdl
eGFtcGxlMB4XDTIzMDEwMTAwMDAwMFoXDTI0MDEwMTAwMDAwMFowEjEQMA4GA1UE
Awwn{}0IIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1234567890...
(Mock certificate data for {})
-----END CERTIFICATE-----"#, domain, domain);
        Ok(cert_pem)
    }

    /// Generate a mock private key for testing/development  
    async fn generate_mock_private_key(&self) -> Result<String, AppError> {
        // This is a mock private key
        let key_pem = r#"-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDXNNNNNNNNNNN
(Mock private key data)
-----END PRIVATE KEY-----"#;
        Ok(key_pem.to_string())
    }

    /// Store certificate securely (this would integrate with your secure storage)
    async fn store_certificate(&self, certificate: &CertificateInfo) -> Result<(), AppError> {
        let cert_path = format!("{}/{}.pem", self.storage_path, certificate.id);
        let key_path = format!("{}/{}.key", self.storage_path, certificate.id);

        fs::write(&cert_path, &certificate.certificate_pem)
            .await
            .map_err(|e| AppError::internal(&format!("Failed to write certificate: {}", e)))?;

        fs::write(&key_path, &certificate.private_key_pem)
            .await
            .map_err(|e| AppError::internal(&format!("Failed to write private key: {}", e)))?;

        info!("Stored certificate for domain: {}", certificate.domain);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_needs_renewal() {
        let certificate = CertificateInfo {
            id: Uuid::new_v4(),
            domain: "example.com".to_string(),
            certificate_pem: String::new(),
            private_key_pem: String::new(),
            chain_pem: None,
            issued_at: Utc::now(),
            expires_at: Utc::now() + Duration::days(10), // Expires in 10 days
            issuer: "Let's Encrypt".to_string(),
            status: CertificateStatus::Issued,
            auto_renew: true,
        };

        let manager = SslCertificateManager {
            domain_validator: DomainValidator::new().unwrap(),
            storage_path: "/tmp/test".to_string(),
            use_staging: true,
        };

        assert!(manager.needs_renewal(&certificate));
    }
}