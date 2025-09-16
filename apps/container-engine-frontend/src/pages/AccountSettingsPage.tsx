// src/pages/AccountSettingsPage.tsx
import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import DashboardLayout from '../components/Layout/DashboardLayout';

const AccountSettingsPage: React.FC = () => {
  const [profile, setProfile] = useState({ username: '', email: '' });
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    api.get('/v1/user/profile').then(res => {
      setProfile({ username: res.data.username, email: res.data.email });
    });
  }, []);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage({ type: '', text: '' });
    try {
      await api.put('/v1/user/profile', { username: profile.username, email: profile.email });
      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.response?.data?.error?.message || 'Failed to update profile.' });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });
    if (password.newPassword !== password.confirmNewPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    try {
      await api.put('/v1/user/password', {
        currentPassword: password.currentPassword,
        newPassword: password.newPassword,
        confirmNewPassword: password.confirmNewPassword
      });
      setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
      setPassword({ currentPassword: '', newPassword: '', confirmNewPassword: '' }); // Clear fields
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.response?.data?.error?.message || 'Failed to change password.' });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Account Settings</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Update Profile Form */}
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Update Profile</h2>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                <input type="text" id="username" value={profile.username} onChange={e => setProfile({ ...profile, username: e.target.value })} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" id="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">Save Changes</button>
              </div>
              {profileMessage.text && <p className={`text-sm mt-2 ${profileMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{profileMessage.text}</p>}
            </form>
          </div>

          {/* Change Password Form */}
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Change Password</h2>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label htmlFor="currentPassword">Current Password</label>
                <input type="password" id="currentPassword" value={password.currentPassword} onChange={e => setPassword({ ...password, currentPassword: e.target.value })} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label htmlFor="newPassword">New Password</label>
                <input type="password" id="newPassword" value={password.newPassword} onChange={e => setPassword({ ...password, newPassword: e.target.value })} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label htmlFor="confirmNewPassword">Confirm New Password</label>
                <input type="password" id="confirmNewPassword" value={password.confirmNewPassword} onChange={e => setPassword({ ...password, confirmNewPassword: e.target.value })} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" className="px-4 py-2 bg-primary text-black rounded-md hover:text-blue-700">Change Password</button>
              </div>
              {passwordMessage.text && <p className={`text-sm mt-2 ${passwordMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{passwordMessage.text}</p>}
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AccountSettingsPage;