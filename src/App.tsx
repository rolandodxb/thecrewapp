import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useApp, AppProvider } from './context/AppContext';
import Layout from './components/layout/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import Dashboard from './pages/Dashboard';
import CoursesPage from './pages/CoursesPage';
import CommunityPage from './pages/CommunityPage';
import ProfilePage from './pages/ProfilePage';
import SupportPage from './pages/SupportPage';
import SupportChatPage from './pages/SupportChatPage';
import SupportChatManagerPage from './pages/SupportChatManagerPage';
import CoachDashboard from './pages/CoachDashboard';
import NewCoachDashboard from './pages/NewCoachDashboard';
import MainModuleViewerPage from './pages/MainModuleViewerPage';
import SubmoduleViewerPage from './pages/SubmoduleViewerPage';
import GovernorControlNexus from './pages/governor/GovernorControlNexus';
import ChatModerationConsole from './pages/governor/ChatModerationConsole';
import FeatureShutdownControl from './pages/governor/FeatureShutdownControl';
import PlaceholderPage from './pages/PlaceholderPage';
import NotificationsPage from './pages/NotificationsPage';
import WhatsNewPage from './pages/WhatsNewPage';
import AITrainerPage from './pages/AITrainerPage';
import OpenDaySimulatorPage from './pages/OpenDaySimulatorPage';
import RecruiterListPage from './pages/RecruiterListPage';
import RecruitersPage from './pages/RecruitersPage';
import OpenDaysPage from './pages/OpenDaysPage';
import UpgradePlanPage from './pages/UpgradePlanPage';
import CourseViewerPage from './pages/CourseViewerPage';
import ModuleViewerPage from './pages/ModuleViewerPage';
import DocumentationPage from './pages/DocumentationPage';
import StudentsPage from './pages/StudentsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import InitializeData from './pages/governor/InitializeData';
import MyProgressPage from './pages/MyProgressPage';
import LessonViewerPage from './pages/LessonViewerPage';
import VideoCoursePage from './pages/VideoCoursePage';
import CreateModulePage from './pages/CreateModulePage';
import CreateCoursePage from './pages/CreateCoursePage';
import SettingsPage from './pages/SettingsPage';
import NotificationSettingsPage from './pages/NotificationSettingsPage';
import AnalyticsDashboard from './pages/governor/AnalyticsDashboard';
import FeatureFlagsManager from './pages/governor/FeatureFlagsManager';
import StorageManagerPage from './pages/StorageManagerPage';
import LoginActivityPage from './pages/LoginActivityPage';
import CommunityFeedPage from './pages/CommunityFeedPage';
import AuditLogsPage from './pages/governor/AuditLogsPage';
import ModerationInsightsPage from './pages/governor/ModerationInsightsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import ContactUsPage from './pages/ContactUsPage';
import MarketplacePage from './pages/MarketplacePage';
import CreateProductPage from './pages/CreateProductPage';
import ProductDetailPage from './pages/ProductDetailPage';
import MarketplaceCheckoutPage from './pages/MarketplaceCheckoutPage';
import MyProductsPage from './pages/MyProductsPage';
import MyOrdersPage from './pages/MyOrdersPage';
import SellerDashboard from './pages/SellerDashboard';
import SellerBillingDashboard from './pages/SellerBillingDashboard';
import AttendanceDashboard from './pages/AttendanceDashboard';
import FinanceDashboard from './pages/FinanceDashboard';
import ModeratorDashboard from './pages/ModeratorDashboard';
import AIAssistantButton from './components/AIAssistantButton';
import { ModerationWarningModal } from './components/ModerationWarningModal';
import { useState, useEffect } from 'react';
import ReputationManager from './pages/governor/ReputationManager';
import ReputationTester from './pages/governor/ReputationTester';
import InviteFriendsPage from './pages/InviteFriendsPage';
import AffiliateDashboardPage from './pages/AffiliateDashboardPage';
import WalletPage from './pages/WalletPage';
import StaffActivityManagementPage from './pages/StaffActivityManagementPage';
import StudentEventsPage from './pages/StudentEventsPage';
import WaitlistPage from './pages/WaitlistPage';
import StaffCodePage from './pages/StaffCodePage';
import WaitlistDashboard from './pages/governor/WaitlistDashboard';

function MaintenanceScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EADBC8] via-[#F5E6D3] to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <h1 className="text-3xl font-bold text-[#1C1C1C] mb-4">System Maintenance</h1>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { currentUser, loading, maintenanceMode, maintenanceMessage } = useApp();
  const [warningModal, setWarningModal] = useState({ isOpen: false, message: '' });

  useEffect(() => {
    const handleWarning = (event: CustomEvent) => {
      setWarningModal({ isOpen: true, message: event.detail.message });
    };

    window.addEventListener('showModerationWarning', handleWarning as EventListener);
    return () => {
      window.removeEventListener('showModerationWarning', handleWarning as EventListener);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#EADBC8] via-[#F5E6D3] to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-[#D71920] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h2>
          <p className="text-gray-600">Please wait</p>
        </div>
      </div>
    );
  }

  if (maintenanceMode && currentUser?.role !== 'governor') {
    return <MaintenanceScreen message={maintenanceMessage} />;
  }

  if (!currentUser) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/waitlist" element={<WaitlistPage />} />
        <Route path="/staff-code" element={<StaffCodePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/contact" element={<ContactUsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <AIAssistantButton />
      <ModerationWarningModal
        isOpen={warningModal.isOpen}
        message={warningModal.message}
        onClose={() => setWarningModal({ isOpen: false, message: '' })}
      />
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:courseId" element={<CourseViewerPage />} />
        <Route path="/modules/:moduleId" element={<ModuleViewerPage />} />
        <Route path="/video-course/:moduleId" element={<VideoCoursePage />} />
        <Route path="/chat" element={<CommunityPage />} />
        <Route path="/community-feed" element={<CommunityFeedPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/invite-friends" element={<InviteFriendsPage />} />
        <Route path="/affiliate-dashboard" element={<AffiliateDashboardPage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/activities-manage" element={<StaffActivityManagementPage />} />
        <Route path="/events" element={<StudentEventsPage />} />
        <Route path="/student-events" element={<StudentEventsPage />} />
        <Route path="/settings/notifications" element={<NotificationSettingsPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/support-chat" element={<SupportChatPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/whats-new" element={<WhatsNewPage />} />
        <Route path="/documentation" element={<DocumentationPage />} />
        <Route path="/ai-trainer" element={<AITrainerPage />} />
        <Route path="/open-day" element={<OpenDaySimulatorPage />} />
        <Route path="/recruiters" element={<RecruitersPage />} />
        <Route path="/open-days" element={<OpenDaysPage />} />
        <Route path="/upgrade" element={<UpgradePlanPage />} />

        <Route path="/students" element={<StudentsPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/my-progress" element={<MyProgressPage />} />
        <Route path="/lesson/:courseId/:moduleId/:lessonId" element={<LessonViewerPage />} />
        <Route path="/main-modules/:moduleId" element={<MainModuleViewerPage />} />
        <Route path="/submodules/:submoduleId" element={<SubmoduleViewerPage />} />
        <Route path="/course/:courseId" element={<CourseViewerPage />} />
        <Route path="/storage" element={<StorageManagerPage />} />
        <Route path="/login-activity" element={<LoginActivityPage />} />

        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/marketplace/create" element={<CreateProductPage />} />
        <Route path="/marketplace/product/:productId" element={<ProductDetailPage />} />
        <Route path="/marketplace/checkout/:productId" element={<MarketplaceCheckoutPage />} />
        <Route path="/marketplace/my-products" element={<MyProductsPage />} />
        <Route path="/marketplace/orders" element={<MyOrdersPage />} />
        <Route path="/seller/dashboard" element={<SellerDashboard />} />
        <Route path="/seller/billing" element={<SellerBillingDashboard />} />
        <Route path="/attendance" element={<AttendanceDashboard />} />

        {/* Finance Dashboard */}
        {(currentUser.role === 'finance' || currentUser.role === 'governor') && (
          <Route path="/finance-dashboard" element={<FinanceDashboard />} />
        )}

        {/* Moderator Dashboard */}
        {(currentUser.role === 'moderator' || currentUser.role === 'governor') && (
          <Route path="/moderator-dashboard" element={<ModeratorDashboard />} />
        )}

        {(currentUser.role === 'mentor' || currentUser.role === 'governor') && (
          <>
            <Route path="/coach-dashboard" element={<NewCoachDashboard />} />
            <Route path="/create-module" element={<CreateModulePage />} />
            <Route path="/create-course" element={<CreateCoursePage />} />
          </>
        )}

        {currentUser.role !== 'student' && (
          <Route path="/support-manager" element={<SupportChatManagerPage />} />
        )}

        {(currentUser.role === 'governor' || currentUser.role === 'mentor') && (
          <>
            <Route path="/governor/nexus" element={<GovernorControlNexus />} />
            <Route path="/governor/initialize" element={<InitializeData />} />
            <Route path="/governor/moderation" element={<ChatModerationConsole />} />
            <Route path="/governor/shutdown" element={<FeatureShutdownControl />} />
            <Route path="/governor/analytics" element={<AnalyticsDashboard />} />
            <Route path="/governor/feature-flags" element={<FeatureFlagsManager />} />
            <Route path="/governor/audit-logs" element={<AuditLogsPage />} />
            <Route path="/governor/moderation-insights" element={<ModerationInsightsPage />} />
            <Route path="/governor/reputation" element={<ReputationManager />} />
            <Route path="/governor/reputation-tester" element={<ReputationTester />} />
            <Route path="/governor/waitlist" element={<WaitlistDashboard />} />
          </>
        )}

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </BrowserRouter>
  );
}
