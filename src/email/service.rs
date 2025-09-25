use lettre::{
    message::{header::ContentType, Mailbox},
    transport::smtp::{authentication::Credentials, PoolConfig},
    SmtpTransport, Transport, Message,
};
use std::time::Duration;

use crate::error::AppError;

#[derive(Clone)]
pub struct EmailService {
    mailer: SmtpTransport,
    from_email: String,
    from_name: String,
}

impl EmailService {
    pub fn new(
        smtp_host: &str,
        smtp_port: u16,
        username: &str,
        password: &str,
        from_email: &str,
        from_name: &str,
    ) -> Result<Self, AppError> {
        let creds = Credentials::new(username.to_string(), password.to_string());

        let mailer = if smtp_port == 465 {
            // Use TLS wrapper for port 465
            SmtpTransport::relay(smtp_host)
                .map_err(|e| AppError::internal(&format!("Failed to create SMTP transport: {}", e)))?
                .port(smtp_port)
                .credentials(creds)
                .pool_config(PoolConfig::new().max_size(20))
                .timeout(Some(Duration::from_secs(30)))
                .tls(lettre::transport::smtp::client::Tls::Wrapper(
                    lettre::transport::smtp::client::TlsParameters::builder(smtp_host.to_string())
                        .build()
                        .map_err(|e| AppError::internal(&format!("Failed to create TLS parameters: {}", e)))?
                ))
                .build()
        } else if smtp_host.contains("sandbox.smtp.mailtrap.io") {
            // Mailtrap Sandbox SMTP - no TLS, plain connection
            SmtpTransport::builder_dangerous(smtp_host)
                .port(smtp_port)
                .credentials(creds)
                .pool_config(PoolConfig::new().max_size(20))
                .timeout(Some(Duration::from_secs(30)))
                .build()
        } else if smtp_host.contains("live.smtp.mailtrap.io") {
            // Special configuration for Mailtrap Live SMTP - use STARTTLS with default auth
            SmtpTransport::starttls_relay(smtp_host)
                .map_err(|e| AppError::internal(&format!("Failed to create SMTP transport: {}", e)))?
                .port(smtp_port)
                .credentials(creds)
                .pool_config(PoolConfig::new().max_size(20))
                .timeout(Some(Duration::from_secs(30)))
                .build()
        } else {
            // Use STARTTLS for other ports (587)
            SmtpTransport::relay(smtp_host)
                .map_err(|e| AppError::internal(&format!("Failed to create SMTP transport: {}", e)))?
                .port(smtp_port)
                .credentials(creds)
                .pool_config(PoolConfig::new().max_size(20))
                .timeout(Some(Duration::from_secs(30)))
                .build()
        };

        Ok(Self {
            mailer,
            from_email: from_email.to_string(),
            from_name: from_name.to_string(),
        })
    }

    pub fn send_email(
        &self,
        to_email: &str,
        to_name: Option<&str>,
        subject: &str,
        html_body: &str,
        text_body: Option<&str>,
    ) -> Result<(), AppError> {
        let from = format!("{} <{}>", self.from_name, self.from_email)
            .parse::<Mailbox>()
            .map_err(|e| AppError::internal(&format!("Invalid from email: {}", e)))?;

        let to = if let Some(name) = to_name {
            format!("{} <{}>", name, to_email)
        } else {
            to_email.to_string()
        }
        .parse::<Mailbox>()
        .map_err(|e| AppError::internal(&format!("Invalid to email: {}", e)))?;

        // If text body is provided, create multipart
        let email = if let Some(text) = text_body {
            Message::builder()
                .from(from)
                .to(to)
                .subject(subject)
                .multipart(
                    lettre::message::MultiPart::alternative()
                        .singlepart(
                            lettre::message::SinglePart::builder()
                                .header(ContentType::TEXT_PLAIN)
                                .body(text.to_string()),
                        )
                        .singlepart(
                            lettre::message::SinglePart::builder()
                                .header(ContentType::TEXT_HTML)
                                .body(html_body.to_string()),
                        ),
                )
                .map_err(|e| AppError::internal(&format!("Failed to build multipart email: {}", e)))?
        } else {
            Message::builder()
                .from(from)
                .to(to)
                .subject(subject)
                .header(ContentType::TEXT_HTML)
                .body(html_body.to_string())
                .map_err(|e| AppError::internal(&format!("Failed to build email: {}", e)))?
        };

        // Send the email
        self.mailer.send(&email)
            .map_err(|e| AppError::internal(&format!("Failed to send email: {}", e)))?;

        Ok(())
    }

    // Convenience methods for common email types
    pub fn send_welcome_email(
        &self,
        to_email: &str,
        username: &str,
    ) -> Result<(), AppError> {
        let subject = "Welcome to Container Engine";
        let html_body = self.welcome_email_template(username);
        let text_body = format!("Welcome to Container Engine, {}! Your account has been created successfully.", username);

        self.send_email(to_email, Some(username), &subject, &html_body, Some(&text_body))
    }

    pub fn send_password_reset_email(
        &self,
        to_email: &str,
        username: &str,
        reset_token: &str,
        reset_url: &str,
    ) -> Result<(), AppError> {
        let subject = "Password Reset Request";
        let html_body = self.password_reset_email_template(username, reset_token, reset_url);
        let text_body = format!(
            "Hi {},\n\nYou requested a password reset. Click the link below to reset your password:\n{}\n\nIf you didn't request this, please ignore this email.",
            username, reset_url
        );

        self.send_email(to_email, Some(username), &subject, &html_body, Some(&text_body))
    }

    pub fn send_deployment_notification(
        &self,
        to_email: &str,
        username: &str,
        app_name: &str,
        status: &str,
        deployment_url: Option<&str>,
    ) -> Result<(), AppError> {
        let subject = format!("Deployment Update: {} - {}", app_name, status);
        let html_body = self.deployment_notification_template(username, app_name, status, deployment_url);
        let text_body = format!(
            "Hi {},\n\nYour deployment '{}' status has changed to: {}\n{}",
            username,
            app_name,
            status,
            deployment_url.map_or(String::new(), |url| format!("URL: {}", url))
        );

        self.send_email(to_email, Some(username), &subject, &html_body, Some(&text_body))
    }


}