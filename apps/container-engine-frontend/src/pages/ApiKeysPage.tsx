import React, { useEffect, useState, useCallback } from 'react';
import api from '../lib/api';
import DashboardLayout from '../components/Layout/DashboardLayout';
import {
  PlusIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  ClipboardDocumentIcon,
  TrashIcon,
  CalendarIcon,
  ClockIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ClipboardIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

// --- TypeScript Interfaces ---
interface ApiKey {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  lastUsed: string | null;
}

// --- Sub-component: CreateKeyModal ---
interface CreateKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newKey: string) => void;
}

const CreateKeyModal: React.FC<CreateKeyModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);
    try {
      const response = await api.post('/v1/api-keys', { name, description });
      onSuccess(response?.data?.api_key);
      setName('');
      setDescription('');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create API key.');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
        <div className="p-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
              <KeyIcon className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Create New API Key</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="keyName" className="block text-sm font-semibold text-gray-700 mb-2">
                Key Name
              </label>
              <input
                type="text"
                id="keyName"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="My API Key"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="keyDesc" className="block text-sm font-semibold text-gray-700 mb-2">
                Description <span className="text-gray-400">(Optional)</span>
              </label>
              <textarea
                id="keyDesc"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder="What will this key be used for?"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            {error && (
              <div className="flex items-center p-4 bg-red-50 rounded-xl border border-red-200">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 transition-all font-medium shadow-lg"
              >
                {isCreating ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Creating...
                  </div>
                ) : (
                  'Create API Key'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- Sub-component: ShowKeyModal ---
interface ShowKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
}

const ShowKeyModal: React.FC<ShowKeyModalProps> = ({ isOpen, onClose, apiKey }) => {
  const [copyText, setCopyText] = useState('Copy to Clipboard');
  const [showKey, setShowKey] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopyText('Copied!');
    setTimeout(() => setCopyText('Copy to Clipboard'), 2000);
  };

  const maskedKey = apiKey && apiKey.length > 16
    ? apiKey.slice(0, 8) + '•'.repeat(apiKey.length - 16) + apiKey.slice(-8)
    : apiKey || '';
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all">
        <div className="p-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4">
              <ShieldCheckIcon className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">API Key Created Successfully!</h2>
          </div>

          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-800 mb-1">Important Security Notice</h3>
                <p className="text-sm text-red-700">
                  Please copy and store this API key securely. You will not be able to see it again for security reasons.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 relative">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">Your API Key</label>
              <button
                onClick={() => setShowKey(!showKey)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showKey ? (
                  <EyeSlashIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </button>
            </div>
            <div className="font-mono text-sm break-all bg-white p-3 rounded-lg border">
              {showKey ? apiKey : maskedKey}
            </div>
            <button
              onClick={handleCopy}
              className="absolute top-4 right-4 flex items-center px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
            >
              <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
              {copyText}
            </button>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg"
            >
              Got it, Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Page Component ---
const ApiKeysPage: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<'closed' | 'creating' | 'showingKey'>('closed');
  const [generatedKey, setGeneratedKey] = useState<string>('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchApiKeys = useCallback(async (page: number = 1, pageLimit: number = 10) => {
    try {
      setLoading(true);
      const response = await api.get(`/v1/api-keys?page=${page}&limit=${pageLimit}`);
      

      // Update data based on your API response structure
      setApiKeys(response.data.api_keys);
      setCurrentPage(response.data?.pagination.page);
      setLimit(response.data?.pagination.limit);
      setTotal(response.data?.pagination.total);
      setTotalPages(response.data?.pagination.total_pages);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch API keys.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApiKeys(currentPage, limit);
  }, [fetchApiKeys, currentPage, limit]);

  const handleKeyCreated = (newKey: string) => {
    setGeneratedKey(newKey);
    setModalState('showingKey');
    fetchApiKeys(currentPage, limit);
  };

  const handleCloseModals = () => {
    setModalState('closed');
    setGeneratedKey('');
  };

  const handleRevokeKey = async (keyId: string, keyName: string) => {
    if (!window.confirm(`Are you sure you want to revoke "${keyName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      setApiKeys(prevKeys => prevKeys.filter(key => key.id !== keyId));
      await api.delete(`/v1/api-keys/${keyId}`);

      // Refresh data after deletion
      fetchApiKeys(currentPage, limit);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to revoke API key.');
      fetchApiKeys(currentPage, limit);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1); // Reset to first page when changing limit
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Function to mask API key ID for secure display
  const maskKeyId = (keyId: string) => {
    if (!keyId || keyId.length < 8) return keyId;
    
    // Show first 4 and last 4 characters, mask the middle part
    const firstPart = keyId.substring(0, 4);
    const lastPart = keyId.substring(keyId.length - 4);
    const maskLength = Math.min(keyId.length - 8, 12); // Limit mask to reasonable length
    const mask = '•'.repeat(maskLength);
    
    return `${firstPart}${mask}${lastPart}`;
  };

  // Generate pagination buttons
  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    buttons.push(
      <button
        key="prev"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-3 py-2 mx-1 rounded-lg text-sm font-medium transition-all ${currentPage === 1
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
          }`}
      >
        Previous
      </button>
    );

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 mx-1 rounded-lg text-sm font-medium transition-all ${currentPage === i
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
        >
          {i}
        </button>
      );
    }

    // Next button
    buttons.push(
      <button
        key="next"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-3 py-2 mx-1 rounded-lg text-sm font-medium transition-all ${currentPage === totalPages
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
          }`}
      >
        Next
      </button>
    );

    return buttons;
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="p-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">API Keys</h1>
                <p className="text-gray-600">Manage your API keys to authenticate requests to our services.</p>
              </div>
              <button
                onClick={() => setModalState('creating')}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create API Key
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your API keys...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-3" />
                <div>
                  <h3 className="font-semibold text-red-800">Error Loading API Keys</h3>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          {!loading && !error && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                      <KeyIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{total}</h3>
                      <p className="text-gray-600">Total Keys</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                      <ShieldCheckIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{apiKeys?.filter((key:any) => key?.last_used).length || 0}</h3>
                      <p className="text-gray-600">Active Keys</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                      <ClockIcon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{apiKeys?.filter((key:any) => !key?.last_used).length || 0}</h3>
                      <p className="text-gray-600">Unused Keys</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls */}
              {
                apiKeys && apiKeys.length > 0 && (
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">
                        Showing {apiKeys.length > 0 ? ((currentPage - 1) * limit + 1) : 0} to {Math.min(currentPage * limit, total)} of {total} entries
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <label htmlFor="limit" className="text-sm text-gray-600">Show:</label>
                      <select
                        id="limit"
                        value={limit}
                        onChange={(e) => handleLimitChange(Number(e.target.value))}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>
                      <span className="text-sm text-gray-600">entries</span>
                    </div>
                  </div>
                )
              }

              {/* API Keys Table */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {total === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <KeyIcon className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No API Keys Yet</h3>
                    <p className="text-gray-600 mb-6">Get started by creating your first API key.</p>
                    <button
                      onClick={() => setModalState('creating')}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Create Your First API Key
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Your API Keys</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Key ID</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Used</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Expires</th>
                            <th className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {apiKeys && apiKeys.length > 0 && apiKeys.map((key:any) => (
                            <tr key={key.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                                    <KeyIcon className="h-4 w-4 text-white" />
                                  </div>
                                  <span className="text-sm font-semibold text-gray-900">{key.name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center group">
                                  <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-700 border">
                                    {maskKeyId(key.id)}
                                  </code>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(key.id);
                                      toast.success('Key ID copied to clipboard!');
                                      // Optional: Add toast notification here
                                    }}
                                    className="ml-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all opacity-0 group-hover:opacity-100"
                                    title="Copy full Key ID"
                                  >
                                    <ClipboardIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm text-gray-600 max-w-xs truncate block">
                                  {key.description || <em className="text-gray-400">No description</em>}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center text-sm text-gray-600">
                                  <CalendarIcon className="h-4 w-4 mr-1" />
                                  {formatDate(key.created_at)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {key.last_used ? (
                                  <div className="flex items-center">
                                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                                    <span className="text-sm text-gray-600">{formatDate(key.last_used)}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center">
                                    <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
                                    <span className="text-sm text-gray-500">Never used</span>
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {key.expires_at ? (
                                  <span className="text-sm text-gray-600">{formatDate(key.expires_at)}</span>
                                ) : (
                                  <span className="text-sm text-gray-500">Never expires</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <button
                                  onClick={() => handleRevokeKey(key.id, key.name)}
                                  className="inline-flex items-center px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all font-medium"
                                >
                                  <TrashIcon className="h-4 w-4 mr-1" />
                                  Revoke
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <div className="flex items-center justify-center">
                          <div className="flex items-center">
                            {renderPaginationButtons()}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modals */}
        <CreateKeyModal
          isOpen={modalState === 'creating'}
          onClose={handleCloseModals}
          onSuccess={handleKeyCreated}
        />

        <ShowKeyModal
          isOpen={modalState === 'showingKey'}
          onClose={handleCloseModals}
          apiKey={generatedKey}
        />
      </div>
    </DashboardLayout>
  );
};

export default ApiKeysPage;