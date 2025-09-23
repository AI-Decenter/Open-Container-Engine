// src/pages/PrivacyPolicyPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheckIcon,
  EyeIcon,
  LockClosedIcon,
  ServerIcon,
  DocumentTextIcon,
  UserGroupIcon,
  GlobeAltIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const PrivacyPolicyPage: React.FC = () => {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const privacySections = [
    {
      id: 'information-collection',
      title: 'Information We Collect',
      icon: EyeIcon,
      content: [
        {
          subtitle: 'Account Information',
          description: 'When you create an account, we collect your username, email address, and encrypted password. This information is necessary to provide you with access to our platform and manage your deployments.'
        },
        {
          subtitle: 'Deployment Data',
          description: 'We store metadata about your container deployments including application names, Docker images, environment variables, and configuration settings. We do not access the contents of your running containers.'
        },
        {
          subtitle: 'Usage Analytics',
          description: 'We collect anonymous usage statistics such as API request patterns, deployment success rates, and feature usage to improve our platform performance and user experience.'
        },
        {
          subtitle: 'Technical Information',
          description: 'We automatically collect IP addresses, browser information, and timestamps for security monitoring and system optimization purposes.'
        }
      ]
    },
    {
      id: 'data-usage',
      title: 'How We Use Your Data',
      icon: ServerIcon,
      content: [
        {
          subtitle: 'Service Provision',
          description: 'Your data is used primarily to provide, maintain, and improve our container deployment services. This includes managing your deployments, processing API requests, and ensuring system reliability.'
        },
        {
          subtitle: 'Security & Fraud Prevention',
          description: 'We use your information to detect and prevent fraudulent activities, unauthorized access attempts, and security threats to protect both your account and our infrastructure.'
        },
        {
          subtitle: 'Communication',
          description: 'We may use your email address to send important service notifications, security alerts, and updates about significant platform changes that may affect your deployments.'
        },
        {
          subtitle: 'Platform Improvement',
          description: 'Aggregated and anonymized data helps us understand usage patterns, identify performance bottlenecks, and develop new features that benefit all users.'
        }
      ]
    },
    {
      id: 'data-protection',
      title: 'Data Protection & Security',
      icon: LockClosedIcon,
      content: [
        {
          subtitle: 'Encryption',
          description: 'All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption. Your passwords are hashed using bcrypt with industry-standard salt rounds.'
        },
        {
          subtitle: 'Access Controls',
          description: 'We implement strict access controls and the principle of least privilege. Only authorized personnel with legitimate business needs can access user data, and all access is logged and monitored.'
        },
        {
          subtitle: 'Infrastructure Security',
          description: 'Our infrastructure is hosted on secure, SOC 2 compliant cloud providers with regular security audits, vulnerability assessments, and penetration testing.'
        },
        {
          subtitle: 'Data Isolation',
          description: 'Your deployment data and containers are isolated from other users through secure multi-tenancy practices and network segmentation.'
        }
      ]
    },
    {
      id: 'data-sharing',
      title: 'Data Sharing & Third Parties',
      icon: UserGroupIcon,
      content: [
        {
          subtitle: 'No Data Sales',
          description: 'We never sell, rent, or lease your personal information to third parties for marketing purposes. Your data is yours, and we respect that fundamental principle.'
        },
        {
          subtitle: 'Service Providers',
          description: 'We may share limited data with trusted service providers who help us operate our platform (hosting, monitoring, support). These providers are bound by strict confidentiality agreements.'
        },
        {
          subtitle: 'Legal Requirements',
          description: 'We may disclose information if required by law, court order, or government request, but only the minimum necessary information and only after careful legal review.'
        },
        {
          subtitle: 'Business Transfers',
          description: 'In the event of a merger, acquisition, or sale of assets, your information may be transferred, but you will be notified of any such change and your rights will be preserved.'
        }
      ]
    },
    {
      id: 'user-rights',
      title: 'Your Rights & Controls',
      icon: DocumentTextIcon,
      content: [
        {
          subtitle: 'Data Access',
          description: 'You have the right to access all personal data we have about you. Contact us to request a complete data export in a machine-readable format.'
        },
        {
          subtitle: 'Data Correction',
          description: 'You can update your account information, deployment configurations, and preferences at any time through your dashboard or by contacting our support team.'
        },
        {
          subtitle: 'Data Deletion',
          description: 'You can delete your account and all associated data at any time. Deletion is permanent and cannot be undone. Some data may be retained for legal or security purposes as outlined below.'
        },
        {
          subtitle: 'Data Portability',
          description: 'You can export your deployment configurations, environment variables, and other account data in standard formats to facilitate migration to other services.'
        }
      ]
    },
    {
      id: 'data-retention',
      title: 'Data Retention',
      icon: GlobeAltIcon,
      content: [
        {
          subtitle: 'Active Accounts',
          description: 'We retain your data for as long as your account is active and you continue to use our services. This ensures we can provide consistent service and support.'
        },
        {
          subtitle: 'Deleted Accounts',
          description: 'When you delete your account, most data is permanently removed within 30 days. Some data may be retained longer for legal compliance, fraud prevention, or security purposes.'
        },
        {
          subtitle: 'Legal Requirements',
          description: 'Certain data may be retained for up to 7 years to comply with legal, regulatory, or tax requirements, even after account deletion.'
        },
        {
          subtitle: 'Backup Data',
          description: 'Data in security backups is automatically deleted according to our backup retention schedule, typically within 90 days of the original deletion request.'
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
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-12 text-white">
            <div className="flex items-center mb-4">
              <ShieldCheckIcon className="h-12 w-12 mr-4" />
              <h1 className="text-4xl font-bold">Privacy Policy</h1>
            </div>
            <p className="text-xl text-blue-100 mb-4">
              Your privacy and data security are our top priorities
            </p>
            <p className="text-blue-200">
              Last updated: {currentDate}
            </p>
          </div>

          <div className="p-8">
            {/* Introduction */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
              <div className="prose max-w-none text-gray-600">
                <p className="text-lg mb-4">
                  Container Engine ("we," "our," or "us") is committed to protecting your privacy and ensuring 
                  the security of your personal information. This Privacy Policy explains how we collect, use, 
                  disclose, and safeguard your information when you use our container deployment platform.
                </p>
                <p className="mb-4">
                  As an open-source alternative to Google Cloud Run, we believe in transparency not just in our 
                  code, but also in how we handle your data. This policy describes our practices in clear, 
                  understandable language.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-6">
                  <div className="flex items-start">
                    <ExclamationTriangleIcon className="h-6 w-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-blue-900 mb-2">Important Note</p>
                      <p className="text-blue-800">
                        By using Container Engine, you agree to the collection and use of information in 
                        accordance with this Privacy Policy. If you do not agree with our policies and 
                        practices, please do not use our services.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy Sections */}
            <div className="space-y-12">
              {privacySections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-8">
                  <div className="flex items-center mb-6">
                    <section.icon className="h-8 w-8 text-blue-600 mr-3" />
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

            {/* Contact Information */}
            <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us About Privacy</h2>
              <p className="text-gray-700 mb-6">
                If you have any questions about this Privacy Policy, our data practices, or want to exercise 
                your privacy rights, please don't hesitate to contact us:
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
                  <p className="text-blue-600">privacy@container-engine.app</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Response Time</h3>
                  <p className="text-gray-700">We aim to respond within 48 hours</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Data Protection Officer</h3>
                  <p className="text-blue-600">dpo@container-engine.app</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Address</h3>
                  <p className="text-gray-700">
                    Container Engine, Decenter.AI<br />
                    Data Privacy Office<br />
                    Via secure communication channel
                  </p>
                </div>
              </div>
            </div>

            {/* Updates Policy */}
            <div className="mt-12 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-yellow-900 mb-3">Policy Updates</h2>
              <p className="text-yellow-800 mb-4">
                We may update this Privacy Policy from time to time to reflect changes in our practices, 
                technology, legal requirements, or other factors.
              </p>
              <ul className="text-yellow-800 space-y-2">
                <li>• We will notify you of any material changes via email or through our platform</li>
                <li>• The updated policy will be posted on this page with a new "Last updated" date</li>
                <li>• Continued use of our services after updates constitutes acceptance of the new policy</li>
                <li>• You can always review the current version at any time on this page</li>
              </ul>
            </div>

            {/* GDPR & CCPA Compliance */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Regulatory Compliance</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">GDPR Compliance</h3>
                  <p className="text-blue-800 text-sm">
                    For users in the European Economic Area, we comply with the General Data Protection 
                    Regulation (GDPR). You have additional rights including data portability, the right 
                    to be forgotten, and the right to object to processing.
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-3">CCPA Compliance</h3>
                  <p className="text-green-800 text-sm">
                    For California residents, we comply with the California Consumer Privacy Act (CCPA). 
                    You have the right to know what personal information we collect, delete your information, 
                    and opt-out of the sale of personal information (which we don't engage in).
                  </p>
                </div>
              </div>
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

export default PrivacyPolicyPage;
