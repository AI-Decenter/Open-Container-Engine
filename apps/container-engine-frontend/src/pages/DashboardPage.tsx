// src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import DashboardLayout from '../components/Layout/DashboardLayout'; // Layout với Sidebar, Header

interface DashboardStats {
  deploymentCount: number;
  apiKeyCount: number;
  // Thêm các metrics khác nếu API hỗ trợ
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
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
        {loading && <div className="text-center text-gray-600">Loading stats...</div>}
        {error && <div className="text-red-500 text-center">{error}</div>}

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-primary">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Total Deployments</h2>
              <p className="text-4xl font-bold text-gray-900">{stats.deploymentCount}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-accent">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">API Keys</h2>
              <p className="text-4xl font-bold text-gray-900">{stats.apiKeyCount}</p>
            </div>
            {/* Thêm các card khác như Uptime tổng, số lượng yêu cầu, v.v. */}
          </div>
        )}
        {/* Có thể thêm biểu đồ, thông báo gần đây tại đây */}
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;