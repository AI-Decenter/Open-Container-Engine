// src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import api from '../api/api';
import DashboardLayout from '../components/Layout/DashboardLayout'; // Layout với Sidebar, Header

interface DashboardStats {
  deploymentCount: number;
  apiKeyCount: number;
  // Add more metrics if API supports them
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const userProfileResponse = await api.get('/v1/user/profile');
        setStats({
          deploymentCount: userProfileResponse.data.deploymentCount,
          apiKeyCount: userProfileResponse.data.apiKeyCount,
        });
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Failed to fetch dashboard stats.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-center text-gray-600">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-sm sm:text-base">Loading stats...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">Total Deployments</h2>
              <p className="text-3xl sm:text-4xl font-bold text-gray-900">{stats.deploymentCount}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Active containers</p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border-l-4 border-green-500 hover:shadow-lg transition-shadow">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">API Keys</h2>
              <p className="text-3xl sm:text-4xl font-bold text-gray-900">{stats.apiKeyCount}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Authentication tokens</p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border-l-4 border-purple-500 hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">System Status</h2>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse mr-3"></div>
                <p className="text-base sm:text-lg font-medium text-green-600">All Systems Operational</p>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Last checked: {new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {stats && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <a
                href="/deployments/new"
                className="flex items-center justify-center p-3 sm:p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-blue-700 hover:text-blue-800"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm sm:text-base font-medium">New Deployment</span>
              </a>
              <a
                href="/deployments"
                className="flex items-center justify-center p-3 sm:p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-green-700 hover:text-green-800"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-4H3m16 8H7m12 4H9" />
                </svg>
                <span className="text-sm sm:text-base font-medium">View Deployments</span>
              </a>
              <a
                href="/api-keys"
                className="flex items-center justify-center p-3 sm:p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-purple-700 hover:text-purple-800"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <span className="text-sm sm:text-base font-medium">Manage API Keys</span>
              </a>
              <a
                href="/settings"
                className="flex items-center justify-center p-3 sm:p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-gray-700 hover:text-gray-800"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm sm:text-base font-medium">Settings</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;