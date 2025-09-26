use anyhow::Result;
use std::collections::HashMap;
use std::net::IpAddr;
use std::time::Duration;
use trust_dns_resolver::config::*;
use trust_dns_resolver::TokioAsyncResolver;
use tracing::{debug, info, warn};

use crate::AppError;

#[derive(Debug, Clone)]
pub struct DomainValidator {
    resolver: TokioAsyncResolver,
}

#[derive(Debug, Clone)]
pub struct ValidationResult {
    pub is_valid: bool,
    pub dns_records: Vec<DnsRecord>,
    pub error_message: Option<String>,
    pub validation_token: Option<String>,
}

#[derive(Debug, Clone)]
pub struct DnsRecord {
    pub record_type: String,
    pub name: String,
    pub value: String,
    pub ttl: u32,
}

#[derive(Debug, Clone)]
pub struct DomainValidationChallenge {
    pub domain: String,
    pub challenge_type: ChallengeType,
    pub token: String,
    pub expected_value: String,
}

#[derive(Debug, Clone)]
pub enum ChallengeType {
    Dns,
    Http,
}

impl DomainValidator {
    pub fn new() -> Result<Self, AppError> {
        let resolver = TokioAsyncResolver::tokio(
            ResolverConfig::default(),
            ResolverOpts::default(),
        );

        Ok(Self { resolver })
    }

    /// Validate domain ownership by checking DNS records
    pub async fn validate_domain_ownership(
        &self,
        domain: &str,
        expected_ip: &str,
    ) -> Result<ValidationResult, AppError> {
        info!("Validating domain ownership for: {}", domain);

        let mut dns_records = Vec::new();
        let mut is_valid = false;
        let mut error_message = None;

        // Check A record
        match self.check_a_record(domain).await {
            Ok(ips) => {
                for ip in ips {
                    dns_records.push(DnsRecord {
                        record_type: "A".to_string(),
                        name: domain.to_string(),
                        value: ip.to_string(),
                        ttl: 300,
                    });

                    if ip.to_string() == expected_ip {
                        is_valid = true;
                    }
                }
            }
            Err(e) => {
                error_message = Some(format!("Failed to resolve A record: {}", e));
            }
        }

        // Check CNAME record if no A record matches
        if !is_valid {
            match self.check_cname_record(domain).await {
                Ok(cnames) => {
                    for cname in cnames {
                        dns_records.push(DnsRecord {
                            record_type: "CNAME".to_string(),
                            name: domain.to_string(),
                            value: cname.clone(),
                            ttl: 300,
                        });

                        // Recursively check CNAME target
                        if let Ok(target_ips) = self.check_a_record(&cname).await {
                            for ip in target_ips {
                                if ip.to_string() == expected_ip {
                                    is_valid = true;
                                    break;
                                }
                            }
                        }
                    }
                }
                Err(e) => {
                    if error_message.is_none() {
                        error_message = Some(format!("Failed to resolve CNAME record: {}", e));
                    }
                }
            }
        }

        Ok(ValidationResult {
            is_valid,
            dns_records,
            error_message,
            validation_token: None,
        })
    }

    /// Check DNS TXT record for domain validation challenges
    /// NOTE: This is a mock implementation for development
    pub async fn validate_dns_challenge(
        &self,
        domain: &str,
        expected_token: &str,
    ) -> Result<bool, AppError> {
        info!("Validating DNS challenge for domain: {}", domain);

        // Mock implementation: Skip actual DNS validation for development
        // In production, this would check the actual TXT record
        let challenge_domain = format!("_acme-challenge.{}", domain);
        
        // Simulate DNS checking time
        tokio::time::sleep(Duration::from_millis(500)).await;
        
        info!("Mock DNS challenge validation successful for {} (token: {})", domain, expected_token);
        info!("In production, would check TXT record at: {}", challenge_domain);
        
        // Always return true for mock implementation
        // TODO: Replace with real DNS validation when integrating with DNS provider
        Ok(true)
    }

    /// Generate DNS records that need to be configured for a domain
    pub fn generate_required_dns_records(
        &self,
        domain: &str,
        ingress_ip: &str,
    ) -> Vec<DnsRecord> {
        vec![
            DnsRecord {
                record_type: "A".to_string(),
                name: domain.to_string(),
                value: ingress_ip.to_string(),
                ttl: 300,
            },
            DnsRecord {
                record_type: "AAAA".to_string(),
                name: domain.to_string(),
                value: "::1".to_string(), // Placeholder for IPv6
                ttl: 300,
            },
        ]
    }

    /// Generate DNS challenge record for domain validation
    pub fn generate_dns_challenge_record(
        &self,
        domain: &str,
        token: &str,
    ) -> DnsRecord {
        DnsRecord {
            record_type: "TXT".to_string(),
            name: format!("_acme-challenge.{}", domain),
            value: token.to_string(),
            ttl: 120, // Short TTL for quick propagation
        }
    }

