// src/pages/DeploymentsPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/api';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useNotifications } from '../context/NotificationContext';
import type { WebSocketMessage } from '../services/websocket';

interface Deployment {
  id: string;
  app_name: string; // Updated to match API response
  image: string;
  status: 'pending' | 'running' | 'stopped' | 'failed' | 'updating' | 'scaling' | 'starting' | 'stopping';
  url: string;
  replicas: number;
  created_at: string; // Updated to match API response
  updated_at: string; // Updated to match API response
}

const DeploymentsPage: React.FC = () => {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const deploymentsPerPage = 10;
  const { addNotificationHandler } = useNotifications();

  const fetchDeployments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/v1/deployments', {
        params: {
          page: currentPage,
          limit: deploymentsPerPage,
        },
      });
      setDeployments(response.data.deployments);
      setTotalPages(response.data.pagination.total_pages); // Updated to match API response
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch deployments.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, deploymentsPerPage]);

  useEffect(() => {
    fetchDeployments();
  }, [fetchDeployments]);

  // Subscribe to WebSocket notifications for deployment changes
  useEffect(() => {
    const handleNotification = (message: WebSocketMessage) => {
      // Auto-refresh deployments when any deployment-related notification arrives
      if (message.type === 'deployment_status_changed' || 
          message.type === 'deployment_created' || 
          message.type === 'deployment_deleted' ||
          message.type === 'deployment_scaled') {
        console.log('Received deployment notification, refreshing list...', message);
        fetchDeployments();
      }
    };

    const unsubscribe = addNotificationHandler(handleNotification);

    return () => {
      unsubscribe();
    };
  }, [addNotificationHandler, fetchDeployments]);

  const handleDeleteDeployment = async (deploymentId: string) => {
    if (!window.confirm('Are you sure you want to delete this deployment? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/v1/deployments/${deploymentId}`);
      setDeployments(deployments.filter(d => d.id !== deploymentId));
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to delete deployment.');
    }
  };

  const handleStopDeployment = async (deploymentId: string) => {
    try {
      await api.post(`/v1/deployments/${deploymentId}/stop`);
      // Optimistically update status
      setDeployments(deployments.map(d => d.id === deploymentId ? { ...d, status: 'stopping' } : d));
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to stop deployment.');
    }
  };

  const handleStartDeployment = async (deploymentId: string) => {
    try {
      await api.post(`/v1/deployments/${deploymentId}/start`);
      // Optimistically update status
      setDeployments(deployments.map(d => d.id === deploymentId ? { ...d, status: 'starting' } : d));
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to start deployment.');
    }
  };

  const getStatusClasses = (status: Deployment['status']) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'updating':
      case 'scaling':
      case 'starting':
      case 'stopping':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'stopped':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to extract domain from URL for cleaner display
  const getDomainFromUrl = (url: string) => {
    try {
      const hostname = new URL(url).hostname;
      return hostname.startsWith('www.') ? hostname.substring(4) : hostname;
    } catch {
      return url; // Return original if URL is invalid
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-10 bg-gray-50 min-h-screen">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4 sm:mb-0">Your Deployments</h1>
          <Link
            to="/deployments/new"
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-6 py-3 border border-transparent text-sm sm:text-base font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200 ease-in-out"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Deployment
          </Link>
        </div>

        {loading && (
          <div className="flex flex-col sm:flex-row items-center justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 sm:mt-0 sm:ml-4 text-base sm:text-lg text-gray-600">Loading deployments...</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error fetching deployments:</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && deployments.length === 0 && !error && (
          <div className="bg-white shadow-lg rounded-lg p-6 sm:p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 mb-4">
              <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-4H3m16 8H7m12 4H9" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No deployments found</h3>
            <p className="text-sm sm:text-base text-gray-500 mb-6">It looks like you haven't deployed anything yet. Get started by creating your first deployment!</p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link
                to="/deployments/new?try=helloworld"
                className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-200"
              >
                <svg className="-ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Try Demo Deployment
              </Link>
              
              <span className="text-gray-400 hidden sm:inline">or</span>
              <span className="text-gray-400 sm:hidden">or</span>
              
              <Link
                to="/deployments/new"
                className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 text-sm sm:text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200"
              >
                <svg className="-ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Create Custom Deployment
              </Link>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-xs sm:text-sm text-blue-700">
                💡 <strong>Pro tip:</strong> The Demo Deployment will automatically create a sample deployment with a simple web server that you can access immediately!
              </p>
            </div>
          </div>
        )}

        {deployments.length > 0 && (
          <>
            {/* Mobile Card View */}
            <div className="block lg:hidden space-y-4">
              {deployments.map((deployment) => (
                <div key={deployment.id} className="bg-white shadow-lg rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <Link to={`/deployments/${deployment.id}`} className="text-lg font-semibold text-indigo-600 hover:text-indigo-900">
                      {deployment.app_name}
                    </Link>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClasses(deployment.status)}`}
                    >
                      {deployment.status.charAt(0).toUpperCase() + deployment.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Image:</span>
                      <span className="text-gray-900 truncate ml-2">{deployment.image}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">URL:</span>
                      <a href={deployment.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900 truncate ml-2" title={deployment.url}>
                        {getDomainFromUrl(deployment.url)}
                      </a>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Replicas:</span>
                      <span className="text-gray-900">{deployment.replicas}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Updated:</span>
                      <span className="text-gray-900">{formatDistanceToNow(parseISO(deployment.updated_at), { addSuffix: true })}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {deployment.status === 'running' && (
                      <button
                        onClick={() => handleStopDeployment(deployment.id)}
                        className="flex-1 sm:flex-none px-3 py-2 text-xs font-medium text-yellow-700 bg-yellow-100 hover:bg-yellow-200 rounded-md transition duration-150"
                      >
                        Stop
                      </button>
                    )}
                    {(deployment.status === 'stopped' || deployment.status === 'failed') && (
                      <button
                        onClick={() => handleStartDeployment(deployment.id)}
                        className="flex-1 sm:flex-none px-3 py-2 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition duration-150"
                      >
                        Start
                      </button>
                    )}
                    <Link 
                      to={`/deployments/${deployment.id}`} 
                      className="flex-1 sm:flex-none px-3 py-2 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition duration-150 text-center"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => handleDeleteDeployment(deployment.id)}
                      className="flex-1 sm:flex-none px-3 py-2 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition duration-150"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white shadow-xl rounded-lg overflow-hidden ring-1 ring-black ring-opacity-5">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        App Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Image
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        URL
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Replicas
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Updated
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {deployments.map((deployment) => (
                      <tr key={deployment.id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <Link to={`/deployments/${deployment.id}`} className="text-indigo-600 hover:text-indigo-900 font-semibold">
                            {deployment.app_name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{deployment.image}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(deployment.status)}`}
                          >
                            {deployment.status.charAt(0).toUpperCase() + deployment.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <a href={deployment.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900 truncate max-w-xs block" title={deployment.url}>
                            {getDomainFromUrl(deployment.url)}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{deployment.replicas}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDistanceToNow(parseISO(deployment.updated_at), { addSuffix: true })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-3">
                            {deployment.status === 'running' && (
                              <button
                                onClick={() => handleStopDeployment(deployment.id)}
                                className="text-yellow-600 hover:text-yellow-800 transition duration-150 ease-in-out"
                                title="Stop Deployment"
                              >
                                Stop
                              </button>
                            )}
                            {(deployment.status === 'stopped' || deployment.status === 'failed') && (
                              <button
                                onClick={() => handleStartDeployment(deployment.id)}
                                className="text-green-600 hover:text-green-800 transition duration-150 ease-in-out"
                                title="Start Deployment"
                              >
                                Start
                              </button>
                            )}
                            <Link to={`/deployments/${deployment.id}`} className="text-blue-600 hover:text-blue-800 transition duration-150 ease-in-out" title="View Details">
                              View
                            </Link>
                            <button
                              onClick={() => handleDeleteDeployment(deployment.id)}
                              className="text-red-600 hover:text-red-800 transition duration-150 ease-in-out"
                              title="Delete Deployment"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6 sm:mt-10">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 sm:px-4 py-2 rounded-l-md border border-gray-300 bg-white text-xs sm:text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only sm:not-sr-only">Previous</span>
                <span className="sm:hidden">‹</span>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  aria-current={currentPage === page ? 'page' : undefined}
                  className={`relative inline-flex items-center px-2 sm:px-4 py-2 border border-gray-300 text-xs sm:text-sm font-medium ${
                    currentPage === page ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 sm:px-4 py-2 rounded-r-md border border-gray-300 bg-white text-xs sm:text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only sm:not-sr-only">Next</span>
                <span className="sm:hidden">›</span>
              </button>
            </nav>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DeploymentsPage;