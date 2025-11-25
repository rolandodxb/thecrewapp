import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Wallet,
  Camera,
  QrCode,
  Ticket,
  LayoutDashboard,
  BookOpen,
  MessageCircle,
  HelpCircle,
  Users,
  GraduationCap,
  Brain,
  Plane,
  Briefcase,
  Crown,
  Lock,
  Calendar,
  UserCircle,
  Zap,
  Shield,
  Trophy,
  TrendingUp,
  BarChart3,
  Flag,
  HardDrive,
  Clock,
  Rss,
  ShoppingBag,
  DollarSign,
  Package,
  ClipboardList,
  Play,
  UserPlus,
  Link as LinkIcon,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Link, useLocation } from 'react-router-dom';
import { checkFeatureAccess, Feature } from '../../utils/featureAccess';
import { motion, AnimatePresence } from 'framer-motion';

interface NavGroup {
  label: string;
  icon: any;
  items: Array<{
    path: string;
    icon: any;
    label: string;
    locked?: boolean;
    feature?: Feature | null;
    badge?: string;
    highlight?: boolean;
  }>;
}

export default function Sidebar() {
  const { currentUser } = useApp();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        const clickedButton = Object.values(buttonRefs.current).some(btn => btn?.contains(target));
        if (!clickedButton) {
          setOpenDropdown(null);
          setDropdownPosition(null);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function updateDropdownPosition() {
      if (openDropdown && buttonRefs.current[openDropdown]) {
        const button = buttonRefs.current[openDropdown];
        if (button) {
          const rect = button.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + 8,
            left: rect.left
          });
        }
      }
    }

    if (openDropdown) {
      window.addEventListener('scroll', updateDropdownPosition, true);
      window.addEventListener('resize', updateDropdownPosition);
      return () => {
        window.removeEventListener('scroll', updateDropdownPosition, true);
        window.removeEventListener('resize', updateDropdownPosition);
      };
    }
  }, [openDropdown]);

  const handleDropdownToggle = (groupLabel: string) => {
    if (openDropdown === groupLabel) {
      setOpenDropdown(null);
      setDropdownPosition(null);
    } else {
      const button = buttonRefs.current[groupLabel];
      if (button) {
        const rect = button.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 8,
          left: rect.left
        });
      }
      setOpenDropdown(groupLabel);
    }
  };

  if (!currentUser) return null;

  const getStudentLinks = () => {
    const aiTrainerAccess = checkFeatureAccess(currentUser, 'ai-trainer');
    const simulatorAccess = checkFeatureAccess(currentUser, 'simulator');
    const recruitersAccess = checkFeatureAccess(currentUser, 'recruiters');
    const openDaysAccess = checkFeatureAccess(currentUser, 'opendays');
    const chatAccess = checkFeatureAccess(currentUser, 'chat');

    const baseLinks = [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', feature: null },
      { path: '/courses', icon: BookOpen, label: 'Courses', feature: null },
      { path: '/my-progress', icon: TrendingUp, label: 'My Progress', feature: null },
      {
        path: '/ai-trainer',
        icon: Brain,
        label: 'AI Trainer',
        locked: !aiTrainerAccess.allowed,
        feature: 'ai-trainer' as Feature
      },
      {
        path: '/open-day',
        icon: Plane,
        label: 'Open Day Sim',
        locked: !simulatorAccess.allowed,
        feature: 'simulator' as Feature
      },
      {
        path: '/community-feed',
        icon: Rss,
        label: 'Community',
        feature: null
      },
      {
        path: '/chat',
        icon: MessageCircle,
        label: 'Chat',
        locked: !chatAccess.allowed,
        feature: 'chat' as Feature
      },
      { path: '/leaderboard', icon: Trophy, label: 'Leaderboard', feature: null },
      {
        path: '/recruiters',
        icon: Briefcase,
        label: 'Career',
        locked: !recruitersAccess.allowed,
        feature: 'recruiters' as Feature
      },
      {
        path: '/open-days',
        icon: Calendar,
        label: 'Open Days',
        locked: !openDaysAccess.allowed,
        feature: 'opendays' as Feature
      },
      { path: '/student-events', icon: Ticket, label: 'Events', feature: null },
      { path: '/marketplace', icon: ShoppingBag, label: 'Shop', feature: null },
      { path: '/wallet', icon: Wallet, label: 'My Wallet', feature: null, badge: 'NEW' },
      { path: '/invite-friends', icon: UserPlus, label: 'Invite Friends', feature: null, badge: 'NEW' },
      ...(currentUser.plan === 'pro' || currentUser.plan === 'vip' ? [
        { path: '/storage', icon: HardDrive, label: 'My Files', feature: null, badge: 'PRO' },
        { path: '/login-activity', icon: Clock, label: 'Login Activity', feature: null, badge: 'PRO' }
      ] : []),
      { path: '/support', icon: HelpCircle, label: 'Help', feature: null },
      { path: '/profile', icon: UserCircle, label: 'Account', feature: null },
      { path: '/upgrade', icon: Crown, label: 'Upgrade Plan', highlight: currentUser.plan !== 'vip', feature: null },
      ...(currentUser.role !== 'student' ? [{ path: '/support-manager', icon: MessageCircle, label: 'Support Manager', feature: null }] : [])
    ];

    return baseLinks;
  };

  const studentLinks = currentUser.role === 'student' ? getStudentLinks() : [];

  const mentorLinks = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/coach-dashboard', icon: GraduationCap, label: 'Coach Dashboard', highlight: true },
    { path: '/students', icon: Users, label: 'Students' },
    { path: '/attendance', icon: ClipboardList, label: 'Attendance', badge: 'NEW' },
    { path: '/community-feed', icon: Rss, label: 'Community' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/recruiters', icon: Briefcase, label: 'Career' },
    { path: '/open-days', icon: Calendar, label: 'Open Days' },
    { path: '/student-events', icon: Ticket, label: 'Events' },
    { path: '/activities-manage', icon: Calendar, label: 'Manage Activities', badge: 'NEW' },
    { path: '/marketplace', icon: ShoppingBag, label: 'Shop', badge: 'NEW' },
    { path: '/seller/dashboard', icon: Package, label: 'Seller Dashboard', badge: 'NEW' },
    { path: '/seller/billing', icon: DollarSign, label: 'My Earnings', badge: 'NEW' },
    { path: '/affiliate-dashboard', icon: LinkIcon, label: 'Affiliate Program', badge: 'NEW' },
    { path: '/wallet', icon: Wallet, label: 'My Wallet', badge: 'NEW' },
    { path: '/invite-friends', icon: UserPlus, label: 'Invite Friends', badge: 'NEW' },
    { path: '/governor/reputation', icon: TrendingUp, label: 'Reputation Manager', badge: 'NEW' },
    { path: '/support', icon: HelpCircle, label: 'Help' },
    { path: '/profile', icon: UserCircle, label: 'Account' },
  ];

  const financeLinks = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/finance-dashboard', icon: DollarSign, label: 'Finance Dashboard', highlight: true, badge: 'NEW' },
    { path: '/seller/billing', icon: TrendingUp, label: 'Revenue Overview' },
    { path: '/community-feed', icon: Rss, label: 'Community' },
    { path: '/student-events', icon: Ticket, label: 'Events' },
    { path: '/marketplace', icon: ShoppingBag, label: 'Shop' },
    { path: '/support', icon: HelpCircle, label: 'Help' },
    { path: '/profile', icon: UserCircle, label: 'Account' },
  ];

  const moderatorLinks = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/moderator-dashboard', icon: Shield, label: 'Moderator Dashboard', highlight: true, badge: 'NEW' },
    { path: '/community-feed', icon: Rss, label: 'Community' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/student-events', icon: Ticket, label: 'Events' },
    { path: '/marketplace', icon: ShoppingBag, label: 'Shop' },
    { path: '/support', icon: HelpCircle, label: 'Help' },
    { path: '/profile', icon: UserCircle, label: 'Account' },
  ];

  const governorLinks = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/governor/nexus', icon: Zap, label: 'Control Nexus', highlight: true },
    { path: '/governor/analytics', icon: BarChart3, label: 'Analytics', badge: 'NEW' },
    { path: '/governor/feature-flags', icon: Flag, label: 'Feature Flags', badge: 'NEW' },
    { path: '/governor/audit-logs', icon: Shield, label: 'Audit Logs', badge: 'NEW' },
    { path: '/moderator-dashboard', icon: Shield, label: 'Moderator Dashboard', badge: 'NEW' },
    { path: '/governor/reputation', icon: TrendingUp, label: 'Reputation Manager', badge: 'NEW' },
    { path: '/governor/reputation-tester', icon: Play, label: 'Test Reputation', badge: 'TEST' },
    { path: '/coach-dashboard', icon: GraduationCap, label: 'Coach Dashboard' },
    { path: '/students', icon: Users, label: 'Students' },
    { path: '/attendance', icon: ClipboardList, label: 'Attendance', badge: 'NEW' },
    { path: '/ai-trainer', icon: Brain, label: 'AI Trainer', badge: 'ALL' },
    { path: '/open-day', icon: Plane, label: 'Open Day Sim', badge: 'ALL' },
    { path: '/community-feed', icon: Rss, label: 'Community', badge: 'NEW' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/recruiters', icon: Briefcase, label: 'Career' },
    { path: '/open-days', icon: Calendar, label: 'Open Days' },
    { path: '/student-events', icon: Ticket, label: 'Events' },
    { path: '/activities-manage', icon: Calendar, label: 'Manage Activities', badge: 'NEW' },
    { path: '/marketplace', icon: ShoppingBag, label: 'Shop', badge: 'NEW' },
    { path: '/seller/dashboard', icon: Package, label: 'Seller Dashboard', badge: 'NEW' },
    { path: '/seller/billing', icon: DollarSign, label: 'My Earnings', badge: 'NEW' },
    { path: '/affiliate-dashboard', icon: LinkIcon, label: 'Affiliate Program', badge: 'NEW' },
    { path: '/wallet', icon: Wallet, label: 'My Wallet', badge: 'NEW' },
    { path: '/invite-friends', icon: UserPlus, label: 'Invite Friends', badge: 'NEW' },
    { path: '/storage', icon: HardDrive, label: 'Storage Manager' },
    { path: '/login-activity', icon: Clock, label: 'Login Activity' },
    { path: '/support', icon: HelpCircle, label: 'Help' },
    { path: '/support-manager', icon: MessageCircle, label: 'Support Manager' },
    { path: '/profile', icon: UserCircle, label: 'Account' },
  ];

  const links =
    currentUser.role === 'governor' ? governorLinks :
    currentUser.role === 'mentor' ? mentorLinks :
    currentUser.role === 'finance' ? financeLinks :
    currentUser.role === 'moderator' ? moderatorLinks :
    studentLinks;

  const getGroupedNavigation = (): NavGroup[] => {
    if (currentUser.role === 'student') {
      const aiTrainerAccess = checkFeatureAccess(currentUser, 'ai-trainer');
      const simulatorAccess = checkFeatureAccess(currentUser, 'simulator');
      const chatAccess = checkFeatureAccess(currentUser, 'chat');
      const recruitersAccess = checkFeatureAccess(currentUser, 'recruiters');
      const openDaysAccess = checkFeatureAccess(currentUser, 'opendays');

      return [
        {
          label: 'Learning',
          icon: BookOpen,
          items: [
            { path: '/courses', icon: BookOpen, label: 'Courses', feature: null },
            { path: '/my-progress', icon: TrendingUp, label: 'My Progress', feature: null },
            { path: '/ai-trainer', icon: Brain, label: 'AI Trainer', locked: !aiTrainerAccess.allowed, feature: 'ai-trainer' },
            { path: '/open-day', icon: Plane, label: 'Simulator', locked: !simulatorAccess.allowed, feature: 'simulator' },
          ]
        },
        {
          label: 'Community',
          icon: Users,
          items: [
            { path: '/community-feed', icon: Rss, label: 'Feed', feature: null },
            { path: '/chat', icon: MessageCircle, label: 'Chat', locked: !chatAccess.allowed, feature: 'chat' },
            { path: '/leaderboard', icon: Trophy, label: 'Leaderboard', feature: null },
          ]
        },
        {
          label: 'Career',
          icon: Briefcase,
          items: [
            { path: '/recruiters', icon: Briefcase, label: 'Recruiters', locked: !recruitersAccess.allowed, feature: 'recruiters' },
            { path: '/open-days', icon: Calendar, label: 'Open Days', locked: !openDaysAccess.allowed, feature: 'opendays' },
          ]
        },
        {
          label: 'Events',
          icon: Ticket,
          items: [
            { path: '/student-events', icon: Ticket, label: 'Events', feature: null },
          ]
        },
        {
          label: 'Account',
          icon: UserCircle,
          items: [
            { path: '/profile', icon: UserCircle, label: 'Profile', feature: null },
            { path: '/wallet', icon: Wallet, label: 'Wallet', badge: 'NEW', feature: null },
            { path: '/invite-friends', icon: UserPlus, label: 'Invite', badge: 'NEW', feature: null },
            ...(currentUser.plan === 'pro' || currentUser.plan === 'vip' ? [
              { path: '/storage', icon: HardDrive, label: 'Files', badge: 'PRO', feature: null },
              { path: '/login-activity', icon: Clock, label: 'Activity', badge: 'PRO', feature: null }
            ] : []),
            { path: '/upgrade', icon: Crown, label: 'Upgrade Plan', feature: null },
          ]
        },
      ];
    }

    if (currentUser.role === 'mentor') {
      return [
        {
          label: 'Teaching',
          icon: GraduationCap,
          items: [
            { path: '/coach-dashboard', icon: GraduationCap, label: 'Coach Dashboard', highlight: true },
            { path: '/students', icon: Users, label: 'Students' },
            { path: '/attendance', icon: ClipboardList, label: 'Attendance', badge: 'NEW' },
          ]
        },
        {
          label: 'Business',
          icon: ShoppingBag,
          items: [
            { path: '/marketplace', icon: ShoppingBag, label: 'Marketplace', badge: 'NEW' },
            { path: '/seller/dashboard', icon: Package, label: 'Seller', badge: 'NEW' },
            { path: '/seller/billing', icon: DollarSign, label: 'Earnings', badge: 'NEW' },
            { path: '/affiliate-dashboard', icon: LinkIcon, label: 'Affiliates', badge: 'NEW' },
          ]
        },
        {
          label: 'Community',
          icon: Users,
          items: [
            { path: '/chat', icon: MessageCircle, label: 'Chat' },
            { path: '/community-feed', icon: Rss, label: 'Feed' },
            { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
          ]
        },
        {
          label: 'Events',
          icon: Calendar,
          items: [
            { path: '/activities-manage', icon: Calendar, label: 'Manage Activities', badge: 'NEW' },
          ]
        },
        {
          label: 'Account',
          icon: UserCircle,
          items: [
            { path: '/profile', icon: UserCircle, label: 'Profile' },
            { path: '/wallet', icon: Wallet, label: 'Wallet', badge: 'NEW' },
            { path: '/invite-friends', icon: UserPlus, label: 'Invite', badge: 'NEW' },
          ]
        },
      ];
    }

    if (currentUser.role === 'governor') {
      return [
        {
          label: 'Control',
          icon: Zap,
          items: [
            { path: '/governor/nexus', icon: Zap, label: 'Nexus', highlight: true },
            { path: '/governor/analytics', icon: BarChart3, label: 'Analytics', badge: 'NEW' },
            { path: '/governor/feature-flags', icon: Flag, label: 'Flags', badge: 'NEW' },
            { path: '/governor/audit-logs', icon: Shield, label: 'Audit', badge: 'NEW' },
            { path: '/moderator-dashboard', icon: Shield, label: 'Moderation', badge: 'NEW' },
          ]
        },
        {
          label: 'Management',
          icon: Users,
          items: [
            { path: '/students', icon: Users, label: 'Students' },
            { path: '/coach-dashboard', icon: GraduationCap, label: 'Coach' },
            { path: '/attendance', icon: ClipboardList, label: 'Attendance', badge: 'NEW' },
          ]
        },
        {
          label: 'Business',
          icon: ShoppingBag,
          items: [
            { path: '/marketplace', icon: ShoppingBag, label: 'Marketplace', badge: 'NEW' },
            { path: '/seller/dashboard', icon: Package, label: 'Seller', badge: 'NEW' },
            { path: '/affiliate-dashboard', icon: LinkIcon, label: 'Affiliates', badge: 'NEW' },
          ]
        },
        {
          label: 'Community',
          icon: Users,
          items: [
            { path: '/chat', icon: MessageCircle, label: 'Chat' },
            { path: '/community-feed', icon: Rss, label: 'Feed' },
            { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
          ]
        },
        {
          label: 'Tools',
          icon: Brain,
          items: [
            { path: '/ai-trainer', icon: Brain, label: 'AI Trainer', badge: 'ALL' },
            { path: '/open-day', icon: Plane, label: 'Simulator', badge: 'ALL' },
            { path: '/storage', icon: HardDrive, label: 'Storage' },
          ]
        },
        {
          label: 'Events',
          icon: Camera,
          items: [
            { path: '/activities-manage', icon: Calendar, label: 'Manage Activities', badge: 'NEW' },
          ]
        },
        {
          label: 'Account',
          icon: UserCircle,
          items: [
            { path: '/profile', icon: UserCircle, label: 'Profile' },
            { path: '/wallet', icon: Wallet, label: 'Wallet', badge: 'NEW' },
            { path: '/invite-friends', icon: UserPlus, label: 'Invite', badge: 'NEW' },
            { path: '/support', icon: HelpCircle, label: 'Support' },
          ]
        },
      ];
    }

    return [];
  };

  const groupedNav = getGroupedNavigation();
  const topLevelItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  ];

  return (
    <>
      {/* Horizontal Sidebar - Grouped Navigation */}
      <aside className="w-full liquid-sidebar border-b border-white/20 relative z-[100]">
        <div className="p-3">
          <nav className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-400/20 scrollbar-track-transparent">
            {/* Dashboard */}
            {topLevelItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                    isActive
                      ? 'glass-primary text-gray-900 shadow-lg'
                      : 'text-gray-700 glass-button-secondary hover:glass-primary'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              );
            })}

            {/* Grouped navigation dropdowns in order: Learning, Community, Career, Events */}
            {groupedNav.map((group) => {
              const GroupIcon = group.icon;
              const isOpen = openDropdown === group.label;
              const hasActiveItem = group.items.some(item => location.pathname === item.path);

              return (
                <div key={group.label}>
                  <button
                    ref={(el) => buttonRefs.current[group.label] = el}
                    onClick={() => handleDropdownToggle(group.label)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                      hasActiveItem || isOpen
                        ? 'glass-primary text-gray-900 shadow-lg'
                        : 'text-gray-700 glass-button-secondary hover:glass-primary'
                    }`}
                  >
                    <GroupIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium text-sm">{group.label}</span>
                    <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              );
            })}

            {/* Shop, Help, Account at the end */}
            {currentUser.role === 'student' && (
              <>
                <Link
                  to="/marketplace"
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                    location.pathname === '/marketplace'
                      ? 'glass-primary text-gray-900 shadow-lg'
                      : 'text-gray-700 glass-button-secondary hover:glass-primary'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium text-sm">Shop</span>
                </Link>
                <Link
                  to="/support"
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                    location.pathname === '/support'
                      ? 'glass-primary text-gray-900 shadow-lg'
                      : 'text-gray-700 glass-button-secondary hover:glass-primary'
                  }`}
                >
                  <HelpCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium text-sm">Help</span>
                </Link>
              </>
            )}
          </nav>
        </div>
      </aside>

      {/* Portal dropdowns */}
      {openDropdown && dropdownPosition && createPortal(
        <motion.div
          key={openDropdown}
          ref={dropdownRef}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 400 }}
          className="fixed min-w-[220px] rounded-2xl overflow-hidden"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            zIndex: 2147483647,
            background: 'rgba(255, 255, 255, 0.65)',
            backdropFilter: 'blur(60px) saturate(200%) brightness(1.1)',
            WebkitBackdropFilter: 'blur(60px) saturate(200%) brightness(1.1)',
            border: '1px solid rgba(255, 255, 255, 0.9)',
            boxShadow: '0 25px 70px -12px rgba(0, 0, 0, 0.25), 0 10px 30px -8px rgba(0, 0, 0, 0.15), inset 0 2px 4px 0 rgba(255, 255, 255, 0.95), inset 0 -2px 4px 0 rgba(0, 0, 0, 0.05)',
          }}
        >
          <div className="p-2">
            {groupedNav.find(g => g.label === openDropdown)?.items.map((item) => {
              const ItemIcon = item.icon;
              const isActive = location.pathname === item.path;
              const isLocked = item.locked;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    setOpenDropdown(null);
                    setDropdownPosition(null);
                  }}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all mb-1 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#FF3B3F]/20 to-[#E6282C]/20 text-gray-900 font-semibold shadow-md'
                      : isLocked
                      ? 'text-gray-400 opacity-60 cursor-not-allowed'
                      : 'hover:bg-white/60 text-gray-700'
                  }`}
                >
                  <ItemIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm flex-1">{item.label}</span>
                  {isLocked && <Lock className="w-3.5 h-3.5 flex-shrink-0" />}
                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                        item.badge === 'PRO' || item.badge === 'VIP'
                          ? 'bg-gradient-to-r from-[#3D4A52] to-[#2A3439] text-white'
                          : 'bg-gradient-to-r from-[#FF3B3F] to-[#E6282C] text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </motion.div>,
        document.body
      )}

      {/* Desktop Collapsible Sidebar - Hidden, replaced by horizontal bar */}
      <motion.aside
        className="hidden liquid-sidebar border-r border-white/20 min-h-screen h-full sticky top-0 overflow-y-auto overflow-x-visible z-40"
        style={{ scrollbarWidth: 'thin' }}
        initial={{ width: '5rem' }}
        animate={{ width: isExpanded ? '16rem' : '5rem' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <div className="p-3 h-full flex flex-col">
          {currentUser.role === 'governor' && (
            <motion.div
              className="mb-3 p-3 glass-primary text-gray-900 rounded-2xl shadow-xl overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: isExpanded ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 flex-shrink-0" />
                {isExpanded && (
                  <span className="text-sm font-bold whitespace-nowrap">Governor Access</span>
                )}
              </div>
              {isExpanded && (
                <p className="text-xs text-gray-600">Full system control</p>
              )}
            </motion.div>
          )}

          <nav className="flex-1 space-y-1.5 overflow-y-auto overflow-x-visible scrollbar-thin scrollbar-thumb-gray-400/20 scrollbar-track-transparent py-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              const isLocked = 'locked' in link && link.locked;
              const badge = 'badge' in link ? link.badge : undefined;
              const highlight = 'highlight' in link && link.highlight;

              return (
                <div key={link.path} className="relative">
                  <Link
                    to={link.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl relative transition-all ${
                      isActive
                        ? 'glass-primary text-gray-900'
                        : highlight
                        ? 'glass-primary text-gray-900 font-bold'
                        : isLocked
                        ? 'text-gray-400 glass-ultra-thin opacity-60'
                        : 'text-gray-700 glass-button-secondary hover:glass-primary hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          className="flex items-center gap-2 flex-1 overflow-hidden"
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <span className="font-medium text-sm whitespace-nowrap">{link.label}</span>
                          {isLocked && <Lock className="w-3.5 h-3.5 flex-shrink-0" />}
                          {badge && (
                            <span
                              className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                                badge === 'VIP'
                                  ? 'bg-gradient-to-r from-[#3D4A52] to-[#2A3439] text-white'
                                  : 'bg-gradient-to-r from-[#FF3B3F] to-[#E6282C] text-white'
                              }`}
                            >
                              {badge}
                            </span>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Link>

                  {/* Tooltip on hover when collapsed */}
                  {!isExpanded && (
                    <motion.div
                      className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-xl whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 z-50"
                      initial={{ opacity: 0, x: -10 }}
                      whileHover={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ display: 'none' }}
                    >
                      {link.label}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </motion.aside>
    </>
  );
}
