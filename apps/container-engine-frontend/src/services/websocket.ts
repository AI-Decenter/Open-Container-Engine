// src/services/websocket.ts

export interface WebSocketMessage {
  id: string;
  type: string; // message_type from backend
  data: any; // notification data from backend
  timestamp: string;
}

export type NotificationHandler = (message: WebSocketMessage) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private handlers: Set<NotificationHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private shouldAutoConnect = false;

  constructor() {
    // Don't auto-connect in constructor, wait for explicit connect call
  }

  // Start the WebSocket connection
  public start() {
    this.shouldAutoConnect = true;
    this.connect();
  }

  // Stop the WebSocket connection
  public stop() {
    this.shouldAutoConnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private connect() {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      console.warn('No authentication token found for WebSocket connection');
      return;
    }

    try {
      this.isConnecting = true;
      // Backend WebSocket URL - backend runs on port 3000
      const wsUrl = `ws://localhost:3000/v1/ws/notifications?token=${encodeURIComponent(token)}`;
      console.log('Connecting to WebSocket:', wsUrl);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('Received notification:', message);
          
          // Notify all registered handlers
          this.handlers.forEach(handler => {
            try {
              handler(message);
            } catch (error) {
              console.error('Error in notification handler:', error);
            }
          });
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.isConnecting = false;
        this.ws = null;
        
        // Only reconnect if we should auto-connect and have a token
        if (this.shouldAutoConnect && localStorage.getItem('access_token')) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts || !this.shouldAutoConnect) {
      console.warn('Max reconnection attempts reached or auto-connect disabled');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (this.shouldAutoConnect) {
        this.connect();
      }
    }, delay);
  }

  public subscribe(handler: NotificationHandler): () => void {
    this.handlers.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.handlers.delete(handler);
    };
  }

  public disconnect() {
    this.stop();
    this.handlers.clear();
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Create a singleton instance
export const webSocketService = new WebSocketService();
