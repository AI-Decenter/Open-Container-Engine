-- Add SSL certificate management for domains
-- This migration extends the domain management system with SSL certificates and validation tracking

-- Add SSL certificate status and validation fields to domains table
ALTER TABLE domains 
ADD COLUMN ssl_status VARCHAR(50) NOT NULL DEFAULT 'pending',
ADD COLUMN ssl_issued_at TIMESTAMPTZ,
ADD COLUMN ssl_expires_at TIMESTAMPTZ,
ADD COLUMN dns_validation_token VARCHAR(255),
ADD COLUMN dns_validated_at TIMESTAMPTZ,
ADD COLUMN certificate_data TEXT,
ADD COLUMN private_key_data TEXT,
ADD COLUMN validation_attempts INTEGER NOT NULL DEFAULT 0,
ADD COLUMN last_validation_attempt TIMESTAMPTZ,
ADD COLUMN error_message TEXT;

-- Create SSL certificates table for detailed tracking
CREATE TABLE ssl_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    certificate_pem TEXT NOT NULL,
    private_key_pem TEXT NOT NULL,
    chain_pem TEXT,
    issued_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    issuer VARCHAR(255) NOT NULL DEFAULT 'Let''s Encrypt',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    auto_renew BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create DNS records table for tracking required DNS configurations
CREATE TABLE dns_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    record_type VARCHAR(10) NOT NULL, -- A, AAAA, CNAME, TXT
    record_name VARCHAR(253) NOT NULL,
    record_value VARCHAR(1000) NOT NULL,
    ttl INTEGER NOT NULL DEFAULT 300,
    is_validation_record BOOLEAN NOT NULL DEFAULT false,
    is_configured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create domain validation history table
CREATE TABLE domain_validations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    validation_type VARCHAR(50) NOT NULL, -- dns, http
    validation_token VARCHAR(255) NOT NULL,
    challenge_response VARCHAR(1000),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_message TEXT
);

-- Add indexes for performance
CREATE INDEX idx_ssl_certificates_domain_id ON ssl_certificates(domain_id);
CREATE INDEX idx_ssl_certificates_expires_at ON ssl_certificates(expires_at);
CREATE INDEX idx_ssl_certificates_status ON ssl_certificates(status);
CREATE INDEX idx_dns_records_domain_id ON dns_records(domain_id);
CREATE INDEX idx_dns_records_type ON dns_records(record_type);
CREATE INDEX idx_dns_records_validation ON dns_records(is_validation_record);
CREATE INDEX idx_domain_validations_domain_id ON domain_validations(domain_id);
CREATE INDEX idx_domain_validations_status ON domain_validations(status);
CREATE INDEX idx_domains_ssl_status ON domains(ssl_status);
CREATE INDEX idx_domains_verified_at ON domains(verified_at);

-- Add triggers for updated_at columns
CREATE TRIGGER update_ssl_certificates_updated_at BEFORE UPDATE ON ssl_certificates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dns_records_updated_at BEFORE UPDATE ON dns_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add constraints and validation
ALTER TABLE domains 
ADD CONSTRAINT check_ssl_status 
CHECK (ssl_status IN ('pending', 'validating', 'issued', 'expired', 'failed', 'revoked'));

ALTER TABLE ssl_certificates 
ADD CONSTRAINT check_certificate_status 
CHECK (status IN ('active', 'expired', 'revoked', 'pending_renewal'));

ALTER TABLE dns_records 
ADD CONSTRAINT check_record_type 
CHECK (record_type IN ('A', 'AAAA', 'CNAME', 'TXT', 'MX'));

ALTER TABLE domain_validations 
ADD CONSTRAINT check_validation_type 
CHECK (validation_type IN ('dns', 'http'));

ALTER TABLE domain_validations 
ADD CONSTRAINT check_validation_status 
CHECK (status IN ('pending', 'processing', 'valid', 'invalid', 'expired'));