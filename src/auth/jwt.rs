use chrono::{DateTime, Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::error::AppError;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, // Subject (user ID)
    pub exp: usize,  // Expiration time
    pub iat: usize,  // Issued at
    pub token_type: TokenType,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum TokenType {
    Access,
    Refresh,
}

pub struct JwtManager {
    encoding_key: EncodingKey,
    decoding_key: DecodingKey,
    expires_in: i64,
}

impl JwtManager {
    pub fn new(secret: &str, expires_in: i64) -> Self {
        Self {
            encoding_key: EncodingKey::from_secret(secret.as_bytes()),
            decoding_key: DecodingKey::from_secret(secret.as_bytes()),
            expires_in,
        }
    }

    pub fn generate_access_token(&self, user_id: Uuid) -> Result<(String, DateTime<Utc>), AppError> {
        let now = Utc::now();
        let expires_at = now + Duration::seconds(self.expires_in);
        
        let claims = Claims {
            sub: user_id.to_string(),
            exp: expires_at.timestamp() as usize,
            iat: now.timestamp() as usize,
            token_type: TokenType::Access,
        };

        let token = encode(&Header::default(), &claims, &self.encoding_key)?;
        Ok((token, expires_at))
    }

    pub fn generate_refresh_token(&self, user_id: Uuid) -> Result<String, AppError> {
        let now = Utc::now();
        let expires_at = now + Duration::days(30); // Refresh tokens last 30 days
        
        let claims = Claims {
            sub: user_id.to_string(),
            exp: expires_at.timestamp() as usize,
            iat: now.timestamp() as usize,
            token_type: TokenType::Refresh,
        };

        let token = encode(&Header::default(), &claims, &self.encoding_key)?;
        Ok(token)
    }

    pub fn verify_token(&self, token: &str) -> Result<Claims, AppError> {
        let token_data = decode::<Claims>(token, &self.decoding_key, &Validation::default())?;
        Ok(token_data.claims)
    }

    pub fn extract_user_id(&self, token: &str) -> Result<Uuid, AppError> {
        let claims = self.verify_token(token)?;
        let user_id = Uuid::parse_str(&claims.sub)
            .map_err(|_| AppError::auth("Invalid user ID in token"))?;
        Ok(user_id)
    }
}