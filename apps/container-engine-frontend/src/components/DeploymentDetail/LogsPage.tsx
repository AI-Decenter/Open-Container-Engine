// LogsPage.jsx
import { useState, useEffect, useRef } from 'react';
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { useParams } from 'react-router-dom';
import api from '../../api/api';

export default function LogsPage() {
  const { deploymentId } = useParams();
  const [logs, setLogs] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<any>(null);
  const wsRef: any = useRef(null);
  const logsEndRef: any = useRef(null);
  const reconnectTimeoutRef: any = useRef(null);
  const reconnectDelay = useRef(1000);

  // Auto-scroll to bottom when new logs arrive
  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  // Get auth token from localStorage
  const getAuthToken = () => {
    try {
      const authData = localStorage.getItem('access_token');
      return authData ? authData : null;
    } catch (err) {
      console.error('Failed to get auth token:', err);
    }
    return null;
  };

  // Load historical logs from API
  const loadHistoricalLogs = async (retryCount = 0) => {
    if (!deploymentId) return;

    setIsLoadingHistory(true);
    setError(null);

    try {
      const response = await api.get(`/v1/deployments/${deploymentId}/logs?tail=100`);

      if (response.data.logs) {
        // Parse historical logs - assuming they come as a single string with newlines
        const historicalLogs = response.data.logs
          .split('\n')
          .filter((line: any) => line.trim()) // Remove empty lines
          .map((line: any, index: any) => {
            // Try to extract timestamp from log line if it exists
            const timestampMatch = line.match(/^\[?(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2})/);
            const timestamp = timestampMatch
              ? timestampMatch[1]
              : new Date(Date.now() - (100 - index) * 1000).toISOString(); // Fallback timestamp

            return {
              timestamp,
              message: line,
              id: `history-${index}`,
              isHistorical: true
            };
          });

        setLogs(historicalLogs);
      }
    } catch (err: any) {
      console.error('Failed to load historical logs:', err);
      if (err?.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      } else if (err?.response?.status === 404) {
        setError('Deployment not found or no logs available.');
      } else if (err?.response?.status === 400 && err?.response?.data?.message?.includes('ContainerCreating')) {
        if (retryCount < 10) {
          setError(`Container is starting up... (Retry ${retryCount + 1}/10)`);
          setTimeout(() => loadHistoricalLogs(retryCount + 1), 3000);
          return;
        } else {
          setError('Container is taking longer than expected to start. Please refresh manually.');
        }
      } else if (err?.response?.status === 400 && err?.response?.data?.message?.includes('waiting to start')) {
        if (retryCount < 10) {
          setError(`Container is being created... (Retry ${retryCount + 1}/10)`);
          setTimeout(() => loadHistoricalLogs(retryCount + 1), 3000);
          return;
        } else {
          setError('Container is taking longer than expected to start. Please refresh manually.');
        }
      } else {
        setError('Failed to load log history');
      }
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // WebSocket connection with authentication
  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN || !deploymentId) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setError('Authentication required. Please login again.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    // Add token to WebSocket URL as query parameter
    const wsUrl = `ws://localhost:3000/v1/deployments/${deploymentId}/logs/stream?tail=50&token=${encodeURIComponent('Bearer ' + token)}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setIsConnecting(false);
      reconnectDelay.current = 1000; // Reset reconnect delay
    };

    ws.onmessage = (event) => {
      // Skip connection confirmation messages
      if (event.data === 'Connected to log stream' ||
        event.data === 'Log stream ended' ||
        event.data.includes('Authentication')) {
        return;
      }

      const timestamp = new Date().toISOString();
      const newLog = {
        timestamp,
        message: event.data,
        id: `live-${timestamp}-${Math.random()}`,
        isHistorical: false
      };

      setLogs((prev: any) => [...prev, newLog]);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error occurred');
    };

    ws.onclose = (event) => {
      console.log('WebSocket disconnected', event.code, event.reason);
      setIsConnected(false);
      setIsConnecting(false);
      wsRef.current = null;

      // Handle authentication errors
      if (event.code === 1008 || event.reason?.includes('Authentication') || event.code === 1011) {
        setError('Authentication failed. Please login again.');
        return;
      }

      // Handle deployment not found
      if (event.code === 1008 || event.reason?.includes('not found')) {
        setError('Deployment not found or access denied.');
        return;
      }

      // Auto-reconnect with exponential backoff for other errors
      const delay = reconnectDelay.current;
      reconnectDelay.current = Math.min(delay * 2, 30000); // Max 30s

      setError(`Disconnected. Reconnecting in ${delay / 1000}s...`);

      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, delay);
    };

    wsRef.current = ws;
  };

  // Initialize: Load history first, then connect WebSocket
  useEffect(() => {
    if (deploymentId) {
      // Load historical logs first
      loadHistoricalLogs().then(() => {
        // Small delay to show historical logs before connecting WebSocket
        setTimeout(() => {
          connectWebSocket();
        }, 500);
      });
    }

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [deploymentId]);

  // Manual refresh - reload everything
  const handleRefresh = async () => {
    setLogs([]); // Clear logs
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Reload historical logs then reconnect WebSocket
    await loadHistoricalLogs();
    setTimeout(() => {
      connectWebSocket();
    }, 500);
  };

  // Clear logs
  const handleClear = () => {
    setLogs([]);
  };

  // Download logs
  const handleDownload = () => {
    const logText = logs.map((log) =>
      `[${new Date(log.timestamp).toLocaleString()}] ${log.message}`
    ).join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${deploymentId}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get connection status
  const getConnectionStatus = () => {
    if (isLoadingHistory) return {
      text: 'Loading history...',
      color: 'bg-blue-100 text-blue-800',
      dot: 'bg-blue-400'
    };
    if (isConnected) return {
      text: 'Live streaming',
      color: 'bg-green-100 text-green-800',
      dot: 'bg-green-400'
    };
    if (isConnecting) return {
      text: 'Connecting...',
      color: 'bg-yellow-100 text-yellow-800',
      dot: 'bg-yellow-400'
    };
    return {
      text: 'Disconnected',
      color: 'bg-red-100 text-red-800',
      dot: 'bg-red-400'
    };
  };

  const status = getConnectionStatus();

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mr-4">
              <ClipboardDocumentListIcon className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Application Logs</h2>
              <p className="text-gray-600">
                Real-time logs from your deployment
                <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                  <span className={`w-2 h-2 rounded-full mr-1.5 ${status.dot}`}></span>
                  {status.text}
                </span>
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleClear}
              disabled={isLoadingHistory}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </button>
            <button
              onClick={handleDownload}
              disabled={logs.length === 0}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Download
            </button>
            <button
              onClick={handleRefresh}
              disabled={isConnecting || isLoadingHistory}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting || isLoadingHistory ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}
      </div>

      <div className="relative">
        <div className="bg-gray-900 text-white font-mono text-sm p-6 h-96 overflow-y-auto custom-scrollbar">
          {logs.length > 0 ? (
            <>
              {logs.map((log) => (
                <div key={log.id} className="flex space-x-4 py-1 hover:bg-gray-800 px-2 rounded group">
                  <span className="text-gray-500 flex-shrink-0 select-none">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`flex-shrink-0 select-none ${log.isHistorical ? 'text-gray-600' : 'text-green-400'}`}>
                    {log.isHistorical ? '◦' : '│'}
                  </span>
                  <span className="flex-1 break-all whitespace-pre-wrap">{log.message}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </>
          ) : (
            <div className="text-center py-8">
              <ClipboardDocumentListIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">
                {isLoadingHistory || isConnecting ? 'Loading logs...' : 'No logs available at the moment.'}
              </p>
              <p className="text-gray-600 text-sm mt-2">
                Logs will appear here once your application starts generating them.
              </p>
            </div>
          )}
        </div>

        {logs.length > 10 && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg shadow-lg transition-all"
            title="Scroll to bottom"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        )}
      </div>

      {/* Log count indicator */}
      {logs.length > 0 && (
        <div className="px-6 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
          <span>
            {logs.filter(log => log.isHistorical).length} historical + {logs.filter(log => !log.isHistorical).length} live logs
          </span>
          <span>Total: {logs.length} lines</span>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #374151;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #6B7280;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9CA3AF;
        }
      `}</style>
    </div>
  );
}
