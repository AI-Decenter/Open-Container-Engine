// src/pages/FeaturesPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  RocketLaunchIcon, 
  ShieldCheckIcon, 
  ClockIcon, 
  CloudIcon,
  CpuChipIcon,
  GlobeAltIcon,
  ChartBarIcon,
  CogIcon,
  KeyIcon,
  ServerIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ArrowPathIcon,
  BoltIcon,
  LockClosedIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const FeaturesPage: React.FC = () => {
  const mainFeatures = [
    {
      icon: RocketLaunchIcon,
      title: 'Deploy in Seconds',
      description: 'Go from container image to live URL with a single API call. No YAML files, no kubectl commands.',
      benefits: ['Single API call deployment', 'Auto-generated secure URLs', 'Zero configuration required']
    },
    {
      icon: ShieldCheckIcon,
      title: 'Enterprise Security',
      description: 'Built-in security with container isolation, automatic HTTPS, and secure environment variable management.',
      benefits: ['Full container isolation', 'Automatic SSL/TLS certificates', 'Encrypted environment variables']
    },
    {
      icon: CloudIcon,
      title: 'Auto-Scaling',
      description: 'Automatically scale your applications based on traffic with intelligent load balancing.',
      benefits: ['Horizontal auto-scaling', 'Load balancing', 'Zero downtime updates']
    },
    {
      icon: CpuChipIcon,
      title: 'High Performance',
      description: 'Built with Rust & Axum for maximum performance and reliability with minimal resource usage.',
      benefits: ['Memory-safe Rust backend', 'Ultra-fast response times', 'Efficient resource utilization']
    }
  ];

  const detailedFeatures = [
    {
      category: 'User Management',
      icon: UserGroupIcon,
      color: 'from-blue-500 to-indigo-600',
      features: [
        {
          icon: KeyIcon,
          title: 'Complete Authentication System',
          description: 'User registration, login, JWT tokens, and session management with secure password hashing.'
        },
        {
          icon: CogIcon,
          title: 'API Key Management',
          description: 'Generate, manage, and revoke API keys for programmatic access with fine-grained permissions.'
        },
        {
          icon: UserGroupIcon,
          title: 'User Dashboard',
          description: 'Comprehensive web interface for managing deployments, viewing usage, and account settings.'
        }
      ]
    },
    {
      category: 'Container Management',
      icon: ServerIcon,
      color: 'from-green-500 to-emerald-600',
      features: [
        {
          icon: RocketLaunchIcon,
          title: 'One-Click Deployment',
          description: 'Deploy any Docker container with a single REST API call or through our intuitive web interface.'
        },
        {
          icon: ArrowPathIcon,
          title: 'Lifecycle Management',
          description: 'Complete CRUD operations for deployments with start, stop, update, and delete capabilities.'
        },
        {
          icon: GlobeAltIcon,
          title: 'Custom Domains',
          description: 'Map your own domain names to deployments with automatic SSL certificate provisioning.'
        }
      ]
    },
    {
      category: 'Monitoring & Observability',
      icon: ChartBarIcon,
      color: 'from-purple-500 to-pink-600',
      features: [
        {
          icon: DocumentTextIcon,
          title: 'Real-time Logs',
          description: 'Stream application logs in real-time with filtering and search capabilities via WebSocket.'
        },
        {
          icon: ChartBarIcon,
          title: 'Performance Metrics',
          description: 'Monitor CPU, memory, and request metrics with Prometheus integration and Grafana dashboards.'
        },
        {
          icon: ClockIcon,
          title: 'Health Monitoring',
          description: 'Automated health checks with configurable endpoints and failure recovery mechanisms.'
        }
      ]
    },
    {
      category: 'Infrastructure & Security',
      icon: LockClosedIcon,
      color: 'from-orange-500 to-red-600',
      features: [
        {
          icon: ShieldCheckIcon,
          title: 'Container Isolation',
          description: 'Each deployment runs in complete isolation with dedicated namespaces and security policies.'
        },
        {
          icon: LockClosedIcon,
          title: 'Automatic HTTPS',
          description: 'SSL certificates are automatically provisioned and renewed using industry-standard protocols.'
        },
        {
          icon: BoltIcon,
          title: 'Registry Support',
          description: 'Pull from public or private registries including Docker Hub, ECR, GCR, and GitHub Container Registry.'
        }
      ]
    }
  ];

  const technicalSpecs = [
    {
      title: 'Performance',
      specs: [
        'Sub-second deployment initiation',
        'Built with memory-safe Rust',
        'Horizontal auto-scaling',
        'Global CDN integration'
      ]
    },
    {
      title: 'Scalability',
      specs: [
        'Kubernetes orchestration',
        'Multi-cluster support',
        'Load balancing',
        '99.9% uptime SLA'
      ]
    },
    {
      title: 'Security',
      specs: [
        'JWT authentication',
        'API key management',
        'Container isolation',
        'Automatic SSL/TLS'
      ]
    },
    {
      title: 'Monitoring',
      specs: [
        'Real-time logs',
        'Prometheus metrics',
        'Health checks',
        'WebSocket events'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3">
                <img src="/open-container-engine-logo.png" alt="Open Container Engine" className="rounded-md w-6 h-6 object-contain filter drop-shadow-sm" />
              <span className="text-xl font-bold text-gray-900">Container Engine</span>
            </Link>
            <div className="flex items-center space-x-6">
              <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                Home
              </Link>
              <Link to="/auth" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Get Started
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-8">
            <span className="block">Revolutionary</span>
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Container Deployment
            </span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 max-w-4xl mx-auto mb-12">
            Experience the future of containerized application deployment with our 
            <span className="font-bold text-blue-600"> open-source alternative to Google Cloud Run</span>
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
            <Link
              to="/auth"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              Start Free Trial
            </Link>
            <a
              href="https://github.com/AI-Decenter/Open-Container-Engine"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-xl text-lg hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Core Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to deploy, manage, and scale containerized applications with confidence
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {mainFeatures.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                    <p className="text-gray-600 mb-4 text-lg leading-relaxed">{feature.description}</p>
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-700">
                          <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Features by Category */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Complete Feature Set</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive tools and capabilities organized by functionality
            </p>
          </div>

          <div className="space-y-16">
            {detailedFeatures.map((category, index) => (
              <div key={index} className="bg-white rounded-3xl shadow-xl p-8 lg:p-12">
                <div className="flex items-center mb-8">
                  <div className={`w-16 h-16 bg-gradient-to-r ${category.color} rounded-2xl flex items-center justify-center mr-6`}>
                    <category.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900">{category.category}</h3>
                </div>
                
                <div className="grid md:grid-cols-3 gap-8">
                  {category.features.map((feature, idx) => (
                    <div key={idx} className="group">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mr-4 group-hover:bg-blue-100 transition-colors">
                          <feature.icon className="h-6 w-6 text-gray-600 group-hover:text-blue-600 transition-colors" />
                        </div>
                        <h4 className="text-xl font-semibold text-gray-900">{feature.title}</h4>
                      </div>
                      <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Specifications */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Technical Specifications</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built with cutting-edge technology for enterprise-grade performance and reliability
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {technicalSpecs.map((spec, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">{spec.title}</h3>
                <ul className="space-y-3">
                  {spec.specs.map((item, idx) => (
                    <li key={idx} className="flex items-center text-sm text-gray-700">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Ready to Experience the Future?
          </h2>
          <p className="text-xl lg:text-2xl mb-12 opacity-90">
            Join thousands of developers who have simplified their deployment process
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
            <Link
              to="/auth"
              className="px-10 py-5 bg-white text-blue-600 font-bold rounded-xl text-xl hover:bg-gray-100 transition-all duration-200 shadow-2xl transform hover:-translate-y-1"
            >
              Start Free Trial
            </Link>
            <a
              href="https://github.com/AI-Decenter/Open-Container-Engine"
              target="_blank"
              rel="noopener noreferrer"
              className="px-10 py-5 border-2 border-white text-white font-bold rounded-xl text-xl hover:bg-white hover:text-blue-600 transition-all duration-200"
            >
              View Source Code
            </a>
          </div>
          
          <p className="text-sm opacity-80 mt-8">
            Deploy your first container in under 60 seconds • No credit card required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 rounded-xl flex items-center justify-center">
                <img src="/open-container-engine-logo.png" alt="Open Container Engine" className="w-6 h-6 object-contain filter drop-shadow-sm" />
              </div>
              <span className="text-xl font-bold text-white">Container Engine</span>
            </div>
            <p className="text-gray-400 mb-6">
              The open-source alternative to Google Cloud Run
            </p>
            <div className="flex justify-center space-x-6">
              <Link to="/" className="text-gray-400 hover:text-white transition-colors">Home</Link>
              <Link to="/features" className="text-gray-400 hover:text-white transition-colors">Features</Link>
              <Link to="/documentation" className="text-gray-400 hover:text-white transition-colors">Documentation</Link>
              <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">Terms</Link>
            </div>
            <p className="text-sm text-gray-500 mt-8">
              &copy; {new Date().getFullYear()} Container Engine by Decenter.AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FeaturesPage;
