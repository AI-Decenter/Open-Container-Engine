// src/pages/LandingPage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowPathIcon, CloudArrowUpIcon, FingerPrintIcon, CheckIcon } from '@heroicons/react/24/outline';

const stats = [
    { name: 'Deployments', value: '10,000+' },
    { name: 'Developers', value: '2,500+' },
    { name: 'Uptime', value: '99.9%' },
    { name: 'Countries', value: '50+' },
];


const LandingPage: React.FC = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-white text-gray-900 font-inter">
            {/* Header / Navbar */}
            <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50">
                <nav className="container mx-auto px-4 sm:px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center">
                                <img src="/open-container-engine-logo.png" alt="Open Container Engine" className="w-full h-full object-contain rounded-md" />
                            </div>
                            <span className="text-lg sm:text-2xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                <span className="hidden sm:inline">Container Engine</span>
                                <span className="sm:hidden">CE</span>
                            </span>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden lg:flex items-center space-x-6">
                            <Link to="/features" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                                Features
                            </Link>
                            <Link to="/documentation" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                                Docs
                            </Link>
                            <a href="https://decenter.ai/" target="_blank" rel="noopener noreferrer"
                                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 font-medium transition-colors group">
                                <div className="w-5 h-5 bg-black rounded-sm flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                                    <span className="text-white text-xs font-bold">D</span>
                                </div>
                                <span>Decenter.AI</span>
                            </a>
                        
                            <Link to="/auth"
                                className="px-6 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl">
                                Get Started
                            </Link>
                        </div>

                        {/* Mobile menu button */}
                        <div className="lg:hidden flex items-center space-x-3">
                            <Link to="/auth"
                                className="px-4 py-2 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium text-sm">
                                Get Started
                            </Link>
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    {mobileMenuOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Navigation Menu */}
                    {mobileMenuOpen && (
                        <div className="lg:hidden mt-4 pb-4 border-t border-gray-200">
                            <div className="pt-4 space-y-3">
                                <Link to="/features"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block text-gray-600 hover:text-blue-600 font-medium transition-colors px-2 py-1">
                                    Features
                                </Link>
                                <Link to="/documentation"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block text-gray-600 hover:text-blue-600 font-medium transition-colors px-2 py-1">
                                    Documentation
                                </Link>
                                <a href="https://decenter.ai/" target="_blank" rel="noopener noreferrer"
                                    className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 font-medium transition-colors px-2 py-1">
                                    <div className="w-5 h-5 bg-black rounded-sm flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">D</span>
                                    </div>
                                    <span>Decenter.AI</span>
                                </a>
                            </div>
                        </div>
                    )}
                </nav>
            </header>

            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-20 sm:pt-32 pb-20 sm:pb-32">
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                    <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>
                <div className="container mx-auto px-4 sm:px-6 text-center relative">
                    <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full text-sm font-medium mb-8 border border-blue-200">
                        ✨ Deploy containers like magic - No DevOps required
                    </div>
                    <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold mb-8 leading-tight">
                        <span className="block text-gray-900">Forget deployment</span>
                        <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                            complexity.
                        </span>
                        <span className="block text-gray-900">Run anything.</span>
                        <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-600 mt-4">
                            Like magic. ✨
                        </span>
                    </h1>
                    <p className="text-xl sm:text-2xl md:text-3xl text-gray-600 mb-12 max-w-5xl mx-auto leading-relaxed">
                        The <span className="font-bold text-gray-900">open-source alternative</span> to Google Cloud Run. 
                        Built with <span className="font-bold text-blue-600">Rust & Axum</span> for enterprise-grade performance.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-16">
                        <Link to="/auth"
                            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 min-w-[200px]">
                            Start Free Trial
                        </Link>
                        <a href="https://github.com/AI-Decenter/Open-Container-Engine" target="_blank" rel="noopener noreferrer"
                            className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-xl text-lg hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 min-w-[200px]">
                            View on GitHub
                        </a>
                    </div>
                    
                    <p className="text-sm text-gray-500 mb-12">
                        Deploy your first container in <span className="font-semibold">under 60 seconds</span>. No credit card required.
                    </p>





                    {/* Trust Indicators */}
                    <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 mb-12 sm:mb-16 px-4">
                        <img src="https://img.shields.io/badge/build-passing-brightgreen.svg" alt="Build Status" className="h-5 sm:h-6" />
                        <img src="https://img.shields.io/badge/coverage-100%25-brightgreen.svg" alt="Code Coverage" className="h-5 sm:h-6" />
                    </div>

                    {/* Choose Your Version */}
                    <div className="relative max-w-6xl mx-auto px-4">
                        <div className="text-center mb-8 sm:mb-12">
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                                Choose Your Deployment Path
                            </h2>
                            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
                                Self-host with complete control or go cloud-native with zero infrastructure management
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 mb-8">
                            {/* Open Source Option */}
                            <div className="group relative bg-white rounded-xl sm:rounded-2xl shadow-xl border-2 border-gray-200 hover:border-blue-500 transition-all duration-300 p-6 sm:p-8">
                                <div className="absolute -top-3 left-6 sm:-top-4 sm:left-8">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                                        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                                        </svg>
                                    </div>
                                </div>
                                <div className="pt-6 sm:pt-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Open Source</h3>
                                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">FREE</span>
                                    </div>
                                    <p className="text-sm sm:text-base text-gray-600 mb-6 leading-relaxed">
                                        Self-host on your own infrastructure. Complete control, unlimited deployments, and community support.
                                    </p>
                                    <ul className="space-y-3 mb-8">
                                        {[
                                            'Full source code access',
                                            'Self-hosted deployment',
                                            'Community support',
                                            'Unlimited containers',
                                            'Custom modifications'
                                        ].map((feature, index) => (
                                            <li key={index} className="flex items-center text-sm">
                                                <CheckIcon className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <a
                                        href="https://github.com/AI-Decenter/Open-Container-Engine"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full inline-flex items-center justify-center px-6 py-3 border-2 border-green-600 text-green-600 font-semibold rounded-lg hover:bg-green-600 hover:text-white transition-all duration-200 group"
                                    >
                                        <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                                        </svg>
                                        View on GitHub
                                    </a>
                                </div>
                            </div>

                            {/* Cloud Option */}
                            <div className="group relative bg-white rounded-xl sm:rounded-2xl shadow-xl border-2 border-blue-200 hover:border-blue-500 transition-all duration-300 p-6 sm:p-8 ring-2 ring-blue-100">
                                <div className="absolute -top-3 left-6 sm:-top-4 sm:left-8">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="absolute top-4 right-4">
                                    <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-full">RECOMMENDED</span>
                                </div>
                                <div className="pt-6 sm:pt-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Cloud Platform</h3>
                                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">HOSTED</span>
                                    </div>
                                    <p className="text-sm sm:text-base text-gray-600 mb-6 leading-relaxed">
                                        Fully managed platform with zero infrastructure overhead. Deploy instantly with enterprise-grade reliability.
                                    </p>
                                    <ul className="space-y-3 mb-8">
                                        {[
                                            'Zero infrastructure management',
                                            'Global CDN & edge locations',
                                            '24/7 monitoring & support',
                                            'Auto-scaling & load balancing',
                                            'Enterprise security & compliance'
                                        ].map((feature, index) => (
                                            <li key={index} className="flex items-center text-sm">
                                                <CheckIcon className="w-4 h-4 text-blue-500 mr-3 flex-shrink-0" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <a
                                        href="https://decenter.run/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl group"
                                    >
                                        <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Try Cloud Platform
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Bottom CTA */}
                        <div className="text-center">
                            <p className="text-sm sm:text-base text-gray-500">
                                Not sure which option to choose? 
                                <Link to="/features" className="text-blue-600 hover:text-blue-700 ml-1 font-medium">
                                    Compare features →
                                </Link>
                            </p>
                        </div>

                        {/* Decorative elements */}
                        <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-20 blur-xl"></div>
                        <div className="absolute -bottom-2 -left-2 sm:-bottom-4 sm:-left-4 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-20 blur-xl"></div>
                    </div>
                   
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-12 sm:py-16 bg-white">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                        {stats.map((stat) => (
                            <div key={stat.name} className="text-center">
                                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-600 mb-2">{stat.value}</div>
                                <div className="text-sm sm:text-base text-gray-600 font-medium">{stat.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Magic Features Section */}
            <section className="py-20 sm:py-32 bg-white">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6">
                            Container deployment was built on complexity.
                        </h2>
                        <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-8">
                            We rebuilt it on magic. ✨
                        </h3>
                        <p className="text-xl sm:text-2xl text-gray-600 max-w-4xl mx-auto">
                            Fast. Simple. Secure. Scalable. Container deployment, finally built the way it should be.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
                        {/* Speed Feature */}
                        <div className="group">
                            <div className="mb-6">
                                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Speed? It actually flies.</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Deploy on blazing-fast infrastructure with NVMe storage and optimized networking. 
                                    Because milliseconds matter, and we make every one count.
                                </p>
                            </div>
                        </div>

                        {/* Security Feature */}
                        <div className="group">
                            <div className="mb-6">
                                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                                    <FingerPrintIcon className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Security? Locked down.</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Full container isolation with enterprise-grade security. Your apps run in their own 
                                    dedicated space, not crammed with thousands of others.
                                </p>
                            </div>
                        </div>

                        {/* Cost Feature */}
                        <div className="group">
                            <div className="mb-6">
                                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Cost? Smarter, not scarier.</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    No idle servers. No overspending. Pay only for what you use, exactly when you use it. 
                                    Not a penny more.
                                </p>
                            </div>
                        </div>

                        {/* Scalability Feature */}
                        <div className="group">
                            <div className="mb-6">
                                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                                    <ArrowPathIcon className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Scalability? It's on autopilot.</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Traffic spikes? No problem. Auto-scale your apps instantly across regions. 
                                    No pre-configs. No guesswork. Just seamless scaling.
                                </p>
                            </div>
                        </div>

                        {/* Simplicity Feature */}
                        <div className="group">
                            <div className="mb-6">
                                <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                                    <CloudArrowUpIcon className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Simplicity? Borderline ridiculous.</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    No Kubernetes complexity. No DevOps gymnastics. Just select your image, hit deploy, 
                                    and let the magic happen.
                                </p>
                            </div>
                        </div>

                        {/* Everything Built-in Feature */}
                        <div className="group">
                            <div className="mb-6">
                                <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-4H3m16 8H7m12 4H9" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Everything. Already built in.</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Load balancing, auto-scaling, monitoring, logging. Everything you need—seamlessly integrated. 
                                    No third-party add-ons required.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Deploy with Docker/GitHub */}
                    <div className="text-center mt-20">
                        <p className="text-xl text-gray-600 mb-8">Deploy seamlessly using</p>
                        <div className="flex justify-center items-center gap-12">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185M13.983 15.788h2.119a.186.186 0 00.186-.186v-1.887a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185"/>
                                    </svg>
                                </div>
                                <span className="text-lg font-semibold text-gray-700">Docker</span>
                            </div>
                            <div className="text-gray-400">or</div>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-8 h-8 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                                    </svg>
                                </div>
                                <span className="text-lg font-semibold text-gray-700">GitHub</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Code Example Section */}
            <section className="py-16 sm:py-20 bg-gray-900 text-white">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
                        <div className="lg:pr-4">
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">Deploy in One Command</h2>
                            <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-6 sm:mb-8">
                                No complex YAML files. No kubectl knowledge required. Just one simple API call.
                            </p>
                            <div className="space-y-3 sm:space-y-4">
                                {[
                                    'Push your container to any registry',
                                    'Make a single API call',
                                    'Get a live URL in seconds'
                                ].map((step, index) => (
                                    <div key={index} className="flex items-center">
                                        <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 mr-2 sm:mr-3 flex-shrink-0" />
                                        <span className="text-sm sm:text-base">{step}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-gray-800 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-700 overflow-hidden">
                            <div className="flex items-center mb-3 sm:mb-4">
                                <div className="flex space-x-1 sm:space-x-2">
                                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full"></div>
                                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded-full"></div>
                                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                                </div>
                                <span className="ml-3 sm:ml-4 text-gray-400 text-xs sm:text-sm">terminal</span>
                            </div>
                            <div className="overflow-x-auto">
                                <pre className="text-green-400 text-xs sm:text-sm whitespace-pre-wrap break-all sm:break-normal">
                                    {`curl -X POST https://api.decenter.run/deploy \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "image": "nginx:latest",
    "port": 80,
    "subdomain": "my-app"
  }'`}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            </section>



            {/* Deploy in Seconds CTA */}
            <section className="py-20 sm:py-32 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
                    <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
                </div>
                <div className="container mx-auto px-4 sm:px-6 text-center relative">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-8">
                            Deploy in seconds.
                        </h2>
                        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-8 text-blue-100">
                            No tricks—just magic! ✨
                        </h3>
                        <p className="text-xl sm:text-2xl mb-12 opacity-90 max-w-3xl mx-auto">
                            Join thousands of developers who have already simplified their deployment process
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-8">
                            <Link to="/auth"
                                className="px-10 py-5 bg-white text-blue-600 font-bold rounded-xl text-xl hover:bg-gray-100 transition-all duration-200 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 min-w-[250px]">
                                Start 14-Day FREE Trial
                            </Link>
                            <a href="https://github.com/AI-Decenter/Open-Container-Engine" target="_blank" rel="noopener noreferrer"
                                className="px-10 py-5 border-2 border-white text-white font-bold rounded-xl text-xl hover:bg-white hover:text-blue-600 transition-all duration-200 min-w-[250px]">
                                View on GitHub
                            </a>
                        </div>
                        <p className="text-sm opacity-80">
                            Get started in seconds • Cancel anytime • No credit card required
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-300 py-16">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                                    <img src="/open-container-engine-logo.png" alt="Open Container Engine" className="w-full h-full object-contain" />
                                </div>
                                <span className="text-xl font-bold text-white">Container Engine</span>
                            </div>
                            <p className="text-gray-400 mb-4">
                                The open-source alternative to Google Cloud Run
                            </p>
                            <div className="flex space-x-4">
                            
                                <a href="https://github.com/AI-Decenter/Open-Container-Engine" className="text-gray-400 hover:text-white transition-colors">
                                    <span className="sr-only">GitHub</span>
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-white font-semibold mb-4">Product</h3>
                            <ul className="space-y-2">
                                <li><Link to="/features" className="hover:text-white transition-colors">Features</Link></li>
                                <li><Link to="/documentation" className="hover:text-white transition-colors">Documentation</Link></li>
                                <li><a href="https://github.com/AI-Decenter/Open-Container-Engine" className="hover:text-white transition-colors">GitHub</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-white font-semibold mb-4">Company</h3>
                            <ul className="space-y-2">
                                <li><a href="https://decenter.ai/" className="hover:text-white transition-colors">About</a></li>
                                <li><a href="https://decenter.ai/" className="hover:text-white transition-colors">Contact</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-white font-semibold mb-4">Support</h3>
                            <ul className="space-y-2">
                                <li><a href="https://decenter.ai/" className="hover:text-white transition-colors">Help Center</a></li>
                                <li><a href="https://decenter.ai/" className="hover:text-white transition-colors">Community</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-8">
                        <div className="flex flex-col md:flex-row justify-between items-center">
                            <p className="text-sm text-gray-400">
                                &copy; {new Date().getFullYear()} Container Engine by Decenter.AI. All rights reserved.
                            </p>
                            <div className="flex space-x-6 mt-4 md:mt-0">
                                <Link to="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
                                <Link to="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">Terms of Service</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;