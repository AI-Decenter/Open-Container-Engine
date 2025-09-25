-- Create user_webhooks table
CREATE TABLE user_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    secret VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    events TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, name)
);

-- Create indexes
CREATE INDEX idx_user_webhooks_user_id ON user_webhooks(user_id);
CREATE INDEX idx_user_webhooks_active ON user_webhooks(is_active);

-- Add trigger for updated_at
CREATE TRIGGER update_user_webhooks_updated_at BEFORE UPDATE ON user_webhooks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
