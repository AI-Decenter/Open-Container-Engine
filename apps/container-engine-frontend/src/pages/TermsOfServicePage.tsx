// src/pages/TermsOfServicePage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  DocumentTextIcon,
  ScaleIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  GlobeAltIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const TermsOfServicePage: React.FC = () => {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const termsSections = [
    {
      id: 'acceptance',
      title: 'Acceptance of Terms',
      icon: CheckCircleIcon,
      content: [
        {
          subtitle: 'Agreement to Terms',
          description: 'By accessing, registering for, or using Container Engine services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any part of these terms, you may not use our services.'
        },
        {
          subtitle: 'Capacity to Accept',
          description: 'You represent and warrant that you are at least 18 years old and have the legal capacity to enter into this agreement. If you are using our services on behalf of an organization, you represent that you have the authority to bind that organization to these terms.'
        },
        {
          subtitle: 'Modifications',
          description: 'We reserve the right to modify these terms at any time. Material changes will be communicated via email or through our platform. Continued use of our services after such modifications constitutes acceptance of the updated terms.'
        }
      ]
    },
    {
      id: 'service-description',
      title: 'Service Description',
      icon: GlobeAltIcon,
      content: [
        {
          subtitle: 'Platform Overview',
          description: 'Container Engine is an open-source container deployment platform that provides an alternative to Google Cloud Run. We offer container orchestration, auto-scaling, monitoring, and deployment management services through our web interface and API.'
        },
        {
          subtitle: 'Service Availability',
          description: 'While we strive for high availability, we do not guarantee that our services will be available 100% of the time. We may experience downtime for maintenance, updates, or due to factors beyond our control. We will make reasonable efforts to provide advance notice of planned maintenance.'
        },
        {
          subtitle: 'Beta Features',
          description: 'Some features may be offered in beta or experimental status. These features are provided "as is" and may be unstable, incomplete, or subject to change without notice. Use of beta features is at your own risk.'
        }
      ]
    },
    {
      id: 'user-responsibilities',
      title: 'User Responsibilities',
      icon: UserGroupIcon,
      content: [
        {
          subtitle: 'Account Security',
          description: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account or any other breach of security.'
        },
        {
          subtitle: 'Content Responsibility',
          description: 'You are solely responsible for the content, applications, and containers you deploy using our platform. This includes ensuring compliance with all applicable laws, regulations, and third-party rights.'
        },
        {
          subtitle: 'Resource Usage',
          description: 'You agree to use our services in accordance with your plan limits and in a manner that does not interfere with other users\' ability to use the platform. Excessive resource usage may result in throttling or suspension of services.'
        },
        {
          subtitle: 'Security Compliance',
          description: 'You must implement appropriate security measures for your applications and not attempt to breach or circumvent our security measures. Any security vulnerabilities discovered should be reported responsibly through our security contact.'
        }
      ]
    },
    {
      id: 'prohibited-uses',
      title: 'Prohibited Uses',
      icon: ExclamationTriangleIcon,
      content: [
        {
          subtitle: 'Illegal Activities',
          description: 'You may not use our services for any illegal activities, including but not limited to: hosting malware, phishing sites, illegal content distribution, or any activities that violate local, national, or international laws.'
        },
        {
          subtitle: 'Harmful Content',
          description: 'Prohibited content includes: malicious software, spam, harassment, hate speech, terrorist content, intellectual property infringement, or any content that promotes violence or illegal activities.'
        },
        {
          subtitle: 'System Abuse',
          description: 'You may not: attempt to gain unauthorized access to our systems, disrupt our services, use our platform for cryptocurrency mining without explicit permission, or engage in any activity that could harm our infrastructure or other users.'
        },
        {
          subtitle: 'Commercial Restrictions',
          description: 'Unless explicitly permitted by your plan, you may not resell, redistribute, or sublicense our services. Competition analysis or reverse engineering of our platform is prohibited.'
        }
      ]
    },
    {
      id: 'payment-billing',
      title: 'Payment & Billing',
      icon: CurrencyDollarIcon,
      content: [
        {
          subtitle: 'Billing Cycles',
          description: 'Paid plans are billed in advance on a monthly or annual basis as selected. Billing begins immediately upon plan activation. Usage-based charges are calculated and billed at the end of each billing cycle.'
        },
        {
          subtitle: 'Payment Methods',
          description: 'We accept major credit cards and other payment methods as displayed during checkout. You authorize us to charge your selected payment method for all applicable fees. Failed payments may result in service suspension.'
        },
        {
          subtitle: 'Refund Policy',
          description: 'Monthly subscriptions are non-refundable. Annual subscriptions may be refunded on a pro-rata basis within 30 days of initial purchase. Usage-based charges are non-refundable. Refunds are processed to the original payment method.'
        },
        {
          subtitle: 'Price Changes',
          description: 'We may modify our pricing at any time. Price changes for existing customers will take effect at the next billing cycle after 30 days written notice. Continued use of paid services constitutes acceptance of new pricing.'
        }
      ]
    },
    {
      id: 'data-ownership',
      title: 'Data & Intellectual Property',
      icon: ShieldExclamationIcon,
      content: [
        {
          subtitle: 'Your Data',
          description: 'You retain ownership of all data, content, and applications you store or deploy on our platform. We do not claim ownership of your intellectual property. You grant us a limited license to host, store, and process your data solely to provide our services.'
        },
        {
          subtitle: 'Our Platform',
          description: 'Container Engine and its underlying technology, including our software, APIs, documentation, and proprietary algorithms, are owned by us and protected by intellectual property laws. You may not copy, modify, or reverse engineer our platform.'
        },
        {
          subtitle: 'Open Source Components',
          description: 'Our platform may include open-source software components. Such components are governed by their respective open-source licenses. We will make information about open-source components available upon request.'
        },
        {
          subtitle: 'Feedback',
          description: 'Any feedback, suggestions, or ideas you provide about our services may be used by us without restriction or compensation. By providing feedback, you grant us a perpetual, worldwide license to use and incorporate such feedback.'
        }
      ]
    },
    {
      id: 'limitation-liability',
      title: 'Limitation of Liability',
      icon: ScaleIcon,
      content: [
        {
          subtitle: 'Service Disclaimers',
          description: 'Our services are provided "as is" and "as available" without warranties of any kind, either express or implied. We disclaim all warranties, including but not limited to merchantability, fitness for a particular purpose, and non-infringement.'
        },
        {
          subtitle: 'Limitation of Damages',
          description: 'To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or business opportunities.'
        },
        {
          subtitle: 'Maximum Liability',
          description: 'Our total liability to you for all claims arising from or related to our services shall not exceed the amount you paid us in the 12 months preceding the claim, or $100, whichever is greater.'
        },
        {
          subtitle: 'Indemnification',
          description: 'You agree to indemnify and hold us harmless from any claims, damages, or expenses arising from your use of our services, your violation of these terms, or your violation of any rights of another party.'
        }
      ]
    },
    {
      id: 'termination',
      title: 'Termination',
      icon: ExclamationTriangleIcon,
      content: [
        {
          subtitle: 'Termination by You',
          description: 'You may terminate your account at any time by contacting our support team or using the account deletion feature in your dashboard. Termination does not relieve you of any payment obligations for services already provided.'
        },
        {
          subtitle: 'Termination by Us',
          description: 'We may suspend or terminate your account immediately if you violate these terms, engage in prohibited activities, or fail to pay applicable fees. We will provide reasonable notice when possible, except in cases of severe violations.'
        },
        {
          subtitle: 'Effect of Termination',
          description: 'Upon termination, your access to our services will cease, and we may delete your data after a reasonable grace period. You remain responsible for all charges incurred before termination. Sections of these terms that should survive termination will continue to apply.'
        },
        {
          subtitle: 'Data Recovery',
          description: 'After account termination, we will provide a 30-day grace period during which you may request data export. After this period, your data may be permanently deleted and cannot be recovered.'
        }
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
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
                <img src="/open-container-engine-logo.png" alt="Open Container Engine" className="w-6 h-6 object-contain filter drop-shadow-sm" />
              </div>
              <span className="text-xl font-bold text-gray-900">Container Engine</span>
            </Link>
            <div className="flex items-center space-x-6">
              <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                Home
              </Link>
              <Link to="/features" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                Features
              </Link>
              <Link to="/documentation" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                Documentation
              </Link>
              <Link to="/auth" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Get Started
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-12 text-white">
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="h-12 w-12 mr-4" />
              <h1 className="text-4xl font-bold">Terms of Service</h1>
            </div>
            <p className="text-xl text-indigo-100 mb-4">
              Legal terms and conditions for using Container Engine
            </p>
            <p className="text-indigo-200">
              Last updated: {currentDate}
            </p>
          </div>

          <div className="p-8">
            {/* Introduction */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
              <div className="prose max-w-none text-gray-600">
                <p className="text-lg mb-4">
                  Welcome to Container Engine, an open-source container deployment platform operated by 
                  Decenter.AI. These Terms of Service ("Terms") govern your use of our platform, services, 
                  and any related software, APIs, or documentation.
                </p>
                <p className="mb-4">
                  These Terms constitute a legally binding agreement between you and Container Engine. 
                  Please read them carefully as they contain important information about your rights and 
                  obligations, including limitations of liability and dispute resolution procedures.
                </p>
                <div className="bg-amber-50 border-l-4 border-amber-400 p-6 mb-6">
                  <div className="flex items-start">
                    <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-amber-900 mb-2">Important Legal Notice</p>
                      <p className="text-amber-800">
                        These Terms include provisions that limit our liability and require individual 
                        arbitration of disputes rather than class actions. Please review Section 7 
                        (Limitation of Liability) carefully.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms Sections */}
            <div className="space-y-12">
              {termsSections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-8">
                  <div className="flex items-center mb-6">
                    <section.icon className="h-8 w-8 text-indigo-600 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                  </div>
                  
                  <div className="space-y-6">
                    {section.content.map((item, itemIndex) => (
                      <div key={itemIndex} className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          {item.subtitle}
                        </h3>
                        <p className="text-gray-700 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {/* Governing Law */}
            <div className="mt-12 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Governing Law & Disputes</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Governing Law</h3>
                  <p className="text-gray-700 mb-4">
                    These Terms are governed by and construed in accordance with the laws of the jurisdiction 
                    where Decenter.AI is registered, without regard to conflict of law principles.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Dispute Resolution</h3>
                  <p className="text-gray-700 mb-4">
                    Any disputes arising from these Terms or your use of our services will be resolved 
                    through binding arbitration rather than in court, except where prohibited by law.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-white rounded-lg border border-indigo-200">
                <h4 className="font-semibold text-indigo-900 mb-2">Class Action Waiver</h4>
                <p className="text-indigo-800 text-sm">
                  You agree to resolve disputes individually and waive any right to participate in class actions, 
                  collective actions, or representative proceedings, except where such waiver is prohibited by law.
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="mt-12 bg-gray-100 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions About These Terms</h2>
              <p className="text-gray-700 mb-6">
                If you have any questions about these Terms of Service or need clarification about 
                your rights and obligations, please contact us:
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Legal Inquiries</h3>
                  <p className="text-blue-600">legal@container-engine.app</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">General Support</h3>
                  <p className="text-blue-600">support@container-engine.app</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Business Address</h3>
                  <p className="text-gray-700">
                    Container Engine, Decenter.AI<br />
                    Legal Department<br />
                    Available upon request
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Response Time</h3>
                  <p className="text-gray-700">
                    Legal inquiries: 5-7 business days<br />
                    General support: 24-48 hours
                  </p>
                </div>
              </div>
            </div>

            {/* Severability & Entire Agreement */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Final Provisions</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">Severability</h3>
                  <p className="text-blue-800 text-sm">
                    If any provision of these Terms is found to be unenforceable, the remaining provisions 
                    will continue in full force and effect. The unenforceable provision will be replaced 
                    with an enforceable provision that most closely reflects our intent.
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-3">Entire Agreement</h3>
                  <p className="text-green-800 text-sm">
                    These Terms, together with our Privacy Policy and any other legal notices published 
                    on our platform, constitute the entire agreement between you and Container Engine 
                    regarding the use of our services.
                  </p>
                </div>
              </div>
            </div>

            {/* Acknowledgment */}
            <div className="mt-12 bg-indigo-600 text-white rounded-lg p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Acknowledgment</h2>
              <p className="text-lg text-indigo-100">
                By using Container Engine, you acknowledge that you have read, understood, and agree to be 
                bound by these Terms of Service and our Privacy Policy.
              </p>
              <p className="text-indigo-200 mt-4 text-sm">
                Thank you for choosing Container Engine for your container deployment needs.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 mt-16">
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

export default TermsOfServicePage;
