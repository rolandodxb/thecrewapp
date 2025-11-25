import { motion } from 'framer-motion';
import { FileText, AlertTriangle, Shield, CreditCard, Users, Ban } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TermsOfServicePage() {
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
              <FileText className="w-12 h-12" />
              <h1 className="text-4xl font-bold">Terms of Service</h1>
            </div>
            <p className="text-white/90 text-lg">Last Updated: November 22, 2025</p>
          </div>

          <div className="px-8 py-12 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Agreement to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing or using The Crew Academy platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service. These Terms apply to all users, including students, mentors, coaches, and administrators.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <Users className="w-6 h-6 text-[#D71920]" />
                User Accounts
              </h2>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-2">Account Creation</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>You must be at least 16 years old to create an account</li>
                    <li>You must provide accurate, complete, and current information</li>
                    <li>You are responsible for maintaining account security</li>
                    <li>You must not share your account credentials with others</li>
                    <li>You must notify us immediately of any unauthorized access</li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-2">Account Responsibilities</h3>
                  <p className="text-gray-700">
                    You are responsible for all activity that occurs under your account. We reserve the right to suspend or terminate accounts that violate these Terms.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-[#D71920]" />
                Subscription and Payments
              </h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>Free Plan:</strong> Basic access to limited features at no cost.</p>
                <p><strong>Pro Plan (£39/month):</strong> Access to recruiter profiles, open days, private messaging, and premium courses.</p>
                <p><strong>VIP Plan (£79/month):</strong> All Pro features plus AI Trainer, Open Day Simulator, and priority support.</p>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mt-4">
                  <h3 className="font-bold text-blue-900 mb-2">Billing Terms</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Subscriptions automatically renew monthly</li>
                    <li>Payments are processed securely through Stripe</li>
                    <li>Cancellations take effect at the end of the billing period</li>
                    <li>No refunds for partial months</li>
                    <li>Prices subject to change with 30 days notice</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceptable Use Policy</h2>
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <Ban className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-bold text-red-900 mb-3">You agree NOT to:</p>
                    <ul className="list-disc list-inside text-gray-700 space-y-2">
                      <li>Use the Service for any illegal or unauthorized purpose</li>
                      <li>Violate any laws in your jurisdiction</li>
                      <li>Harass, abuse, or harm other users</li>
                      <li>Post offensive, discriminatory, or inappropriate content</li>
                      <li>Spam, phish, or distribute malware</li>
                      <li>Attempt to access unauthorized areas of the platform</li>
                      <li>Reverse engineer or copy our software</li>
                      <li>Share copyrighted content without permission</li>
                      <li>Impersonate others or create fake accounts</li>
                      <li>Scrape or harvest user data</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Intellectual Property</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>Our Content:</strong> All course materials, training content, software, logos, and branding are owned by The Crew Academy and protected by copyright, trademark, and other intellectual property laws. You may not copy, distribute, or modify our content without written permission.
                </p>
                <p>
                  <strong>Your Content:</strong> You retain ownership of content you upload (CVs, photos, messages). By uploading, you grant us a license to use, store, and display this content as necessary to provide the Service.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <Shield className="w-6 h-6 text-[#D71920]" />
                AI Moderation and Content Monitoring
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We use AI-powered moderation to ensure a safe and respectful community. All messages, posts, and comments may be monitored for:
              </p>
              <ul className="list-disc list-inside text-gray-700 mt-3 space-y-1">
                <li>Inappropriate language or harassment</li>
                <li>Spam or fraudulent content</li>
                <li>Terms of Service violations</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                Content that violates our policies may be removed, and repeat offenders may have their accounts suspended or terminated.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Availability</h2>
              <p className="text-gray-700 leading-relaxed">
                We strive to provide 99.9% uptime, but we do not guarantee uninterrupted access. We may temporarily suspend the Service for maintenance, updates, or unforeseen issues. We are not liable for any damages resulting from service interruptions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-[#D71920]" />
                Disclaimers and Limitations
              </h2>
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
                <ul className="space-y-3 text-gray-700">
                  <li><strong>No Guarantee of Employment:</strong> Our training prepares you for airline careers, but we do not guarantee job placement.</li>
                  <li><strong>Educational Purpose:</strong> Content is for educational purposes and should not be considered professional advice.</li>
                  <li><strong>Third-Party Links:</strong> We are not responsible for external websites linked from our platform.</li>
                  <li><strong>AI Accuracy:</strong> AI-generated content may contain errors. Always verify important information.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                To the maximum extent permitted by law, The Crew Academy shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including lost profits, data loss, or business interruption, arising from your use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Indemnification</h2>
              <p className="text-gray-700 leading-relaxed">
                You agree to indemnify and hold harmless The Crew Academy from any claims, damages, losses, or expenses (including legal fees) arising from your violation of these Terms or misuse of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Termination</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>By You:</strong> You may cancel your subscription at any time through your account settings. Access continues until the end of the billing period.
                </p>
                <p>
                  <strong>By Us:</strong> We may suspend or terminate your account immediately if you violate these Terms, engage in fraudulent activity, or abuse the Service.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms are governed by the laws of England and Wales. Any disputes will be resolved in the courts of London, United Kingdom.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We may modify these Terms at any time. We will notify you of significant changes via email or platform notice. Continued use after changes constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
              <div className="bg-gradient-to-r from-[#D71920]/10 to-[#B91518]/10 rounded-xl p-6">
                <p className="text-gray-800 mb-4">
                  If you have questions about these Terms of Service:
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li><strong>Email:</strong> legal@thecrewacademy.com</li>
                  <li><strong>Support:</strong> Use the live chat on our platform</li>
                  <li><strong>Address:</strong> The Crew Academy, London, United Kingdom</li>
                </ul>
              </div>
            </section>

            <div className="bg-gray-100 rounded-xl p-6 text-center">
              <p className="text-sm text-gray-600">
                By using The Crew Academy, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
