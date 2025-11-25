import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, Mail, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 text-gray-600 hover:text-[#D71920] transition"
        >
          ← Back
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-[#D71920] to-[#B91518] px-8 py-12 text-white">
            <div className="flex items-center gap-4 mb-4">
              <Shield className="w-12 h-12" />
              <h1 className="text-4xl font-bold">Privacy Policy</h1>
            </div>
            <p className="text-white/90 text-lg">Last Updated: November 22, 2025</p>
          </div>

          <div className="px-8 py-12 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <Eye className="w-6 h-6 text-[#D71920]" />
                Introduction
              </h2>
              <p className="text-gray-700 leading-relaxed">
                The Crew Academy ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform. Please read this policy carefully to understand our views and practices regarding your personal data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <Database className="w-6 h-6 text-[#D71920]" />
                Information We Collect
              </h2>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-2">Personal Information</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Name, email address, and contact details</li>
                    <li>Profile information (photo, bio, location)</li>
                    <li>Account credentials and authentication data</li>
                    <li>Payment information (processed securely through Stripe)</li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-2">Usage Information</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Course progress and learning activities</li>
                    <li>Messages and community interactions</li>
                    <li>Login activity and session data</li>
                    <li>Device information and IP address</li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-2">Uploaded Content</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>CVs and resumes</li>
                    <li>Profile photos and documents</li>
                    <li>Course assignments and submissions</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <Lock className="w-6 h-6 text-[#D71920]" />
                How We Use Your Information
              </h2>
              <div className="space-y-2 text-gray-700">
                <p><strong>✓</strong> Provide and improve our educational services</p>
                <p><strong>✓</strong> Process payments and manage subscriptions</p>
                <p><strong>✓</strong> Communicate with you about courses, updates, and support</p>
                <p><strong>✓</strong> Personalize your learning experience</p>
                <p><strong>✓</strong> Ensure platform security and prevent fraud</p>
                <p><strong>✓</strong> Comply with legal obligations</p>
                <p><strong>✓</strong> Analyze usage patterns to improve our platform</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Security</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We implement industry-standard security measures to protect your personal information:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
                  <Shield className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <p className="font-bold text-green-900">256-bit Encryption</p>
                </div>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center">
                  <Lock className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <p className="font-bold text-blue-900">Secure Storage</p>
                </div>
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 text-center">
                  <Database className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <p className="font-bold text-purple-900">Regular Backups</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Sharing and Third Parties</h2>
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-bold text-yellow-900 mb-2">We NEVER sell your personal data.</p>
                    <p className="text-gray-700">We only share data with trusted third parties necessary for our services:</p>
                    <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                      <li><strong>Stripe:</strong> Payment processing (PCI-DSS compliant)</li>
                      <li><strong>Firebase/Google Cloud:</strong> Database and authentication</li>
                      <li><strong>OpenAI:</strong> AI features (anonymized where possible)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights (GDPR & CCPA)</h2>
              <div className="space-y-2 text-gray-700">
                <p><strong>→</strong> Access your personal data</p>
                <p><strong>→</strong> Correct inaccurate information</p>
                <p><strong>→</strong> Request data deletion</p>
                <p><strong>→</strong> Export your data (data portability)</p>
                <p><strong>→</strong> Opt-out of marketing communications</p>
                <p><strong>→</strong> Withdraw consent at any time</p>
              </div>
              <p className="text-gray-600 mt-4 text-sm italic">
                To exercise these rights, contact us at privacy@thecrewacademy.com
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookies and Tracking</h2>
              <p className="text-gray-700 leading-relaxed">
                We use cookies and similar technologies to enhance your experience, analyze usage, and remember your preferences. You can control cookie settings through your browser, but some features may not function properly if cookies are disabled.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                Our platform is not intended for users under 16 years of age. We do not knowingly collect personal information from children. If you believe we have inadvertently collected such information, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of significant changes by email or through a prominent notice on our platform. Continued use after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <Mail className="w-6 h-6 text-[#D71920]" />
                Contact Us
              </h2>
              <div className="bg-gradient-to-r from-[#D71920]/10 to-[#B91518]/10 rounded-xl p-6">
                <p className="text-gray-800 leading-relaxed">
                  If you have any questions or concerns about this Privacy Policy or our data practices:
                </p>
                <ul className="mt-4 space-y-2 text-gray-700">
                  <li><strong>Email:</strong> privacy@thecrewacademy.com</li>
                  <li><strong>Support:</strong> Use the live chat on our platform</li>
                  <li><strong>Address:</strong> The Crew Academy, London, United Kingdom</li>
                </ul>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
