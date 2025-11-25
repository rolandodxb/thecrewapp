import { motion } from 'framer-motion';
import { Mail, MessageSquare, Phone, MapPin, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function ContactUsPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      navigate('/');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 text-gray-600 hover:text-[#D71920] transition"
        >
          ← Back
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Get in Touch</h1>
              <p className="text-lg text-gray-600">
                Have questions? We're here to help. Reach out to us through any of the channels below.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4 bg-white rounded-2xl p-6 shadow-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-[#D71920] to-[#B91518] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Email Us</h3>
                  <p className="text-gray-600 mb-2">For general inquiries and support</p>
                  <a href="mailto:support@thecrewacademy.com" className="text-[#D71920] font-medium hover:underline">
                    support@thecrewacademy.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white rounded-2xl p-6 shadow-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Live Chat</h3>
                  <p className="text-gray-600 mb-2">Available for logged-in users</p>
                  <button
                    onClick={() => navigate('/support')}
                    className="text-blue-600 font-medium hover:underline"
                  >
                    Open Live Chat →
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white rounded-2xl p-6 shadow-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Phone Support</h3>
                  <p className="text-gray-600 mb-2">VIP members only</p>
                  <p className="text-green-600 font-medium">Mon-Fri, 9am-6pm GMT</p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white rounded-2xl p-6 shadow-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Our Location</h3>
                  <p className="text-gray-600">
                    The Crew Academy<br />
                    London, United Kingdom
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl shadow-2xl p-8"
          >
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Send className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Message Sent!</h2>
                <p className="text-gray-600 mb-6">
                  Thank you for contacting us. We'll get back to you within 24 hours.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition"
                >
                  Return Home
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Send us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#D71920] transition"
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#D71920] transition"
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#D71920] transition"
                      placeholder="What's this about?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
                    <textarea
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#D71920] transition resize-none"
                      placeholder="Tell us more about your inquiry..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold text-lg hover:shadow-xl transition transform hover:scale-[1.02]"
                  >
                    Send Message
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
