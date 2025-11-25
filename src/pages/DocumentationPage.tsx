import { BookOpen, Users, Shield, Award, MessageCircle, GraduationCap, Video, FileText, Crown, Zap } from 'lucide-react';

export default function DocumentationPage() {
  return (
    <div className="min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#1C1C1C] mb-2">Documentation</h1>
        <p className="text-gray-600">Complete guide to The Crew Academy Platform</p>
      </div>

      <div className="space-y-8">
        <section className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-[#D71920] to-[#E6282C] rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-[#1C1C1C]">About The Crew Academy</h2>
          </div>
          <div className="prose max-w-none text-gray-700 space-y-4">
            <p className="text-lg leading-relaxed">
              The Crew Academy is a comprehensive learning management system designed specifically for aspiring cabin crew professionals.
              Our platform provides world-class training resources, interactive learning experiences, and direct mentorship opportunities
              to help you achieve your dream of joining the aviation industry.
            </p>
            <p className="leading-relaxed">
              The platform combines cutting-edge technology with industry expertise to deliver an engaging and effective learning experience.
              From interview preparation to service excellence training, we cover every aspect of cabin crew preparation.
            </p>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-[#B9975B] to-[#A8865A] rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-[#1C1C1C]">User Roles</h2>
          </div>
          <div className="space-y-6">
            <div className="border-l-4 border-blue-500 pl-6 py-4 bg-blue-50 rounded-r-lg">
              <h3 className="text-xl font-bold text-[#1C1C1C] mb-2 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Student
              </h3>
              <p className="text-gray-700 mb-3">The default role for learners on the platform.</p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Access courses based on subscription plan (Free, Pro, VIP)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Participate in Open Day simulations and quizzes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Use AI Trainer for interview practice</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Message mentors and other students</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Track learning progress on dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Browse recruiter database and open day schedules</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Access support chat for help</span>
                </li>
              </ul>
            </div>

            <div className="border-l-4 border-green-500 pl-6 py-4 bg-green-50 rounded-r-lg">
              <h3 className="text-xl font-bold text-[#1C1C1C] mb-2 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-green-600" />
                Mentor
              </h3>
              <p className="text-gray-700 mb-3">Experienced professionals who create and manage educational content.</p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Upload and manage courses (PDF and video content)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Set course access levels (Free, Pro, VIP)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Organize content by categories (Grooming, Service, Safety, Interview, Language)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Enable/disable PDF downloads for students</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Communicate with students via messaging</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>All student privileges included</span>
                </li>
              </ul>
            </div>

            <div className="border-l-4 border-purple-500 pl-6 py-4 bg-purple-50 rounded-r-lg">
              <h3 className="text-xl font-bold text-[#1C1C1C] mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                Governor
              </h3>
              <p className="text-gray-700 mb-3">System administrators with full platform control.</p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>Access Governor Control Nexus (central command center)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>Manage all users (view, edit, upgrade/downgrade plans, change roles)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>Suppress or delete any course from the platform</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>Manage support tickets and chat with students</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>Create system-wide announcements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>Enable/disable maintenance mode</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>View real-time system metrics and logs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>Execute system commands via command console</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>All mentor and student privileges included</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-[#FF3B3F] to-[#E6282C] rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-[#1C1C1C]">Subscription Plans</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border-2 border-gray-300 rounded-xl p-6 hover:shadow-lg transition">
              <h3 className="text-2xl font-bold text-[#1C1C1C] mb-2">Free</h3>
              <p className="text-gray-600 mb-4">Perfect for getting started</p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Access to Free tier courses</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Basic Open Day simulations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Limited AI Trainer usage</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Community messaging</span>
                </li>
              </ul>
            </div>

            <div className="border-2 border-[#FF3B3F] rounded-xl p-6 hover:shadow-lg transition bg-gradient-to-b from-white to-red-50">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-6 h-6 text-[#FF3B3F]" />
                <h3 className="text-2xl font-bold text-[#1C1C1C]">Pro</h3>
              </div>
              <p className="text-gray-600 mb-4">For serious learners</p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>All Free features</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Access to Pro tier courses</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Advanced simulations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Unlimited AI Trainer</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Priority support</span>
                </li>
              </ul>
            </div>

            <div className="border-2 border-[#B9975B] rounded-xl p-6 hover:shadow-lg transition bg-gradient-to-b from-white to-yellow-50">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-6 h-6 text-[#B9975B]" />
                <h3 className="text-2xl font-bold text-[#1C1C1C]">VIP</h3>
              </div>
              <p className="text-gray-600 mb-4">The ultimate experience</p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>All Pro features</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Access to VIP exclusive courses</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>1-on-1 mentor sessions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Personalized learning path</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Premium support (24/7)</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-[#1C1C1C] to-[#2C2C2C] rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-[#1C1C1C]">Platform Features</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Video className="w-6 h-6 text-[#D71920]" />
                <h3 className="text-xl font-bold text-[#1C1C1C]">Course Library</h3>
              </div>
              <p className="text-gray-700">
                Extensive collection of courses covering grooming standards, customer service excellence, safety procedures,
                interview preparation, and language skills. Courses include both PDF documents and tailor-made video content,
                organized by difficulty level and access tier.
              </p>
            </div>

            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-[#D71920]" />
                <h3 className="text-xl font-bold text-[#1C1C1C]">AI Trainer</h3>
              </div>
              <p className="text-gray-700">
                Interactive AI-powered interview coach that simulates real cabin crew interviews. Practice common questions,
                receive instant feedback, and improve your responses. Uses advanced AI to provide personalized coaching
                and identify areas for improvement.
              </p>
            </div>

            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-6 h-6 text-[#D71920]" />
                <h3 className="text-xl font-bold text-[#1C1C1C]">Open Day Simulator</h3>
              </div>
              <p className="text-gray-700">
                Realistic simulation of airline open day assessments. Complete English tests, watch presentation videos,
                and take quizzes to evaluate your readiness. Receive detailed performance reports and recommendations
                for improvement.
              </p>
            </div>

            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <MessageCircle className="w-6 h-6 text-[#D71920]" />
                <h3 className="text-xl font-bold text-[#1C1C1C]">Messaging System</h3>
              </div>
              <p className="text-gray-700">
                Connect with mentors and fellow students through private 1-on-1 conversations or participate in the
                public group chat. Share experiences, ask questions, and build your professional network within the
                aviation community.
              </p>
            </div>

            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="w-6 h-6 text-[#D71920]" />
                <h3 className="text-xl font-bold text-[#1C1C1C]">Recruiter Database</h3>
              </div>
              <p className="text-gray-700">
                Comprehensive database of airline recruiters and open day schedules. Filter by airline, location, and date.
                Get detailed information about requirements, application processes, and direct contact information.
              </p>
            </div>

            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <MessageCircle className="w-6 h-6 text-[#D71920]" />
                <h3 className="text-xl font-bold text-[#1C1C1C]">Support Chat</h3>
              </div>
              <p className="text-gray-700">
                Get instant help through our live support chat system. Create support tickets that are managed by our
                team of governors. Track conversation history, receive real-time responses, and get your questions
                answered quickly.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-[#D71920] to-[#E6282C] rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-[#1C1C1C]">System Architecture</h2>
          </div>
          <div className="space-y-6 text-gray-700">
            <div>
              <h3 className="text-xl font-bold text-[#1C1C1C] mb-3">Technology Stack</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-[#D71920] font-bold">•</span>
                  <span><strong>Frontend:</strong> React with TypeScript, Vite build tool, Tailwind CSS for styling, Framer Motion for animations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D71920] font-bold">•</span>
                  <span><strong>Backend:</strong> Firebase (Firestore database, Authentication, Storage for PDFs)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D71920] font-bold">•</span>
                  <span><strong>AI Integration:</strong> DeepSeek API for AI Trainer functionality</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D71920] font-bold">•</span>
                  <span><strong>Video Content:</strong> YouTube embedded player for video courses</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold text-[#1C1C1C] mb-3">Data Structure</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-[#D71920] font-bold">•</span>
                  <span><strong>users:</strong> User profiles with authentication data, roles, subscription plans</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D71920] font-bold">•</span>
                  <span><strong>courses:</strong> Educational content with PDF/video URLs, access levels, categories</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D71920] font-bold">•</span>
                  <span><strong>conversations:</strong> Private messaging between users with message subcollections</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D71920] font-bold">•</span>
                  <span><strong>groupChats:</strong> Public chat room messages</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D71920] font-bold">•</span>
                  <span><strong>supportTickets:</strong> Support conversations with message subcollections and status tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D71920] font-bold">•</span>
                  <span><strong>open_day_simulations:</strong> User simulation attempts and results</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D71920] font-bold">•</span>
                  <span><strong>aiTrainerSessions:</strong> AI training session history</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D71920] font-bold">•</span>
                  <span><strong>systemControl:</strong> Platform-wide settings and announcements</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold text-[#1C1C1C] mb-3">Security Features</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-[#D71920] font-bold">•</span>
                  <span>Firebase Authentication with secure email/password login</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D71920] font-bold">•</span>
                  <span>Firestore security rules enforcing role-based access control</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D71920] font-bold">•</span>
                  <span>Storage rules protecting course materials</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D71920] font-bold">•</span>
                  <span>API key encryption for sensitive credentials</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D71920] font-bold">•</span>
                  <span>Governor-level permissions for administrative actions</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-r from-[#D71920] to-[#E6282C] rounded-2xl shadow-lg p-8 text-white">
          <h2 className="text-3xl font-bold mb-4">Need More Help?</h2>
          <p className="text-lg mb-6">
            Our support team is here to assist you. Click the "Start Chat" button on the Support page to connect
            with a governor who can answer your questions in real-time.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="/support"
              className="px-6 py-3 bg-white text-[#D71920] rounded-lg font-bold hover:shadow-lg transition"
            >
              Contact Support
            </a>
            <a
              href="mailto:support@thecrewacademy.co"
              className="px-6 py-3 bg-white/10 backdrop-blur-sm border-2 border-white text-white rounded-lg font-bold hover:bg-white/20 transition"
            >
              Email Us
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
