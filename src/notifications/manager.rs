// src/notifications/manager.rs
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{broadcast, RwLock};
use uuid::Uuid;
use tracing::{debug, error, info};

use super::models::{Notification, NotificationType, WebSocketMessage};

type UserConnections = HashMap<Uuid, broadcast::Sender<WebSocketMessage>>;

#[derive(Clone)]
pub struct NotificationManager {
    connections: Arc<RwLock<UserConnections>>,
}

impl NotificationManager {
    pub fn new() -> Self {
        Self {
            connections: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    // Add a new user connection
    pub async fn add_connection(&self, user_id: Uuid) -> broadcast::Receiver<WebSocketMessage> {
        let mut connections = self.connections.write().await;
        
        // Create a broadcast channel for this user (or get existing one)
        let (tx, rx) = broadcast::channel(100);
        connections.insert(user_id, tx);
        
        info!("User {} connected to notifications", user_id);
        rx
    }

    // Remove user connection
    pub async fn remove_connection(&self, user_id: &Uuid) {
        let mut connections = self.connections.write().await;
        connections.remove(user_id);
        info!("User {} disconnected from notifications", user_id);
    }

    // Send notification to specific user
    pub async fn send_to_user(&self, user_id: Uuid, notification_type: NotificationType) {
        let notification = Notification::new(user_id, notification_type);
        let message = WebSocketMessage::from_notification(&notification);
        
        let connections = self.connections.read().await;
        
        if let Some(tx) = connections.get(&user_id) {
            match tx.send(message.clone()) {
                Ok(receiver_count) => {
                    debug!("Sent notification to user {} ({} receivers)", user_id, receiver_count);
                }
                Err(e) => {
                    error!("Failed to send notification to user {}: {}", user_id, e);
                }
            }
        } else {
            debug!("No active connection for user {}, notification not sent", user_id);
        }
    }

    // Send notification to multiple users
    pub async fn send_to_users(&self, user_ids: Vec<Uuid>, notification_type: NotificationType) {
        for user_id in user_ids {
            self.send_to_user(user_id, notification_type.clone()).await;
        }
    }

    // Broadcast to all connected users (admin feature)
    pub async fn broadcast(&self, notification_type: NotificationType) {
        let connections = self.connections.read().await;
        
        for (user_id, tx) in connections.iter() {
            let notification = Notification::new(*user_id, notification_type.clone());
            let message = WebSocketMessage::from_notification(&notification);
            
            if let Err(e) = tx.send(message) {
                error!("Failed to broadcast to user {}: {}", user_id, e);
            }
        }
        
        info!("Broadcasted notification to {} users", connections.len());
    }

    // Get number of connected users
    pub async fn connected_users_count(&self) -> usize {
        self.connections.read().await.len()
    }

    // Check if user is connected
    pub async fn is_user_connected(&self, user_id: &Uuid) -> bool {
        self.connections.read().await.contains_key(user_id)
    }
}
