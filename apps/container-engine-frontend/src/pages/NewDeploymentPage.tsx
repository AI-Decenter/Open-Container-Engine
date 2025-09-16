// src/pages/NewDeploymentPage.tsx
import React, { useState } from 'react';
import api from '../lib/api';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import {
  RocketLaunchIcon,
  CubeIcon,
  ServerIcon,
  Cog6ToothIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  CloudIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const NewDeploymentPage: React.FC = () => {
  const navigate = useNavigate();
  const [app_name, setapp_name] = useState('');
  const [image, setImage] = useState('');
  const [port, setPort] = useState(80);
  const [envVars, setEnvVars] = useState([{ key: '', value: '' }]);
  const [replicas, setReplicas] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleEnvVarChange = (index: number, field: 'key' | 'value', value: string) => {
    const newEnvVars = [...envVars];
    newEnvVars[index] = { ...newEnvVars[index], [field]: value };
    setEnvVars(newEnvVars);
  };

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '' }]);
  };

  const removeEnvVar = (index: number) => {
    const newEnvVars = envVars.filter((_, i) => i !== index);
    setEnvVars(newEnvVars);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formattedEnvVars = envVars.reduce((acc: { [key: string]: string }, env) => {
      if (env.key && env.value) {
        acc[env.key] = env.value;
      }
      return acc;
    }, {});

    try {
      const response = await api.post('/v1/deployments', {
        app_name,
        image,
        port,
        envVars: formattedEnvVars,
        replicas,
      });
      setSuccess(`Deployment '${response.data.app_name}' created! URL: ${response.data.url}`);
      if(response.data.id){
        navigate(`/deployments/${response.data.id}`); 
      }
    } catch (err: any) {
      setError(err.response?.data || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="p-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/deployments')}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-200 text-gray-600 hover:text-blue-600"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
                    <RocketLaunchIcon className="h-10 w-10 text-blue-600 mr-3" />
                    Create New Deployment
                  </h1>
                  <p className="text-gray-600">Deploy your application to the cloud with just a few clicks</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* Form Header */}
              <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <CloudIcon className="h-6 w-6 mr-3" />
                  Deployment Configuration
                </h2>
                <p className="text-blue-100 mt-2">Configure your application settings below</p>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-8">
                {/* Basic Configuration Section */}
                <div className="space-y-6">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                      <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Basic Configuration</h3>
                      <p className="text-gray-600">Essential settings for your deployment</p>
                    </div>
                  </div>

                  {/* App Name */}
                  <div className="space-y-2">
                    <label htmlFor="app_name" className="block text-sm font-semibold text-gray-700">
                      Application Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="app_name"
                        value={app_name}
                        onChange={(e) => setapp_name(e.target.value)}
                        required
                        className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                        placeholder="my-awesome-app"
                      />
                      <CubeIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500 flex items-center">
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      A unique name for your application
                    </p>
                  </div>

                  {/* Container Image */}
                  <div className="space-y-2">
                    <label htmlFor="image" className="block text-sm font-semibold text-gray-700">
                      Container Image *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="image"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        required
                        className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                        placeholder="nginx:latest or your-registry/your-image:tag"
                      />
                      <CubeIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500">Docker image from Docker Hub or your private registry</p>
                  </div>
                </div>

                {/* Resource Configuration */}
                <div className="border-t border-gray-200 pt-8">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                      <ServerIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Resource Configuration</h3>
                      <p className="text-gray-600">Define port and scaling settings</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Port */}
                    <div className="space-y-2">
                      <label htmlFor="port" className="block text-sm font-semibold text-gray-700">
                        Application Port *
                      </label>
                      <input
                        type="number"
                        id="port"
                        value={port}
                        onChange={(e) => setPort(Number(e.target.value))}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                        placeholder="80"
                      />
                      <p className="text-xs text-gray-500">Port your application listens on inside the container</p>
                    </div>

                    {/* Replicas */}
                    <div className="space-y-2">
                      <label htmlFor="replicas" className="block text-sm font-semibold text-gray-700">
                        Number of Replicas *
                      </label>
                      <input
                        type="number"
                        id="replicas"
                        value={replicas}
                        onChange={(e) => setReplicas(Number(e.target.value))}
                        required
                        min="1"
                        max="10"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                        placeholder="1"
                      />
                      <p className="text-xs text-gray-500">Number of instances to run (1-10)</p>
                    </div>
                  </div>
                </div>

                {/* Environment Variables Section */}
                <div className="border-t border-gray-200 pt-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                        <Cog6ToothIcon className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Environment Variables</h3>
                        <p className="text-gray-600">Configure your application environment</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {envVars.map((env, index) => (
                      <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="ENVIRONMENT_KEY"
                            value={env.key}
                            onChange={(e) => handleEnvVarChange(index, 'key', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-mono text-sm"
                          />
                        </div>
                        <div className="text-gray-400 font-bold">=</div>
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="environment_value"
                            value={env.value}
                            onChange={(e) => handleEnvVarChange(index, 'value', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-mono text-sm"
                          />
                        </div>
                        {envVars.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEnvVar(index)}
                            className="flex items-center justify-center w-10 h-10 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addEnvVar}
                    className="mt-4 w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 text-gray-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 rounded-xl transition-all font-medium"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Environment Variable
                  </button>
                </div>

                {/* Status Messages */}
                {error && (
                  <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-xl">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-3" />
                    <div>
                      <h4 className="font-semibold text-red-800">Deployment Failed</h4>
                      <p className="text-red-700">{error}</p>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3" />
                    <div>
                      <h4 className="font-semibold text-green-800">Deployment Successful</h4>
                      <p className="text-green-700">{success}</p>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="border-t border-gray-200 pt-8">
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => navigate('/deployments')}
                      className="px-8 py-3 border border-gray-300 rounded-xl text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium flex items-center"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                          Deploying...
                        </>
                      ) : (
                        <>
                          <RocketLaunchIcon className="h-5 w-5 mr-2" />
                          Deploy Application
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Tips Section */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <CubeIcon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Container Images</h3>
                <p className="text-gray-600 text-sm">Use official images from Docker Hub or your private registry for best security and performance.</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <ServerIcon className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Scaling</h3>
                <p className="text-gray-600 text-sm">Start with 1 replica and scale up based on your application's load requirements.</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <Cog6ToothIcon className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Environment</h3>
                <p className="text-gray-600 text-sm">Use environment variables for configuration instead of hardcoding values in your application.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NewDeploymentPage;