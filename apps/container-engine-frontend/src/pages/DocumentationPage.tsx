// src/pages/DocumentationPage.tsx
import React, { useState, useEffect } from 'react';
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
  CheckIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon,
  ShieldCheckIcon,
  BoltIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

const DocumentationPage: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('getting-started');

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['getting-started', 'authentication', 'api-reference', 'deployment-guide', 'examples', 'configuration'];
      const scrollPosition = window.scrollY + 100;

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      {/* Modern Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-gray-200/60 shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-18">
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg blur-sm opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <img src="/open-container-engine-logo.png" alt="Container Engine" className="relative rounded-lg w-8 h-8 sm:w-10 sm:h-10 object-cover shadow-md" />
              </div>
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Container Engine
              </span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
              <Link to="/" className="px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50/80 rounded-lg font-medium transition-all duration-200 text-sm lg:text-base">
                Home
              </Link>
              <Link to="/features" className="px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50/80 rounded-lg font-medium transition-all duration-200 text-sm lg:text-base">
                Features
              </Link>
              <span className="px-3 py-2 text-blue-600 bg-blue-50 rounded-lg font-semibold text-sm lg:text-base border border-blue-200">
                Documentation
              </span>
              <Link to="/auth" className="ml-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold text-sm lg:text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Get Started
              </Link>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-2">
              <Link to="/auth" className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold text-sm shadow-md">
                Start
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="h-5 w-5" />
                ) : (
                  <Bars3Icon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          
          {/* Mobile menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200/60 bg-white/95 backdrop-blur-sm">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <Link to="/" className="block px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors">
                  Home
                </Link>
                <Link to="/features" className="block px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors">
                  Features
                </Link>
                <span className="block px-3 py-2 text-blue-600 bg-blue-50 rounded-lg font-semibold">
                  Documentation
                </span>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section - Mobile Optimized */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-20">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4 sm:mb-6">
              <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1.5 sm:px-4 sm:py-2 border border-blue-200/50 shadow-lg">
                <BookOpenIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                <span className="text-xs sm:text-sm font-semibold text-blue-600">Documentation</span>
              </div>
            </div>
            <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent leading-tight">
              Developer Documentation
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto mb-6 sm:mb-8 leading-relaxed px-2">
              Complete guide to deploying and managing containers with Container Engine.
              <br className="hidden sm:block" />
              From quick start to advanced configurations.
            </p>
            <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
              <a href="#getting-started" className="group w-full xs:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center text-sm sm:text-base">
                <RocketLaunchIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 group-hover:scale-110 transition-transform" />
                Quick Start Guide
              </a>
              <a href="#api-reference" className="w-full xs:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-white/80 backdrop-blur-sm text-gray-700 rounded-lg sm:rounded-xl hover:bg-white hover:shadow-lg transition-all duration-200 font-semibold border border-gray-200/50 flex items-center justify-center text-sm sm:text-base">
                <CodeBracketIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                API Reference
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-12">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8 xl:gap-12">
          {/* Enhanced Sidebar Navigation - Mobile Optimized */}
          <div className="xl:col-span-1 order-2 xl:order-1">
            {/* Mobile: Horizontal scrolling navigation */}
            <div className="xl:hidden mb-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center px-2">
                <BookOpenIcon className="h-5 w-5 mr-3 text-blue-600" />
                Contents
              </h3>
              <div className="flex overflow-x-auto pb-4 space-x-3 px-2">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className={`flex-none flex items-center px-3 py-2 text-xs rounded-lg transition-all duration-200 whitespace-nowrap ${
                      activeSection === section.id 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
                        : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-blue-600 border border-gray-200'
                    }`}
                  >
                    <section.icon className="h-3 w-3 mr-2 flex-shrink-0" />
                    <span className="font-medium">{section.title}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Desktop: Sticky sidebar */}
            <div className="hidden xl:block bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 xl:sticky xl:top-24">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
                <BookOpenIcon className="h-5 w-5 mr-3 text-blue-600" />
                Contents
              </h3>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className={`flex items-center px-4 py-3 text-sm rounded-xl transition-all duration-200 group ${
                      activeSection === section.id 
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-l-4 border-blue-500 font-semibold shadow-sm' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                    }`}
                  >
                    <section.icon className={`h-4 w-4 mr-3 flex-shrink-0 transition-all duration-200 ${
                      activeSection === section.id ? 'text-blue-600 scale-110' : 'text-gray-400 group-hover:text-blue-600'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <span className="block font-medium">{section.title}</span>
                      <span className="text-xs text-gray-500 group-hover:text-gray-600">{section.description}</span>
                    </div>
                    <ChevronRightIcon className={`h-4 w-4 ml-2 transition-all duration-200 ${
                      activeSection === section.id ? 'opacity-100 rotate-90' : 'opacity-0 group-hover:opacity-100'
                    }`} />
                  </a>
                ))}
              </nav>
              
              {/* Quick Actions */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h4>
                <div className="space-y-2">
                  <Link to="/auth" className="flex items-center px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-medium shadow-md hover:shadow-lg">
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    Get Started
                  </Link>
                  <a href="#api-reference" className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                    <CodeBracketIcon className="h-4 w-4 mr-2" />
                    View API
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Mobile Optimized */}
          <div className="xl:col-span-4 order-1 xl:order-2">
            <div className="space-y-6 sm:space-y-8 lg:space-y-12">
                {/* Getting Started - Mobile Optimized */}
                <section id="getting-started" className="scroll-mt-16 sm:scroll-mt-20 lg:scroll-mt-24">
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden mx-2 sm:mx-0">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                      <div className="flex items-center text-white">
                        <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl mr-3 sm:mr-4 flex-shrink-0">
                          <RocketLaunchIcon className="h-6 w-6 sm:h-8 sm:w-8" />
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold mb-1 sm:mb-2 leading-tight">Getting Started</h2>
                          <p className="text-blue-100 text-sm sm:text-base lg:text-lg leading-snug">Deploy your first container in under 60 seconds</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                        {/* Prerequisites */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-blue-200/50">
                          <div className="flex items-center mb-3 sm:mb-4">
                            <ShieldCheckIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mr-2 sm:mr-3 flex-shrink-0" />
                            <h3 className="text-base sm:text-lg font-bold text-blue-900">Prerequisites</h3>
                          </div>
                          <ul className="space-y-2 sm:space-y-3">
                            {[
                              'Docker image (public or private)',
                              'Container Engine account',
                              'API key from dashboard'
                            ].map((item, index) => (
                              <li key={index} className="flex items-center text-blue-800 text-sm sm:text-base">
                                <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mr-2 sm:mr-3 flex-shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Benefits */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-green-200/50">
                          <div className="flex items-center mb-3 sm:mb-4">
                            <BoltIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mr-2 sm:mr-3 flex-shrink-0" />
                            <h3 className="text-base sm:text-lg font-bold text-green-900">Why Container Engine?</h3>
                          </div>
                          <ul className="space-y-2 sm:space-y-3">
                            {[
                              'Deploy in seconds, not minutes',
                              'Auto-scaling & load balancing',
                              'Built-in monitoring & logs'
                            ].map((item, index) => (
                              <li key={index} className="flex items-center text-green-800 text-sm sm:text-base">
                                <SparklesIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mr-2 sm:mr-3 flex-shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Quick Start Steps - Mobile Optimized */}
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
                          <GlobeAltIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mr-2 sm:mr-3 flex-shrink-0" />
                          <span className="leading-tight">4-Step Deployment Process</span>
                        </h3>
                        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                          {[
                            { 
                              step: 1, 
                              title: 'Sign Up', 
                              description: 'Create your free account',
                              icon: '👤',
                              color: 'from-blue-500 to-blue-600'
                            },
                            { 
                              step: 2, 
                              title: 'Get API Key', 
                              description: 'Generate ',
                              icon: '🔑',
                              color: 'from-indigo-500 to-indigo-600'
                            },
                            { 
                              step: 3, 
                              title: 'Deploy Container', 
                              description: 'Single API call',
                              icon: '🚀',
                              color: 'from-purple-500 to-purple-600'
                            },
                            { 
                              step: 4, 
                              title: 'Access Your App', 
                              description: 'Visit generated URL',
                              icon: '🌐',
                              color: 'from-green-500 to-green-600'
                            }
                          ].map((item) => (
                            <div key={item.step} className="group relative">
                              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r ${item.color} rounded-xl flex items-center justify-center text-white font-bold text-base sm:text-lg mb-3 sm:mb-4 mx-auto shadow-lg`}>
                                  <span className="text-lg sm:text-2xl">{item.icon}</span>
                                </div>
                                <div className="text-center">
                                  <h4 className="font-bold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base leading-tight">{item.title}</h4>
                                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{item.description}</p>
                                </div>
                              </div>
                              {item.step < 4 && (
                                <div className="hidden lg:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                                  <ChevronRightIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-300" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Authentication */}
                <section id="authentication" className="scroll-mt-24">
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 sm:px-8 py-8">
                      <div className="flex items-center text-white">
                        <div className="p-3 bg-white/20 rounded-xl mr-4">
                          <KeyIcon className="h-8 w-8" />
                        </div>
                        <div>
                          <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold mb-2 leading-tight">Authentication</h2>
                          <p className="text-indigo-100 text-lg">Secure API access with JWT tokens and API keys</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
                      {/* User Registration */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-gray-900 flex items-center">
                            <span className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm mr-3">1</span>
                            User Registration
                          </h3>
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">POST</span>
                        </div>
                        
                        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl overflow-hidden shadow-lg">
                          <div className="flex items-center justify-between p-4 bg-gray-800/50">
                            <div className="flex items-center space-x-3">
                              <div className="flex space-x-1">
                                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                              </div>
                              <span className="text-gray-300 text-sm font-medium">curl</span>
                            </div>
                            <button
                              onClick={() => copyToClipboard(`curl -X POST https://decenter.run/v1/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "username": "your_username",
    "email": "your@email.com",
    "password": "secure_password",
    "confirm_password": "secure_password"
  }'`, 'register')}
                              className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              {copiedSection === 'register' ? (
                                <>
                                  <CheckIcon className="h-4 w-4 text-green-400" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <ClipboardDocumentIcon className="h-4 w-4" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="p-3 sm:p-4 text-green-400 text-xs sm:text-sm overflow-x-auto">
                            {`curl -X POST https://decenter.run/v1/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "username": "your_username",
    "email": "your@email.com",
    "password": "secure_password",
    "confirm_password": "secure_password"
  }'`}
                          </pre>
                        </div>
                      </div>

                      {/* API Key Generation */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-gray-900 flex items-center">
                            <span className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm mr-3">2</span>
                            API Key Generation
                          </h3>
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">POST</span>
                        </div>
                        
                        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl overflow-hidden shadow-lg">
                          <div className="flex items-center justify-between p-4 bg-gray-800/50">
                            <div className="flex items-center space-x-3">
                              <div className="flex space-x-1">
                                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                              </div>
                              <span className="text-gray-300 text-sm font-medium">curl</span>
                            </div>
                            <button
                              onClick={() => copyToClipboard(`curl -X POST https://decenter.run/v1/api-keys \\
  -H "Authorization: Bearer <access-token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Production API Key",
    "description": "API key for production deployments"
  }'`, 'apikey')}
                              className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              {copiedSection === 'apikey' ? (
                                <>
                                  <CheckIcon className="h-4 w-4 text-green-400" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <ClipboardDocumentIcon className="h-4 w-4" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="p-3 sm:p-4 text-green-400 text-xs sm:text-sm overflow-x-auto">
                            {`curl -X POST https://decenter.run/v1/api-keys \\
  -H "Authorization: Bearer <access-token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Production API Key",
    "description": "API key for production deployments"
  }'`}
                          </pre>
                        </div>
                      </div>

                      {/* Security Notice */}
                      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 sm:p-6">
                        <div className="flex items-start">
                          <ShieldCheckIcon className="h-6 w-6 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-bold text-amber-900 mb-2">Security Best Practices</h4>
                            <ul className="text-amber-800 text-sm space-y-1">
                              <li>• Store API keys securely in environment variables</li>
                              <li>• Use different API keys for different environments</li>
                              <li>• Rotate API keys regularly for enhanced security</li>
                              <li>• Never commit API keys to version control</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* API Reference */}
                <section id="api-reference" className="scroll-mt-8">
                  <div className="flex items-center mb-4 lg:mb-6">
                    <CodeBracketIcon className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600 mr-2 lg:mr-3" />
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">API Reference</h2>
                  </div>

                  <div className="space-y-4 lg:space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 lg:p-6">
                      <h3 className="text-base lg:text-lg font-semibold text-blue-900 mb-2">Base URL</h3>
                      <code className="text-blue-800 bg-blue-100 px-2 lg:px-3 py-1 rounded text-xs lg:text-sm break-all">
                        https://decenter.run/
                      </code>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-6">
                      {[ 
                        // Authentication
                        { method: 'POST', endpoint: '/v1/auth/register', description: 'Register a new user', color: 'green' },
                        { method: 'POST', endpoint: '/v1/auth/login', description: 'Login and get access token', color: 'blue' },
                        { method: 'POST', endpoint: '/v1/auth/refresh', description: 'Refresh access token', color: 'blue' },
                        { method: 'POST', endpoint: '/v1/auth/logout', description: 'Logout user', color: 'red' },
                        { method: 'POST', endpoint: '/v1/auth/forgot-password', description: 'Request password reset', color: 'yellow' },
                        { method: 'POST', endpoint: '/v1/auth/reset-password', description: 'Reset password', color: 'yellow' },
                        // API Keys
                        { method: 'GET', endpoint: '/v1/api-keys', description: 'List API keys', color: 'blue' },
                        { method: 'POST', endpoint: '/v1/api-keys', description: 'Create a new API key', color: 'green' },
                        { method: 'DELETE', endpoint: '/v1/api-keys/{key_id}', description: 'Revoke an API key', color: 'red' },
                        // User Profile
                        { method: 'GET', endpoint: '/v1/user/profile', description: 'Get user profile', color: 'blue' },
                        { method: 'PUT', endpoint: '/v1/user/profile', description: 'Update user profile', color: 'yellow' },
                        { method: 'PUT', endpoint: '/v1/user/password', description: 'Change user password', color: 'yellow' },
                        // Deployments
                        { method: 'GET', endpoint: '/v1/deployments', description: 'List all deployments', color: 'blue' },
                        { method: 'POST', endpoint: '/v1/deployments', description: 'Create a new deployment', color: 'green' },
                        { method: 'GET', endpoint: '/v1/deployments/{deployment_id}', description: 'Get deployment details', color: 'blue' },
                        { method: 'PUT', endpoint: '/v1/deployments/{deployment_id}', description: 'Update deployment', color: 'yellow' },
                        { method: 'DELETE', endpoint: '/v1/deployments/{deployment_id}', description: 'Delete deployment', color: 'red' },
                        { method: 'PATCH', endpoint: '/v1/deployments/{deployment_id}/scale', description: 'Scale deployment', color: 'yellow' },
                        { method: 'POST', endpoint: '/v1/deployments/{deployment_id}/start', description: 'Start deployment', color: 'green' },
                        { method: 'POST', endpoint: '/v1/deployments/{deployment_id}/stop', description: 'Stop deployment', color: 'red' },
                        { method: 'GET', endpoint: '/v1/deployments/{deployment_id}/metrics', description: 'Get deployment metrics', color: 'blue' },
                        { method: 'GET', endpoint: '/v1/deployments/{deployment_id}/status', description: 'Get deployment status', color: 'blue' },
                        // Domains
                        { method: 'GET', endpoint: '/v1/deployments/{deployment_id}/domains', description: 'List domains for deployment', color: 'blue' },
                        { method: 'POST', endpoint: '/v1/deployments/{deployment_id}/domains', description: 'Add domain to deployment', color: 'green' },
                        { method: 'DELETE', endpoint: '/v1/deployments/{deployment_id}/domains/{domain_id}', description: 'Remove domain from deployment', color: 'red' },
                        // Logs
                        { method: 'GET', endpoint: '/v1/deployments/{deployment_id}/logs', description: 'Get deployment logs', color: 'blue' },
                        { method: 'GET', endpoint: '/v1/deployments/{deployment_id}/logs/stream', description: 'Stream deployment logs (WebSocket)', color: 'blue' },
                        // Notifications
                        { method: 'GET', endpoint: '/v1/ws/notifications', description: 'WebSocket notifications', color: 'blue' },
                        { method: 'GET', endpoint: '/v1/ws/health', description: 'WebSocket health check', color: 'blue' },
                        { method: 'GET', endpoint: '/v1/notifications/stats', description: 'Get notification stats', color: 'blue' },
                        // Webhooks
                        { method: 'GET', endpoint: '/v1/webhooks', description: 'List webhooks', color: 'blue' },
                        { method: 'POST', endpoint: '/v1/webhooks', description: 'Create webhook', color: 'green' },
                        { method: 'GET', endpoint: '/v1/webhooks/{webhook_id}', description: 'Get webhook details', color: 'blue' },
                        { method: 'PUT', endpoint: '/v1/webhooks/{webhook_id}', description: 'Update webhook', color: 'yellow' },
                        { method: 'DELETE', endpoint: '/v1/webhooks/{webhook_id}', description: 'Delete webhook', color: 'red' },
                        // Health
                        { method: 'GET', endpoint: '/health', description: 'Health check endpoint', color: 'blue' },
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
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">Deployment Guide</h2>
                  </div>

                  <div>
                    <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-3 lg:mb-4">Deploy Your First Container</h3>
                    <div className="bg-gray-900 rounded-lg p-3 sm:p-4 lg:p-6 relative">
                      <button
                        onClick={() => copyToClipboard(`curl -X POST https://decenter.run/v1/deployments \\
  -H "Authorization: Bearer <your-api-key>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "app_name": "hello-world",
    "image": "nginx:latest",
    "port": 80,
    "env_vars": {
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
                        {`curl -X POST https://decenter.run/v1/deployments \\
  -H "Authorization: Bearer <your-api-key>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "app_name": "hello-world",
    "image": "nginx:latest",
    "port": 80,
    "env_vars": {
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
  "app_name": "hello-world",
  "status": "pending",
  "url": "https://hello-world.vinhomes.co.uk",
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
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">Examples</h2>
                  </div>

                  <div className="grid gap-4 lg:gap-6">
                    <div className="bg-gray-50 rounded-lg p-4 lg:p-6">
                      <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">Python Application</h3>
                      <div className="bg-gray-900 rounded-lg p-3 lg:p-4">
                        <pre className="text-green-400 text-xs lg:text-sm overflow-x-auto">
                          {`# Deploy a Python Flask app
{
  "app_name": "my-python-app",
  "image": "python:3.9-slim",
  "port": 5000,
  "env_vars": {
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
  "app_name": "my-node-app",
  "image": "node:16-alpine",
  "port": 3000,
  "env_vars": {
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
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">Configuration</h2>
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
  "health_check": {
    "path": "/health",
    "initial_delay_seconds": 30,
    "period_seconds": 10,
    "timeout_seconds": 5,
    "failure_threshold": 3
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

      {/* Modern Footer */}
      <footer className="relative mt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900"></div>
        <div className="relative">
          {/* Decorative top border */}
          <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
          
          <div className="py-12 lg:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 lg:gap-12">
                {/* Brand Section */}
                <div className="md:col-span-2">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl blur-sm opacity-50"></div>
                      <img src="/open-container-engine-logo.png" alt="Container Engine" className="relative rounded-xl w-10 h-10 object-cover shadow-lg" />
                    </div>
                    <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      Container Engine
                    </span>
                  </div>
                  <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                    The modern, open-source alternative to Google Cloud Run. 
                    Deploy containers instantly with enterprise-grade security and performance.
                  </p>
                  <div className="flex space-x-4">
                    <Link to="/auth" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                      Get Started Free
                    </Link>
                    <a href="https://github.com/decenter-ai/container-engine" className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-all duration-200 font-semibold border border-white/20">
                      View on GitHub
                    </a>
                  </div>
                </div>

                {/* Quick Links */}
                <div>
                  <h4 className="text-white font-bold text-lg mb-6">Product</h4>
                  <ul className="space-y-3">
                    <li><Link to="/" className="text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200 block">Home</Link></li>
                    <li><Link to="/features" className="text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200 block">Features</Link></li>
                    <li><Link to="/documentation" className="text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200 block">Documentation</Link></li>
                    <li><Link to="/pricing" className="text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200 block">Pricing</Link></li>
                  </ul>
                </div>

                {/* Support */}
                <div>
                  <h4 className="text-white font-bold text-lg mb-6">Support</h4>
                  <ul className="space-y-3">
                    <li><Link to="/support" className="text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200 block">Help Center</Link></li>
                    <li><Link to="/contact" className="text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200 block">Contact Us</Link></li>
                    <li><Link to="/status" className="text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200 block">System Status</Link></li>
                    <li><Link to="/privacy" className="text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200 block">Privacy Policy</Link></li>
                  </ul>
                </div>
              </div>
              
              {/* Bottom Section */}
              <div className="mt-12 pt-8 border-t border-white/10">
                <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                  <p className="text-gray-400 text-sm">
                    &copy; {new Date().getFullYear()} Container Engine by Decenter.AI. All rights reserved.
                  </p>
                  <div className="flex items-center space-x-6">
                    <span className="text-sm text-gray-400">Built with ❤️ for developers</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm text-gray-400">All systems operational</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DocumentationPage;