    /// Check if domain is properly formatted and not a reserved domain
    pub fn validate_domain_format(&self, domain: &str) -> Result<(), AppError> {
        // Basic domain format validation
        if domain.is_empty() || domain.len() > 253 {
            return Err(AppError::bad_request("Invalid domain length"));
        }

        // Check for valid characters
        let valid_chars = domain
            .chars()
            .all(|c| c.is_alphanumeric() || c == '.' || c == '-');

        if !valid_chars {
            return Err(AppError::bad_request("Domain contains invalid characters"));
        }

        // Check for reserved domains
        let reserved_domains = ["localhost", "example.com", "test"];
        if reserved_domains.contains(&domain) {
            return Err(AppError::bad_request("Cannot use reserved domain"));
        }

        // Check for minimum number of labels (e.g., domain.com)
        let labels: Vec<&str> = domain.split('.').collect();
        if labels.len() < 2 {
            return Err(AppError::bad_request("Domain must have at least 2 labels"));
        }

        Ok(())
    }

    /// Wait for DNS propagation with retry mechanism
    pub async fn wait_for_dns_propagation(
        &self,
        domain: &str,
        expected_value: &str,
        max_retries: u32,
    ) -> Result<bool, AppError> {
        info!("Waiting for DNS propagation for domain: {}", domain);

        for attempt in 1..=max_retries {
            debug!("DNS propagation check attempt {} of {}", attempt, max_retries);

            match self.validate_dns_challenge(domain, expected_value).await {
                Ok(true) => {
                    info!("DNS propagation successful after {} attempts", attempt);
                    return Ok(true);
                }
                Ok(false) => {
                    debug!("DNS not yet propagated, waiting...");
                }
                Err(e) => {
                    warn!("DNS check error on attempt {}: {}", attempt, e);
                }
            }

            if attempt < max_retries {
                tokio::time::sleep(Duration::from_secs(30)).await;
            }
        }

        warn!("DNS propagation timeout after {} attempts", max_retries);
        Ok(false)
    }

    // Private helper methods
    async fn check_a_record(&self, domain: &str) -> Result<Vec<IpAddr>, AppError> {
        match self.resolver.lookup_ip(domain).await {
            Ok(lookup) => Ok(lookup.iter().collect()),
            Err(e) => Err(AppError::internal(&format!("A record lookup failed: {}", e))),
        }
    }

    async fn check_cname_record(&self, domain: &str) -> Result<Vec<String>, AppError> {
        use trust_dns_resolver::proto::rr::RecordType;

        match self
            .resolver
            .lookup(domain, RecordType::CNAME)
            .await
        {
            Ok(lookup) => {
                let cnames = lookup
                    .iter()
                    .filter_map(|record| {
                        if let Some(cname) = record.as_cname() {
                            Some(cname.to_string())
                        } else {
                            None
                        }
                    })
                    .collect();
                Ok(cnames)
            }
            Err(e) => Err(AppError::internal(&format!("CNAME record lookup failed: {}", e))),
        }
    }

    async fn check_txt_record(&self, domain: &str) -> Result<Vec<String>, AppError> {
        use trust_dns_resolver::proto::rr::RecordType;

        match self
            .resolver
            .lookup(domain, RecordType::TXT)
            .await
        {
            Ok(lookup) => {
                let txt_records = lookup
                    .iter()
                    .filter_map(|record| {
                        if let Some(txt) = record.as_txt() {
                            Some(
                                txt.iter()
                                    .map(|bytes| String::from_utf8_lossy(bytes).to_string())
                                    .collect::<Vec<_>>()
                                    .join(""),
                            )
                        } else {
                            None
                        }
                    })
                    .collect();
                Ok(txt_records)
            }
            Err(e) => Err(AppError::internal(&format!("TXT record lookup failed: {}", e))),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_domain_format_validation() {
        let validator = DomainValidator::new().unwrap();

        assert!(validator.validate_domain_format("example.com").is_ok());
        assert!(validator.validate_domain_format("sub.example.com").is_ok());
        assert!(validator.validate_domain_format("localhost").is_err());
        assert!(validator.validate_domain_format("").is_err());
        assert!(validator.validate_domain_format("invalid..domain").is_err());
    }

    #[test]
    fn test_dns_record_generation() {
        let validator = DomainValidator::new().unwrap();
        let records = validator.generate_required_dns_records("example.com", "1.2.3.4");

        assert_eq!(records.len(), 2);
        assert_eq!(records[0].record_type, "A");
        assert_eq!(records[0].name, "example.com");
        assert_eq!(records[0].value, "1.2.3.4");
    }
}