// src/context/NotificationContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { webSocketService } from '../services/websocket';
import type { WebSocketMessage, NotificationHandler } from '../services/websocket';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: WebSocketMessage[];
  isConnected: boolean;
  addNotificationHandler: (handler: NotificationHandler) => () => void;
  clearNotifications: () => void;
  markNotificationAsRead: (id: string) => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<WebSocketMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
  const { isAuthenticated, loading } = useAuth();

  // Effect to manage WebSocket connection based on authentication
  useEffect(() => {
    if (isAuthenticated && !loading) {
      console.log('User authenticated, starting WebSocket connection');
      webSocketService.start();
    } else if (!isAuthenticated && !loading) {
      console.log('User not authenticated, stopping WebSocket connection');
      webSocketService.stop();
      // Clear notifications when user logs out
      setNotifications([]);
      setReadNotifications(new Set());
    }

    return () => {
      // Clean up on unmount
      if (!isAuthenticated) {
        webSocketService.stop();
      }
    };
  }, [isAuthenticated, loading]);

  useEffect(() => {
    // Monitor connection status
    const checkConnection = () => {
      setIsConnected(webSocketService.isConnected());
    };

    // Check initial connection status
    checkConnection();

    // Check connection status periodically
    const interval = setInterval(checkConnection, 1000);

    // Global notification handler to store notifications
    const globalHandler: NotificationHandler = (message: WebSocketMessage) => {
      setNotifications(prev => {
        // Keep only the last 50 notifications to prevent memory issues
        const newNotifications = [message, ...prev].slice(0, 50);
        return newNotifications;
      });
    };

    const unsubscribe = webSocketService.subscribe(globalHandler);

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const addNotificationHandler = (handler: NotificationHandler) => {
    return webSocketService.subscribe(handler);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setReadNotifications(new Set());
  };

  const markNotificationAsRead = (id: string) => {
    setReadNotifications(prev => new Set([...prev, id]));
  };

  const unreadCount = notifications.filter(
    (notification: WebSocketMessage) => !readNotifications.has(notification.id)
  ).length;

  const value: NotificationContextType = {
    notifications,
    isConnected,
    addNotificationHandler,
    clearNotifications,
    markNotificationAsRead,
    unreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
