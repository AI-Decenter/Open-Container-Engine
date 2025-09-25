import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, TestTube, Globe, CheckCircle, XCircle, AlertCircle } from '../components/icons';
import { webhookService } from '../services/webhookService';
import DashboardLayout from '../components/Layout/DashboardLayout';

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateWebhookRequest {
  name: string;
  url: string;
  events: string[];
  secret?: string;
  is_active: boolean;
}

const WEBHOOK_EVENTS = [
  { value: 'deployment_started', label: 'Deployment Started', description: 'When a deployment begins' },
  { value: 'deployment_completed', label: 'Deployment Completed', description: 'When a deployment finishes successfully' },
  { value: 'deployment_failed', label: 'Deployment Failed', description: 'When a deployment fails' },
  { value: 'deployment_deleted', label: 'Deployment Deleted', description: 'When a deployment is deleted' },
  { value: 'all', label: 'All Events', description: 'Subscribe to all webhook events' },
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
    
  // Create/Edit form state
  const [formData, setFormData] = useState<CreateWebhookRequest>({
    name: '',
    url: '',
    events: [],
    secret: '',
    is_active: true,
  });

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      const response = await webhookService.listWebhooks();
      setWebhooks(response.data || []);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWebhook = async () => {
    setValidationErrors({});
    try {
      await webhookService.createWebhook(formData);
      await loadWebhooks();
      setShowCreateModal(false);
      resetForm();
    } catch (err: any) {
      if (err?.response?.data?.errors) {
        setValidationErrors(err.response.data.errors);
      } else {
        setError(err?.response?.data?.message || err.message || 'Failed to create webhook');
      }
      setShowCreateModal(false); // Always close modal on error
    }
  };
  const handleUpdateWebhook = async () => {
    if (!editingWebhook) return;
    setValidationErrors({});
    try {
      await webhookService.updateWebhook(editingWebhook.id, formData);
      await loadWebhooks();
      setEditingWebhook(null);
      resetForm();
    } catch (err: any) {
      const errors = err?.response?.data?.errors || err?.response?.data?.error || {};
      if (typeof errors === 'object' && Object.keys(errors).length > 0) {
        // Show all validation errors as a single string in the global error alert
        setError(Object.values(errors).join(' | '));
      } else {
        setError(
          err?.response?.data?.message ||
          err?.response?.data?.error?.message ||
          err.message ||
          'Failed to update webhook'
        );
      }
      setEditingWebhook(null); // Always close modal on error
      setValidationErrors({}); // Clear modal field errors
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;
    
    try {
      await webhookService.deleteWebhook(id);
      await loadWebhooks();
    } catch (err: any) {
      setError(err.message || 'Failed to delete webhook');
    }
  };

  const handleTestWebhook = async (id: string) => {
    try {
      setTestingWebhook(id);
      await webhookService.testWebhook(id);
      alert('Test webhook sent successfully!');
    } catch (err: any) {
      alert('Failed to send test webhook: ' + (err.message || 'Unknown error'));
    } finally {
      setTestingWebhook(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      events: [],
      secret: '',
      is_active: true,
    });
  };

  const openEditModal = (webhook: Webhook) => {
    setEditingWebhook(webhook);
    setFormData({
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      secret: '', // Don't pre-fill secret for security
      is_active: webhook.is_active,
    });
  };

  const handleEventToggle = (eventValue: string) => {
    if (eventValue === 'all') {
      // If selecting "All Events", clear other events
      setFormData(prev => ({
        ...prev,
        events: prev.events.includes('all') ? [] : ['all']
      }));
    } else {
      // If selecting specific event, remove "All Events" if present
      setFormData(prev => ({
        ...prev,
        events: prev.events.includes(eventValue)
          ? prev.events.filter(e => e !== eventValue)
          : [...prev.events.filter(e => e !== 'all'), eventValue]
      }));
    }
  };

  const getEventLabel = (event: string) => {
    const eventInfo = WEBHOOK_EVENTS.find(e => e.value === event);
    return eventInfo?.label || event;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading webhooks...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
  <div className="max-w-6xl mx-auto px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 w-full">
        {/* Header */}
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-3 sm:gap-0">
          <div className="w-full sm:w-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Webhooks</h1>
            <p className="mt-1 sm:mt-2 text-gray-600 text-sm sm:text-base">Manage your deployment notification webhooks</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-2 sm:px-4 py-1.5 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 max-w-[200px] min-w-0 flex-wrap truncate"
          >
            <Plus className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="truncate">Create Webhook</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-sm text-red-600 hover:text-red-500"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Webhooks List */}
  <div className="bg-white shadow rounded-lg overflow-x-auto w-full">
          {webhooks.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No webhooks</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new webhook.</p>
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Webhook
                </button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 min-w-[250px] sm:min-w-0">
              {webhooks.map((webhook) => (
                <li key={webhook.id} className="p-3 sm:p-4 text-xs sm:text-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start sm:items-center flex-col sm:flex-row">
                        <div className="flex-shrink-0">
                          {webhook.is_active ? (
                            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                          )}
                        </div>
                        <div className="ml-0 sm:ml-4 flex-1 min-w-0 mt-1 sm:mt-0">
                          <div className="flex flex-col sm:flex-row sm:items-center">
                            <h3 className="font-medium text-gray-900 truncate max-w-[120px] xs:max-w-[160px] sm:max-w-xs md:max-w-md lg:max-w-lg xl:max-w-2xl">
                              {webhook.name}
                            </h3>
                            <span className={`mt-1 sm:mt-0 sm:ml-2 px-2 py-1 text-xs rounded-full ${
                              webhook.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {webhook.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="mt-1">
                            <p className="break-all max-w-full whitespace-pre-line text-xs sm:text-sm" style={{wordBreak: 'break-all'}}>
                              {webhook.url}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500">
                              Events: {webhook.events.map(getEventLabel).join(', ')}
                            </p>
                            <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                              Created: {new Date(webhook.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row flex-wrap items-center gap-1 sm:gap-2 mt-2 sm:mt-0 sm:ml-4">
                      <button
                        onClick={() => handleTestWebhook(webhook.id)}
                        disabled={testingWebhook === webhook.id}
                        className="inline-flex items-center px-2 sm:px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <TestTube className="h-3 w-3 mr-1" />
                        {testingWebhook === webhook.id ? 'Testing...' : 'Test'}
                      </button>
                      <button
                        onClick={() => openEditModal(webhook)}
                        className="inline-flex items-center px-2 sm:px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteWebhook(webhook.id)}
                        className="inline-flex items-center px-2 sm:px-3 py-1 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Create/Edit Modal */}
        {(showCreateModal || editingWebhook) && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-2 xs:p-3 sm:p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-xs xs:max-w-sm sm:max-w-md">
              <div className="px-3 xs:px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">
                  {editingWebhook ? 'Edit Webhook' : 'Create Webhook'}
                </h3>
              </div>
              <div className="px-3 xs:px-4 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4">
                {/* Name Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Webhook Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My Webhook"
                    className={`w-full px-3 py-2 border ${validationErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    required
                  />
                  {validationErrors.name && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.name}</p>
                  )}
                </div>

                {/* URL Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Webhook URL *
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://your-domain.com/webhook"
                    className={`w-full px-3 py-2 border ${validationErrors.url ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    required
                  />
                  {validationErrors.url && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.url}</p>
                  )}
                </div>

                {/* Secret Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Secret (Optional)
                  </label>
                  <input
                    type="password"
                    value={formData.secret}
                    onChange={(e) => setFormData(prev => ({ ...prev, secret: e.target.value }))}
                    placeholder="Enter webhook secret for HMAC validation"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Events Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Events *
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {WEBHOOK_EVENTS.map((event) => (
                      <label key={event.value} className="flex items-start">
                        <input
                          type="checkbox"
                          checked={formData.events.includes(event.value)}
                          onChange={() => handleEventToggle(event.value)}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="ml-3">
                          <span className="text-sm font-medium text-gray-700">{event.label}</span>
                          <p className="text-xs text-gray-500">{event.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  {validationErrors.events && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.events}</p>
                  )}
                </div>

                {/* Active Status */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                    Active
                  </label>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingWebhook(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={editingWebhook ? handleUpdateWebhook : handleCreateWebhook}
                  disabled={!formData.name || !formData.url || formData.events.length === 0}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingWebhook ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
