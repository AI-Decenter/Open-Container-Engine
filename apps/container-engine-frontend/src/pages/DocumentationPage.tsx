// src/pages/DocumentationPage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpenIcon,
  RocketLaunchIcon,
  CodeBracketIcon,
  CogIcon,
  KeyIcon,
  ServerIcon,
  DocumentTextIcon,
  ChevronRightIcon,
  ClipboardDocumentIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

const DocumentationPage: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: RocketLaunchIcon,
      description: 'Quick setup and your first deployment'
    },
    {
      id: 'authentication',
      title: 'Authentication',
      icon: KeyIcon,
      description: 'User accounts and API key management'
    },
    {
      id: 'api-reference',
      title: 'API Reference',
      icon: CodeBracketIcon,
      description: 'Complete API endpoint documentation'
    },
    {
      id: 'deployment-guide',
      title: 'Deployment Guide',
      icon: ServerIcon,
      description: 'Container deployment and management'
    },
    {
      id: 'examples',
      title: 'Examples',
      icon: DocumentTextIcon,
      description: 'Code examples and use cases'
    },
    {
      id: 'configuration',
      title: 'Configuration',
      icon: CogIcon,
      description: 'Advanced configuration options'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
                <img src="/open-container-engine-logo.png" alt="Open Container Engine" className="rounded-md w-4 h-4 sm:w-6 sm:h-6 object-contain filter drop-shadow-sm" />
              <span className="text-lg sm:text-xl font-bold text-gray-900">Container Engine</span>
            </Link>
            <div className="hidden sm:flex items-center space-x-4 lg:space-x-6">
              <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium transition-colors text-sm lg:text-base">
                Home
              </Link>
              <Link to="/features" className="text-gray-600 hover:text-blue-600 font-medium transition-colors text-sm lg:text-base">
                Features
              </Link>
              <Link to="/auth" className="px-3 py-1.5 lg:px-4 lg:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm lg:text-base">
                Get Started
              </Link>
            </div>
            {/* Mobile menu button */}
            <div className="sm:hidden">
              <Link to="/auth" className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
                Start
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
        <div className="grid lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6 lg:sticky lg:top-8">
              <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4 flex items-center">
                <BookOpenIcon className="h-4 w-4 lg:h-5 lg:w-5 mr-2 text-blue-600" />
                Documentation
              </h3>
              <nav className="space-y-1 lg:space-y-2">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex items-center px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors group"
                  >
                    <section.icon className="h-3 w-3 lg:h-4 lg:w-4 mr-2 lg:mr-3 text-gray-400 group-hover:text-blue-600 flex-shrink-0" />
                    <span className="truncate">{section.title}</span>
                    <ChevronRightIcon className="h-3 w-3 lg:h-4 lg:w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </a>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12 text-white">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 lg:mb-4">Documentation</h1>
                <p className="text-base sm:text-lg lg:text-xl text-blue-100">
                  Complete guide to deploying and managing containers with Container Engine
                </p>
              </div>

              <div className="p-4 sm:p-6 lg:p-8 space-y-8 lg:space-y-12">
                {/* Getting Started */}
                <section id="getting-started" className="scroll-mt-8">
                  <div className="flex items-center mb-4 lg:mb-6">
                    <RocketLaunchIcon className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600 mr-2 lg:mr-3" />
                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Getting Started</h2>
                  </div>
                  
                  <div className="prose max-w-none">
                    <p className="text-base lg:text-lg text-gray-600 mb-4 lg:mb-6">
                      Welcome to Container Engine! This guide will help you deploy your first containerized application in under 60 seconds.
                    </p>

                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 lg:p-6 mb-4 lg:mb-6">
                      <h4 className="text-base lg:text-lg font-semibold text-blue-900 mb-2">Prerequisites</h4>
                      <ul className="text-blue-800 space-y-1 text-sm lg:text-base">
                        <li>• A Docker image (public or private registry)</li>
                        <li>• Container Engine account (sign up for free)</li>
                        <li>• API key (generated from your dashboard)</li>
                      </ul>
                    </div>

                    <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-3 lg:mb-4">Quick Start Steps</h3>
                    <div className="grid gap-3 lg:gap-4 mb-4 lg:mb-6">
                      {[
                        { step: 1, title: 'Sign Up', description: 'Create your free Container Engine account' },
                        { step: 2, title: 'Get API Key', description: 'Generate an API key from your dashboard' },
                        { step: 3, title: 'Deploy Container', description: 'Make a single API call to deploy' },
                        { step: 4, title: 'Access Your App', description: 'Visit your auto-generated URL' }
                      ].map((item) => (
                        <div key={item.step} className="flex items-center p-3 lg:p-4 bg-gray-50 rounded-lg">
                          <div className="w-6 h-6 lg:w-8 lg:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-3 lg:mr-4 text-sm lg:text-base flex-shrink-0">
                            {item.step}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-gray-900 text-sm lg:text-base">{item.title}</h4>
                            <p className="text-gray-600 text-xs lg:text-sm">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Authentication */}
                <section id="authentication" className="scroll-mt-8">
                  <div className="flex items-center mb-4 lg:mb-6">
                    <KeyIcon className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600 mr-2 lg:mr-3" />
                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Authentication</h2>
                  </div>

                  <div className="space-y-4 lg:space-y-6">
                    <div>
                      <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-3 lg:mb-4">User Registration</h3>
                      <div className="bg-gray-900 rounded-lg p-3 lg:p-6 relative">
                        <button
                          onClick={() => copyToClipboard(`curl -X POST https://api.container-engine.app/v1/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "username": "your_username",
    "email": "your@email.com",
    "password": "secure_password",
    "confirmPassword": "secure_password"
  }'`, 'register')}
                          className="absolute top-2 right-2 lg:top-4 lg:right-4 p-1.5 lg:p-2 text-gray-400 hover:text-white transition-colors"
                        >
                          {copiedSection === 'register' ? (
                            <CheckIcon className="h-4 w-4 lg:h-5 lg:w-5 text-green-400" />
                          ) : (
                            <ClipboardDocumentIcon className="h-4 w-4 lg:h-5 lg:w-5" />
                          )}
                        </button>
                        <pre className="text-green-400 text-xs lg:text-sm overflow-x-auto">
{`curl -X POST https://api.container-engine.app/v1/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "username": "your_username",
    "email": "your@email.com",
    "password": "secure_password",
    "confirmPassword": "secure_password"
  }'`}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-3 lg:mb-4">API Key Generation</h3>
                      <div className="bg-gray-900 rounded-lg p-3 lg:p-6 relative">
                        <button
                          onClick={() => copyToClipboard(`curl -X POST https://api.container-engine.app/v1/api-keys \\
  -H "Authorization: Bearer <access-token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Production API Key",
    "description": "API key for production deployments"
  }'`, 'apikey')}
                          className="absolute top-2 right-2 lg:top-4 lg:right-4 p-1.5 lg:p-2 text-gray-400 hover:text-white transition-colors"
                        >
                          {copiedSection === 'apikey' ? (
                            <CheckIcon className="h-4 w-4 lg:h-5 lg:w-5 text-green-400" />
                          ) : (
                            <ClipboardDocumentIcon className="h-4 w-4 lg:h-5 lg:w-5" />
                          )}
                        </button>
                        <pre className="text-green-400 text-xs lg:text-sm overflow-x-auto">
{`curl -X POST https://api.container-engine.app/v1/api-keys \\
  -H "Authorization: Bearer <access-token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Production API Key",
    "description": "API key for production deployments"
  }'`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </section>

                {/* API Reference */}
                <section id="api-reference" className="scroll-mt-8">
                  <div className="flex items-center mb-4 lg:mb-6">
                    <CodeBracketIcon className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600 mr-2 lg:mr-3" />
                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">API Reference</h2>
                  </div>

                  <div className="space-y-4 lg:space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 lg:p-6">
                      <h3 className="text-base lg:text-lg font-semibold text-blue-900 mb-2">Base URL</h3>
                      <code className="text-blue-800 bg-blue-100 px-2 lg:px-3 py-1 rounded text-xs lg:text-sm break-all">
                        https://api.container-engine.app
                      </code>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 lg:gap-6">
                      {[
                        {
                          method: 'POST',
                          endpoint: '/v1/deployments',
                          description: 'Create a new deployment',
                          color: 'green'
                        },
                        {
                          method: 'GET',
                          endpoint: '/v1/deployments',
                          description: 'List all deployments',
                          color: 'blue'
                        },
                        {
                          method: 'GET',
                          endpoint: '/v1/deployments/{id}',
                          description: 'Get deployment details',
                          color: 'blue'
                        },
                        {
                          method: 'DELETE',
                          endpoint: '/v1/deployments/{id}',
                          description: 'Delete a deployment',
                          color: 'red'
                        }
                      ].map((api, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-3 lg:p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center mb-2 space-y-1 sm:space-y-0">
                            <span className={`px-2 py-1 text-xs font-bold rounded text-white bg-${api.color}-500 w-fit`}>
                              {api.method}
                            </span>
                            <code className="sm:ml-3 text-gray-700 text-xs lg:text-sm break-all">{api.endpoint}</code>
                          </div>
                          <p className="text-xs lg:text-sm text-gray-600">{api.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Deployment Guide */}
                <section id="deployment-guide" className="scroll-mt-8">
                  <div className="flex items-center mb-4 lg:mb-6">
                    <ServerIcon className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600 mr-2 lg:mr-3" />
                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Deployment Guide</h2>
                  </div>

                  <div>
                    <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-3 lg:mb-4">Deploy Your First Container</h3>
                    <div className="bg-gray-900 rounded-lg p-3 lg:p-6 relative">
                      <button
                        onClick={() => copyToClipboard(`curl -X POST https://api.container-engine.app/v1/deployments \\
  -H "Authorization: Bearer <your-api-key>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "appName": "hello-world",
    "image": "nginx:latest",
    "port": 80,
    "envVars": {
      "ENVIRONMENT": "production"
    },
    "replicas": 1
  }'`, 'deploy')}
                        className="absolute top-2 right-2 lg:top-4 lg:right-4 p-1.5 lg:p-2 text-gray-400 hover:text-white transition-colors"
                      >
                        {copiedSection === 'deploy' ? (
                          <CheckIcon className="h-4 w-4 lg:h-5 lg:w-5 text-green-400" />
                        ) : (
                          <ClipboardDocumentIcon className="h-4 w-4 lg:h-5 lg:w-5" />
                        )}
                      </button>
                      <pre className="text-green-400 text-xs lg:text-sm overflow-x-auto">
{`curl -X POST https://api.container-engine.app/v1/deployments \\
  -H "Authorization: Bearer <your-api-key>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "appName": "hello-world",
    "image": "nginx:latest",
    "port": 80,
    "envVars": {
      "ENVIRONMENT": "production"
    },
    "replicas": 1
  }'`}
                      </pre>
                    </div>

                    <div className="mt-4 lg:mt-6 p-4 lg:p-6 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="text-base lg:text-lg font-semibold text-green-900 mb-2">Success Response</h4>
                      <pre className="text-green-800 text-xs lg:text-sm overflow-x-auto">
{`{
  "id": "dpl-a1b2c3d4e5",
  "appName": "hello-world",
  "status": "pending",
  "url": "https://hello-world.container-engine.app",
  "message": "Deployment is being processed"
}`}
                      </pre>
                    </div>
                  </div>
                </section>

                {/* Examples */}
                <section id="examples" className="scroll-mt-8">
                  <div className="flex items-center mb-4 lg:mb-6">
                    <DocumentTextIcon className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600 mr-2 lg:mr-3" />
                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Examples</h2>
                  </div>

                  <div className="grid gap-4 lg:gap-6">
                    <div className="bg-gray-50 rounded-lg p-4 lg:p-6">
                      <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">Python Application</h3>
                      <div className="bg-gray-900 rounded-lg p-3 lg:p-4">
                        <pre className="text-green-400 text-xs lg:text-sm overflow-x-auto">
{`# Deploy a Python Flask app
{
  "appName": "my-python-app",
  "image": "python:3.9-slim",
  "port": 5000,
  "envVars": {
    "FLASK_ENV": "production",
    "DATABASE_URL": "postgresql://..."
  }
}`}
                        </pre>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 lg:p-6">
                      <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">Node.js Application</h3>
                      <div className="bg-gray-900 rounded-lg p-3 lg:p-4">
                        <pre className="text-green-400 text-xs lg:text-sm overflow-x-auto">
{`# Deploy a Node.js Express app
{
  "appName": "my-node-app",
  "image": "node:16-alpine",
  "port": 3000,
  "envVars": {
    "NODE_ENV": "production",
    "API_KEY": "your-api-key"
  },
  "replicas": 3
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Configuration */}
                <section id="configuration" className="scroll-mt-8">
                  <div className="flex items-center mb-4 lg:mb-6">
                    <CogIcon className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600 mr-2 lg:mr-3" />
                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Configuration</h2>
                  </div>

                  <div className="space-y-4 lg:space-y-6">
                    <div>
                      <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">Environment Variables</h3>
                      <p className="text-gray-600 mb-3 lg:mb-4 text-sm lg:text-base">
                        Configure your application using environment variables for maximum flexibility and security.
                      </p>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 lg:p-4">
                        <p className="text-yellow-800 text-xs lg:text-sm">
                          <strong>Security Note:</strong> Environment variables are encrypted at rest and in transit.
                          Avoid storing sensitive data in plain text.
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">Health Checks</h3>
                      <p className="text-gray-600 mb-3 lg:mb-4 text-sm lg:text-base">
                        Configure custom health check endpoints to ensure your application is running correctly.
                      </p>
                      <div className="bg-gray-900 rounded-lg p-3 lg:p-4">
                        <pre className="text-green-400 text-xs lg:text-sm overflow-x-auto">
{`{
  "healthCheck": {
    "path": "/health",
    "initialDelaySeconds": 30,
    "periodSeconds": 10,
    "timeoutSeconds": 5,
    "failureThreshold": 3
  }
}`}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">Resource Limits</h3>
                      <p className="text-gray-600 mb-3 lg:mb-4 text-sm lg:text-base">
                        Set CPU and memory limits to ensure optimal performance and cost management.
                      </p>
                      <div className="bg-gray-900 rounded-lg p-3 lg:p-4">
                        <pre className="text-green-400 text-xs lg:text-sm overflow-x-auto">
{`{
  "resources": {
    "cpu": "500m",      // 0.5 CPU cores
    "memory": "512Mi"   // 512 MB RAM
  }
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 lg:py-12 mt-12 lg:mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 lg:space-x-3 mb-3 lg:mb-4">
              <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 rounded-xl flex items-center justify-center">
                <img src="/open-container-engine-logo.png" alt="Open Container Engine" className="w-4 h-4 lg:w-6 lg:h-6 object-contain filter drop-shadow-sm" />
              </div>
              <span className="text-lg lg:text-xl font-bold text-white">Container Engine</span>
            </div>
            <p className="text-gray-400 mb-4 lg:mb-6 text-sm lg:text-base">
              The open-source alternative to Google Cloud Run
            </p>
            <div className="flex flex-wrap justify-center gap-3 lg:gap-6">
              <Link to="/" className="text-gray-400 hover:text-white transition-colors text-sm lg:text-base">Home</Link>
              <Link to="/features" className="text-gray-400 hover:text-white transition-colors text-sm lg:text-base">Features</Link>
              <Link to="/documentation" className="text-gray-400 hover:text-white transition-colors text-sm lg:text-base">Documentation</Link>
              <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm lg:text-base">Privacy</Link>
              <Link to="/terms" className="text-gray-400 hover:text-white transition-colors text-sm lg:text-base">Terms</Link>
            </div>
            <p className="text-xs lg:text-sm text-gray-500 mt-6 lg:mt-8">
              &copy; {new Date().getFullYear()} Container Engine by Decenter.AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DocumentationPage;
