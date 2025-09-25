use crate::email::service::EmailService;

impl EmailService {
    pub fn welcome_email_template(&self, username: &str) -> String {
        format!(
            r#"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to Container Engine</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
                    <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #3b82f6;">
                        <h1 style="color: #3b82f6; margin: 0;">Container Engine</h1>
                    </div>
                    
                    <div style="padding: 30px 0;">
                        <h2 style="color: #333; margin-bottom: 20px;">Welcome, {}!</h2>
                        
                        <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                            Thank you for joining Container Engine! Your account has been created successfully.
                        </p>
                        
                        <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                            You can now start deploying your applications with ease. Here's what you can do:
                        </p>
                        
                        <ul style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                            <li>Deploy Docker containers</li>
                            <li>Scale your applications</li>
                            <li>Monitor deployment status</li>
                            <li>Manage environment variables</li>
                        </ul>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="http://localhost:5173/deployments" 
                               style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                Get Started
                            </a>
                        </div>
                    </div>
                    
                    <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
                        <p>Container Engine Team</p>
                    </div>
                </div>
            </body>
            </html>
            "#,
            username
        )
    }

    pub fn password_reset_email_template(&self, username: &str, _reset_token: &str, reset_url: &str) -> String {
        format!(
            r#"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Password Reset</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
                    <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #3b82f6;">
                        <h1 style="color: #3b82f6; margin: 0;">Container Engine</h1>
                    </div>
                    
                    <div style="padding: 30px 0;">
                        <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
                        
                        <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                            Hi {},
                        </p>
                        
                        <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                            You requested a password reset for your Container Engine account. Click the button below to reset your password:
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{}" 
                               style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                Reset Password
                            </a>
                        </div>
                        
                        <p style="color: #999; font-size: 14px; line-height: 1.6;">
                            If you didn't request this password reset, please ignore this email. This link will expire in 1 hour.
                        </p>
                        
                        <p style="color: #999; font-size: 12px; word-break: break-all;">
                            Or copy and paste this URL: {}
                        </p>
                    </div>
                    
                    <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
                        <p>Container Engine Team</p>
                    </div>
                </div>
            </body>
            </html>
            "#,
            username, reset_url, reset_url
        )
    }

    pub fn deployment_notification_template(&self, username: &str, app_name: &str, status: &str, deployment_url: Option<&str>) -> String {
        let status_color = match status {
            "running" => "#10b981",
            "failed" => "#ef4444",
            "stopped" => "#f59e0b",
            _ => "#6b7280",
        };

        let status_message = match status {
            "running" => "is now running successfully!",
            "failed" => "has failed. Please check the logs.",
            "stopped" => "has been stopped.",
            "pending" => "is being deployed...",
            _ => &format!("status has changed to {}", status),
        };

        format!(
            r#"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Deployment Update</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
                    <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #3b82f6;">
                        <h1 style="color: #3b82f6; margin: 0;">Container Engine</h1>
                    </div>
                    
                    <div style="padding: 30px 0;">
                        <h2 style="color: #333; margin-bottom: 20px;">Deployment Update</h2>
                        
                        <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                            Hi {},
                        </p>
                        
                        <div style="background-color: #f8fafc; border-left: 4px solid {}; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0; color: #333;">
                                Your deployment <strong>{}</strong> {}
                            </p>
                        </div>
                        
                        {}
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="http://localhost:5173/deployments" 
                               style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                View Deployments
                            </a>
                        </div>
                    </div>
                    
                    <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
                        <p>Container Engine Team</p>
                    </div>
                </div>
            </body>
            </html>
            "#,
            username,
            status_color,
            app_name,
            status_message,
            deployment_url.map_or(String::new(), |url| format!(
                r#"<p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                    <strong>Deployment URL:</strong> <a href="{}" style="color: #3b82f6;">{}</a>
                </p>"#,
                url, url
            ))
        )
    }
}