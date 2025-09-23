// src/pages/DeploymentDetailPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import DashboardLayout from '../components/Layout/DashboardLayout';
import LogsPage from '../components/DeploymentDetail/LogsPage';
import { useNotifications } from '../context/NotificationContext';
import type { WebSocketMessage } from '../services/websocket';
import {
  RocketLaunchIcon,
  CubeIcon,
  ServerIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
  GlobeAltIcon,
  ArrowLeftIcon,
  StopIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CpuChipIcon,
  CircleStackIcon,
  LinkIcon,
  EyeIcon,
  TrashIcon,
  CloudIcon,
  ChartBarIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

type DeploymentStatus = 'pending' | 'running' | 'stopped' | 'failed' | 'updating' | 'scaling';

interface DeploymentDetails {
  id: string;
  user_id: string;
  app_name: string;
  image: string;
  port: number;
  env_vars: { [key: string]: string };
  replicas: number;
  resources: {
    cpu: string | null;
    memory: string | null;
  };
  health_check: any;
  status: DeploymentStatus;
  url: string;
  created_at: string;
  updated_at: string;
  deployed_at: string | null;
}

interface DeploymentLogs {
  timestamp: string;
  message: string;
}

const DeploymentDetailPage: React.FC = () => {
  const { deploymentId } = useParams<{ deploymentId: string }>();
  
  const navigate = useNavigate();
  const [deployment, setDeployment] = useState<DeploymentDetails | null>(null);
  const [ logs,setLogs] = useState<DeploymentLogs[]>([]);
  console.log(logs);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'domains' | 'settings'>('overview');
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  // State for scaling
  const [scaleReplicas, setScaleReplicas] = useState(1);
  const [isScaling, setIsScaling] = useState(false);
  const { addNotificationHandler } = useNotifications();

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied to clipboard!`, 'success');
    } catch (err) {
      showToast(`Failed to copy ${label}`, 'error');
    }
  };

  const fetchData = useCallback(async () => {
    if (!deploymentId) return;

    try {
      setLoading(true);
      const [detailsRes, logsRes] = await Promise.all([
        api.get(`/v1/deployments/${deploymentId}`),
        api.get(`/v1/deployments/${deploymentId}/logs`, { params: { tail: 100 } })
      ]);
      setDeployment(detailsRes.data);
      setScaleReplicas(detailsRes.data.replicas);
      setLogs(logsRes.data.logs || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch deployment details.');
    } finally {
      setLoading(false);
    }
  }, [deploymentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Subscribe to WebSocket notifications for this specific deployment
  useEffect(() => {
    const handleNotification = (message: WebSocketMessage) => {
      console.log("Received WebSocket message:", message);
      
      // Parse the notification data
      let isForCurrentDeployment = false;
      let notificationData: any = null;
      
      try {
        // Backend sends nested data structure: message.data.data contains actual notification data
        const messageType = message.type;
        notificationData = message.data.data; // Access nested data
        
        console.log("Message type:", messageType);
        console.log("Message data:", notificationData);
        
        // Check if this notification is for the current deployment
        isForCurrentDeployment = 
          (messageType === 'deployment_status_changed' && notificationData.deployment_id === deploymentId) ||
          (messageType === 'deployment_scaled' && notificationData.deployment_id === deploymentId) ||
          (messageType === 'deployment_created' && notificationData.deployment_id === deploymentId) ||
          (messageType === 'deployment_deleted' && notificationData.deployment_id === deploymentId);

        console.log("Is for current deployment:", isForCurrentDeployment);
        console.log("Current deployment ID:", deploymentId);
        console.log("Notification deployment ID:", notificationData.deployment_id);

        if (isForCurrentDeployment) {
          console.log("Notification is for current deployment, refreshing data...");
          fetchData();

          // Show toast notification
          if (messageType === 'deployment_status_changed') {
            showToast(`Deployment status changed to: ${notificationData.status}`, 'success');
          } else if (messageType === 'deployment_scaled') {
            showToast(`Deployment scaled from ${notificationData.old_replicas} to ${notificationData.new_replicas} replicas`, 'success');
          } else if (messageType === 'deployment_created') {
            showToast(`Deployment ${notificationData.app_name} created successfully`, 'success');
          } else if (messageType === 'deployment_deleted') {
            showToast(`Deployment ${notificationData.app_name} deleted`, 'error');
            // Redirect to deployments page after deletion
            setTimeout(() => navigate('/deployments'), 2000);
          }
        }
      } catch (error) {
        console.error("Error parsing notification:", error);
      }
    };

    const unsubscribe = addNotificationHandler(handleNotification);

    return () => {
      unsubscribe();
    };
  }, [deploymentId, addNotificationHandler, fetchData, navigate]);

  const handleScale = async () => {
    try {
      setIsScaling(true);
      await api.patch(`/v1/deployments/${deploymentId}/scale`, { replicas: scaleReplicas });
      showToast('Scaling request sent successfully!', 'success');
      // Refresh deployment data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to scale deployment.', 'error');
    } finally {
      setIsScaling(false);
    }
  };

  const handleDeleteDeployment = async () => {
    if (!window.confirm('Are you sure you want to delete this deployment? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/v1/deployments/${deploymentId}`);
      showToast('Deployment deleted successfully!', 'success');
      // Redirect to deployments page after deletion
      setTimeout(() => {
        navigate('/deployments');
      }, 1500);
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to delete deployment.', 'error');
    }
  };

  const getStatusColor = (status: DeploymentStatus) => {
    switch (status) {
      case 'running': return 'text-green-700 bg-green-100 border-green-200';
      case 'pending': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'failed': return 'text-red-700 bg-red-100 border-red-200';
      case 'stopped': return 'text-gray-700 bg-gray-100 border-gray-200';
      case 'updating': return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'scaling': return 'text-purple-700 bg-purple-100 border-purple-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status: DeploymentStatus) => {
    switch (status) {
      case 'running': return <CheckCircleIcon className="h-5 w-5" />;
      case 'pending': return <ClockIcon className="h-5 w-5" />;
      case 'failed': return <ExclamationTriangleIcon className="h-5 w-5" />;
      case 'stopped': return <StopIcon className="h-5 w-5" />;
      case 'updating': return <ArrowPathIcon className="h-5 w-5 animate-spin" />;
      case 'scaling': return <ChartBarIcon className="h-5 w-5" />;
      default: return <ClockIcon className="h-5 w-5" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not deployed';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading deployment details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Deployment</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/deployments')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
            >
              Back to Deployments
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!deployment) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <CubeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Deployment Not Found</h2>
            <p className="text-gray-600 mb-4">The deployment you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/deployments')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
            >
              Back to Deployments
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const TabButton: React.FC<{ tabName: typeof activeTab; label: string; icon: React.ReactNode }> = ({ tabName, label, icon }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`flex items-center px-6 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === tabName
        ? 'bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-lg'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}
    >
      {icon}
      <span className="ml-2">{label}</span>
    </button>
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50">
        <div className="p-8">
          {/* Toast Notification */}
          {toast.show && (
            <div className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-xl shadow-lg border transition-all transform ${toast.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
              }`}>
              {toast.type === 'success' ? (
                <CheckCircleIcon className="h-5 w-5 mr-3" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 mr-3" />
              )}
              {toast.message}
            </div>
          )}

          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/deployments')}
                  className="flex items-center justify-center w-12 h-12 rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-200 text-gray-600 hover:text-blue-600"
                >
                  <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <div>
                  <div className="flex items-center space-x-4 mb-2">
                    <h1 className="text-4xl font-bold text-gray-900">{deployment.app_name}</h1>
                    <span className={`flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(deployment.status)}`}>
                      {getStatusIcon(deployment.status)}
                      <span className="ml-2 capitalize">{deployment.status}</span>
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    <a
                      href={deployment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                      {deployment.url}
                    </a>
                    <button
                      onClick={() => copyToClipboard(deployment.url, 'URL')}
                      className="ml-2 p-1 text-gray-400 hover:text-gray-600 rounded transition-all"
                    >
                      <ClipboardDocumentListIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-xl transition-all">
                  <EyeIcon className="h-5 w-5 mr-2" />
                  View Live
                </button>
              
                <button 
                  onClick={handleDeleteDeployment}
                  className="flex items-center px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition-all"
                >
                  <TrashIcon className="h-5 w-5 mr-2" />
                  Delete
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                  <ServerIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{deployment.replicas}</h3>
                  <p className="text-gray-600">Replicas</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                  <CloudIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{deployment.port}</h3>
                  <p className="text-gray-600">Port</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                  <CpuChipIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{deployment.resources.cpu || 'Auto'}</h3>
                  <p className="text-gray-600">CPU</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mr-4">
                  <CircleStackIcon className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{deployment.resources.memory || 'Auto'}</h3>
                  <p className="text-gray-600">Memory</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-4 mb-8 bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
            <TabButton
              tabName="overview"
              label="Overview"
              icon={<ChartBarIcon className="h-5 w-5" />}
            />
            <TabButton
              tabName="logs"
              label="Logs"
              icon={<ClipboardDocumentListIcon className="h-5 w-5" />}
            />
            <TabButton
              tabName="domains"
              label="Domains"
              icon={<GlobeAltIcon className="h-5 w-5" />}
            />
            <TabButton
              tabName="settings"
              label="Settings"
              icon={<Cog6ToothIcon className="h-5 w-5" />}
            />
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Deployment Information */}
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                      <CubeIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Deployment Information</h2>
                      <p className="text-gray-600">Core deployment details and metadata</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Deployment ID:</span>
                      <div className="flex items-center">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-800 mr-2">
                          {deployment.id.substring(0, 8)}...
                        </code>
                        <button
                          onClick={() => copyToClipboard(deployment.id, 'Deployment ID')}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded transition-all"
                        >
                          <ClipboardDocumentListIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Container Image:</span>
                      <div className="flex items-center">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-800 mr-2">
                          {deployment.image}
                        </code>
                        <button
                          onClick={() => copyToClipboard(deployment.image, 'Container Image')}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded transition-all"
                        >
                          <ClipboardDocumentListIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Created:</span>
                      <span className="text-gray-900">{formatDate(deployment.created_at)}</span>
                    </div>

                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Last Updated:</span>
                      <span className="text-gray-900">{formatDate(deployment.updated_at)}</span>
                    </div>

                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Deployed At:</span>
                      <span className="text-gray-900">{formatDate(deployment.deployed_at)}</span>
                    </div>

                    <div className="flex justify-between items-center py-3">
                      <span className="font-medium text-gray-700">User ID:</span>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-800">
                        {deployment.user_id.substring(0, 8)}...
                      </code>
                    </div>
                  </div>
                </div>

                {/* Scaling Controls */}
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                      <ChartBarIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Scaling Control</h2>
                      <p className="text-gray-600">Adjust the number of running instances</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label htmlFor="replicas" className="block text-sm font-medium text-gray-700 mb-3">
                        Number of Replicas
                      </label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="number"
                          id="replicas"
                          min="0"
                          max="10"
                          value={scaleReplicas}
                          onChange={(e) => setScaleReplicas(Number(e.target.value))}
                          className="w-24 px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-mono text-lg"
                        />
                        <button
                          onClick={handleScale}
                          disabled={isScaling || scaleReplicas === deployment.replicas}
                          className="flex items-center px-6 py-3 bg-linear-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 transition-all font-medium shadow-lg hover:shadow-xl"
                        >
                          {isScaling ? (
                            <>
                              <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                              Scaling...
                            </>
                          ) : (
                            <>
                              <RocketLaunchIcon className="h-5 w-5 mr-2" />
                              Apply Scale
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Current: {deployment.replicas} replica{deployment.replicas !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Resource Information */}
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="font-semibold text-gray-900 mb-4">Resource Allocation</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-xl">
                          <div className="flex items-center mb-2">
                            <CpuChipIcon className="h-5 w-5 text-blue-600 mr-2" />
                            <span className="font-medium text-gray-700">CPU</span>
                          </div>
                          <span className="text-lg font-mono text-gray-900">
                            {deployment.resources.cpu || 'Auto-scaled'}
                          </span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl">
                          <div className="flex items-center mb-2">
                            <CircleStackIcon className="h-5 w-5 text-purple-600 mr-2" />
                            <span className="font-medium text-gray-700">Memory</span>
                          </div>
                          <span className="text-lg font-mono text-gray-900">
                            {deployment.resources.memory || 'Auto-scaled'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <LogsPage />
            )}

            {activeTab === 'domains' && (
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                    <GlobeAltIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Custom Domains</h2>
                    <p className="text-gray-600">Manage custom domains for your deployment</p>
                  </div>
                </div>

                <div className="text-center py-12">
                  <GlobeAltIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Custom Domains Coming Soon</h3>
                  <p className="text-gray-600 mb-6">You'll be able to add and manage custom domains for your deployments.</p>
                  <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-xl text-gray-700">
                    <ClockIcon className="h-5 w-5 mr-2" />
                    Feature in development
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-8">
                {/* Environment Variables */}
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                      <Cog6ToothIcon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Environment Variables</h2>
                      <p className="text-gray-600">Application configuration settings</p>
                    </div>
                  </div>

                  {Object.keys(deployment.env_vars).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(deployment.env_vars).map(([key, value]) => (
                        <div key={key} className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                          <div className="flex-1 flex items-center space-x-4">
                            <code className="font-mono text-sm bg-white px-3 py-2 rounded-lg border text-blue-700 font-semibold">
                              {key}
                            </code>
                            <span className="text-gray-400 font-bold">=</span>
                            <code className="font-mono text-sm bg-white px-3 py-2 rounded-lg border text-gray-800 flex-1">
                              {value}
                            </code>
                          </div>
                          <button
                            onClick={() => copyToClipboard(`${key}=${value}`, 'Environment variable')}
                            className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-all"
                          >
                            <ClipboardDocumentListIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Cog6ToothIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Environment Variables</h3>
                      <p className="text-gray-600 mb-6">This deployment doesn't have any environment variables configured.</p>
                      <button className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium">
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add Environment Variable
                      </button>
                    </div>
                  )}
                </div>

                {/* Health Check Settings */}
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                      <CheckCircleIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Health Check Configuration</h2>
                      <p className="text-gray-600">Monitor your application's health status</p>
                    </div>
                  </div>

                  {deployment.health_check ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-xl">
                          <span className="font-medium text-gray-700">Endpoint:</span>
                          <code className="block text-sm bg-white px-2 py-1 rounded mt-1 text-gray-800">
                            {deployment.health_check.endpoint || '/health'}
                          </code>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl">
                          <span className="font-medium text-gray-700">Interval:</span>
                          <code className="block text-sm bg-white px-2 py-1 rounded mt-1 text-gray-800">
                            {deployment.health_check.interval || '30s'}
                          </code>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ExclamationTriangleIcon className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Health Check Configured</h3>
                      <p className="text-gray-600 mb-6">Configure health checks to monitor your application's availability.</p>
                      <button className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-medium">
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Configure Health Check
                      </button>
                    </div>
                  )}
                </div>

                {/* Danger Zone */}
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-red-200">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mr-4">
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-red-900">Danger Zone</h2>
                      <p className="text-red-600">Irreversible and destructive actions</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-red-200 rounded-xl">
                      <div>
                        <h3 className="font-semibold text-gray-900">Stop Deployment</h3>
                        <p className="text-gray-600 text-sm">Stop all running instances of this deployment.</p>
                      </div>
                      <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-all font-medium">
                        <StopIcon className="h-4 w-4 mr-2 inline" />
                        Stop
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-red-200 rounded-xl">
                      <div>
                        <h3 className="font-semibold text-gray-900">Delete Deployment</h3>
                        <p className="text-gray-600 text-sm">Permanently delete this deployment and all associated data.</p>
                      </div>
                      <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium">
                        <TrashIcon className="h-4 w-4 mr-2 inline" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DeploymentDetailPage;