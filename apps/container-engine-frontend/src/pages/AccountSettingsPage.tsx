// src/pages/AccountSettingsPage.tsx
import React, { useState, useEffect } from 'react';
import api from '../api/api';
import DashboardLayout from '../components/Layout/DashboardLayout';

interface ProfileData {
  username: string;
  email: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

interface MessageState {
  type: 'success' | 'error' | '';
  text: string;
}

const AccountSettingsPage: React.FC = () => {
  const [profile, setProfile] = useState<ProfileData>({ username: '', email: '' });
  const [password, setPassword] = useState<PasswordData>({ 
    currentPassword: '', 
    newPassword: '', 
    confirmNewPassword: '' 
  });
  const [profileMessage, setProfileMessage] = useState<MessageState>({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState<MessageState>({ type: '', text: '' });
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/v1/user/profile');
        setProfile({ username: res.data.username, email: res.data.email });
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    };
    
    fetchProfile();
  }, []);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfileLoading(true);
    setProfileMessage({ type: '', text: '' });
    
    try {
      await api.put('/v1/user/profile', { 
        username: profile.username, 
        email: profile.email 
      });
      setProfileMessage({ 
        type: 'success', 
        text: 'Profile updated successfully! 🎉' 
      });
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setProfileMessage({ type: '', text: '' });
      }, 3000);
    } catch (err: any) {
      setProfileMessage({ 
        type: 'error', 
        text: err.response?.data?.error?.message || 'Failed to update profile. Please try again.' 
      });
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPasswordLoading(true);
    setPasswordMessage({ type: '', text: '' });
    
    if (password.newPassword !== password.confirmNewPassword) {
      setPasswordMessage({ 
        type: 'error', 
        text: 'New passwords do not match. Please check and try again.' 
      });
      setIsPasswordLoading(false);
      return;
    }
    
    if (password.newPassword.length < 6) {
      setPasswordMessage({ 
        type: 'error', 
        text: 'New password must be at least 6 characters long.' 
      });
      setIsPasswordLoading(false);
      return;
    }

    try {
      await api.put('/v1/user/password', {
        current_password: password.currentPassword,
        new_password: password.newPassword,
        confirm_new_password: password.confirmNewPassword
      });
      setPasswordMessage({ 
        type: 'success', 
        text: 'Password changed successfully! 🔒✨' 
      });
      setPassword({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setPasswordMessage({ type: '', text: '' });
      }, 3000);
    } catch (err: any) {
      setPasswordMessage({ 
        type: 'error', 
        text: err.response?.data?.error?.message || 'Failed to change password. Please verify your current password.' 
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const EyeIcon = ({ show, onClick }: { show: boolean; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
    >
      {show ? (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
        </svg>
      )}
    </button>
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6">
        {/* Header Section */}
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
                <p className="text-gray-600 mt-1">Manage your account information and security preferences</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Profile Update Card */}
            <div className="group">
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
                <div className="bg-linear-to-r from-blue-600 to-purple-600 p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">Profile Information</h2>
                      <p className="text-blue-100 text-sm">Update your personal details</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-8">
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="space-y-4">
                      <div className="group">
                        <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                          Username
                        </label>
                        <div className="relative">
                          <input 
                            type="text" 
                            id="username" 
                            value={profile.username} 
                            onChange={e => setProfile({ ...profile, username: e.target.value })} 
                            required 
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white group-hover:border-gray-300" 
                            placeholder="Enter your username"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <div className="group">
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <input 
                            type="email" 
                            id="email" 
                            value={profile.email} 
                            onChange={e => setProfile({ ...profile, email: e.target.value })} 
                            required 
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white group-hover:border-gray-300" 
                            placeholder="Enter your email"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end pt-4">
                      <button 
                        type="submit" 
                        disabled={isProfileLoading}
                        className="relative overflow-hidden px-8 py-3 bg-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-w-[140px]"
                      >
                        {isProfileLoading ? (
                          <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </div>
                        ) : (
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Save Changes
                          </span>
                        )}
                      </button>
                    </div>
                    
                    {profileMessage.text && (
                      <div className={`mt-4 p-4 rounded-xl transition-all duration-300 transform ${
                        profileMessage.type === 'success' 
                          ? 'bg-green-50 border border-green-200 text-green-800' 
                          : 'bg-red-50 border border-red-200 text-red-800'
                      }`}>
                        <div className="flex items-center">
                          {profileMessage.type === 'success' ? (
                            <svg className="w-5 h-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 mr-2 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          <span className="font-medium">{profileMessage.text}</span>
                        </div>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>

            {/* Password Change Card */}
            <div className="group">
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
                <div className="bg-linear-to-r from-blue-600 to-purple-600 p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">Security Settings</h2>
                      <p className="text-purple-100 text-sm">Update your password</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-8">
                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div className="space-y-4">
                      <div className="group">
                        <label htmlFor="currentPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                          Current Password
                        </label>
                        <div className="relative">
                          <input 
                            type={showCurrentPassword ? "text" : "password"}
                            id="currentPassword" 
                            value={password.currentPassword} 
                            onChange={e => setPassword({ ...password, currentPassword: e.target.value })} 
                            required 
                            className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white group-hover:border-gray-300" 
                            placeholder="Enter current password"
                          />
                          <EyeIcon 
                            show={showCurrentPassword} 
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)} 
                          />
                        </div>
                      </div>
                      
                      <div className="group">
                        <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <input 
                            type={showNewPassword ? "text" : "password"}
                            id="newPassword" 
                            value={password.newPassword} 
                            onChange={e => setPassword({ ...password, newPassword: e.target.value })} 
                            required 
                            className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white group-hover:border-gray-300" 
                            placeholder="Enter new password"
                          />
                          <EyeIcon 
                            show={showNewPassword} 
                            onClick={() => setShowNewPassword(!showNewPassword)} 
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
                      </div>
                      
                      <div className="group">
                        <label htmlFor="confirmNewPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <input 
                            type={showConfirmPassword ? "text" : "password"}
                            id="confirmNewPassword" 
                            value={password.confirmNewPassword} 
                            onChange={e => setPassword({ ...password, confirmNewPassword: e.target.value })} 
                            required 
                            className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white group-hover:border-gray-300" 
                            placeholder="Confirm new password"
                          />
                          <EyeIcon 
                            show={showConfirmPassword} 
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end pt-4">
                      <button 
                        type="submit" 
                        disabled={isPasswordLoading}
                        className="relative overflow-hidden px-8 py-3 bg-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-w-[140px]"
                      >
                        {isPasswordLoading ? (
                          <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Updating...
                          </div>
                        ) : (
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Update Password
                          </span>
                        )}
                      </button>
                    </div>
                    
                    {passwordMessage.text && (
                      <div className={`mt-4 p-4 rounded-xl transition-all duration-300 transform ${
                        passwordMessage.type === 'success' 
                          ? 'bg-green-50 border border-green-200 text-green-800' 
                          : 'bg-red-50 border border-red-200 text-red-800'
                      }`}>
                        <div className="flex items-center">
                          {passwordMessage.type === 'success' ? (
                            <svg className="w-5 h-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 mr-2 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          <span className="font-medium">{passwordMessage.text}</span>
                        </div>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AccountSettingsPage;