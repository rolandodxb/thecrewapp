import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Wallet, Camera, QrCode, Ticket, LayoutDashboard, BookOpen, MessageCircle, HelpCircle, Users,
  GraduationCap, Brain, Plane, Briefcase, Crown, Lock, Calendar, UserCircle, Zap, Shield,
  Trophy, TrendingUp, BarChart3, Flag, HardDrive, Clock, Rss, ShoppingBag, DollarSign,
  Package, ClipboardList, Play, UserPlus, Link as LinkIcon, ChevronRight, ChevronDown,
  Settings, ShieldCheck, Activity, Mail, Bell, UserCheck, FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Link, useLocation } from 'react-router-dom';
import { checkFeatureAccess, Feature } from '../../utils/featureAccess';
import { motion, AnimatePresence } from 'framer-motion';

interface MenuItem {
  path: string;
  icon: any;
  label: string;
  locked?: boolean;
  feature?: Feature | null;
  badge?: string;
  highlight?: boolean;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

export default function ModernSidebar() {
  const { currentUser } = useApp();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setOpenGroup(null);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (!currentUser) return null;

  const getMenuGroups = (): MenuGroup[] => {
    if (currentUser.role === 'student') {
      const aiTrainerAccess = checkFeatureAccess(currentUser, 'ai-trainer');
      const simulatorAccess = checkFeatureAccess(currentUser, 'simulator');
      const recruitersAccess = checkFeatureAccess(currentUser, 'recruiters');
      const openDaysAccess = checkFeatureAccess(currentUser, 'opendays');
      const chatAccess = checkFeatureAccess(currentUser, 'chat');

      return [
        {
          label: 'Dashboard',
          items: [{ path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }]
        },
        {
          label: 'Control',
          items: [
            { path: '/courses', icon: BookOpen, label: 'Courses' },
            { path: '/my-progress', icon: TrendingUp, label: 'My Progress' },
            { path: '/ai-trainer', icon: Brain, label: 'AI Trainer', locked: !aiTrainerAccess.allowed, feature: 'ai-trainer' as Feature },
            { path: '/open-day', icon: Plane, label: 'Open Day Sim', locked: !simulatorAccess.allowed, feature: 'simulator' as Feature }
          ]
        },
        {
          label: 'Management',
          items: [
            { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
            { path: '/wallet', icon: Wallet, label: 'My Wallet', badge: 'NEW' },
            ...(currentUser.plan === 'pro' || currentUser.plan === 'vip' ? [
              { path: '/storage', icon: HardDrive, label: 'My Files', badge: 'PRO' },
              { path: '/login-activity', icon: Clock, label: 'Login Activity', badge: 'PRO' }
            ] : [])
          ]
        },
        {
          label: 'Business',
          items: [
            { path: '/recruiters', icon: Briefcase, label: 'Career', locked: !recruitersAccess.allowed, feature: 'recruiters' as Feature },
            { path: '/open-days', icon: Calendar, label: 'Open Days', locked: !openDaysAccess.allowed, feature: 'opendays' as Feature },
            { path: '/student-events', icon: Ticket, label: 'Events' },
            { path: '/marketplace', icon: ShoppingBag, label: 'Shop' }
          ]
        },
        {
          label: 'Community',
          items: [
            { path: '/community-feed', icon: Rss, label: 'Community Feed' },
            { path: '/chat', icon: MessageCircle, label: 'Chat', locked: !chatAccess.allowed, feature: 'chat' as Feature },
            { path: '/invite-friends', icon: UserPlus, label: 'Invite Friends', badge: 'NEW' }
          ]
        },
        {
          label: 'Tools',
          items: [
            { path: '/support', icon: HelpCircle, label: 'Help & Support' }
          ]
        },
        {
          label: 'Events',
          items: [
            { path: '/student-events', icon: Ticket, label: 'My Events' }
          ]
        },
        {
          label: 'Account',
          items: [
            { path: '/profile', icon: UserCircle, label: 'My Profile' },
            { path: '/settings', icon: Settings, label: 'Settings' },
            { path: '/upgrade', icon: Crown, label: 'Upgrade Plan', highlight: currentUser.plan !== 'vip' }
          ]
        }
      ];
    }

    if (currentUser.role === 'mentor') {
      return [
        {
          label: 'Dashboard',
          items: [
            { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { path: '/coach-dashboard', icon: GraduationCap, label: 'Coach Dashboard', highlight: true }
          ]
        },
        {
          label: 'Control',
          items: [
            { path: '/students', icon: Users, label: 'Students' },
            { path: '/attendance', icon: ClipboardList, label: 'Attendance', badge: 'NEW' },
            { path: '/activities-manage', icon: Calendar, label: 'Manage Activities', badge: 'NEW' },
            { path: '/governor/reputation', icon: TrendingUp, label: 'Reputation Manager', badge: 'NEW' }
          ]
        },
        {
          label: 'Management',
          items: [
            { path: '/seller/dashboard', icon: Package, label: 'Seller Dashboard', badge: 'NEW' },
            { path: '/seller/billing', icon: DollarSign, label: 'My Earnings', badge: 'NEW' },
            { path: '/affiliate-dashboard', icon: LinkIcon, label: 'Affiliate Program', badge: 'NEW' },
            { path: '/wallet', icon: Wallet, label: 'My Wallet', badge: 'NEW' }
          ]
        },
        {
          label: 'Business',
          items: [
            { path: '/recruiters', icon: Briefcase, label: 'Career' },
            { path: '/open-days', icon: Calendar, label: 'Open Days' },
            { path: '/student-events', icon: Ticket, label: 'Events' },
            { path: '/marketplace', icon: ShoppingBag, label: 'Shop' }
          ]
        },
        {
          label: 'Community',
          items: [
            { path: '/community-feed', icon: Rss, label: 'Community' },
            { path: '/chat', icon: MessageCircle, label: 'Chat' },
            { path: '/invite-friends', icon: UserPlus, label: 'Invite Friends', badge: 'NEW' }
          ]
        },
        {
          label: 'Account',
          items: [
            { path: '/profile', icon: UserCircle, label: 'My Profile' },
            { path: '/support', icon: HelpCircle, label: 'Help' }
          ]
        }
      ];
    }

    if (currentUser.role === 'governor') {
      return [
        {
          label: 'Dashboard',
          items: [
            { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { path: '/governor/nexus', icon: Zap, label: 'Nexus Control', highlight: true }
          ]
        },
        {
          label: 'Control',
          items: [
            { path: '/governor/analytics', icon: BarChart3, label: 'Analytics', badge: 'NEW' },
            { path: '/governor/audit-logs', icon: Shield, label: 'Audits', badge: 'NEW' },
            { path: '/moderator-dashboard', icon: Shield, label: 'Moderation' },
            { path: '/governor/feature-flags', icon: Flag, label: 'Feature Flags', badge: 'NEW' }
          ]
        },
        {
          label: 'Management',
          items: [
            { path: '/governor/reputation', icon: TrendingUp, label: 'Reputation Manager', badge: 'NEW' },
            { path: '/governor/waitlist', icon: UserCheck, label: 'Waitlist', badge: 'NEW' },
            { path: '/staff-codes', icon: Lock, label: 'Staff Codes' }
          ]
        },
        {
          label: 'Account',
          items: [
            { path: '/profile', icon: UserCircle, label: 'My Profile' },
            { path: '/settings', icon: Settings, label: 'Settings' }
          ]
        }
      ];
    }

    if (currentUser.role === 'moderator') {
      return [
        {
          label: 'Dashboard',
          items: [
            { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { path: '/moderator-dashboard', icon: Shield, label: 'Moderator Dashboard', highlight: true }
          ]
        },
        {
          label: 'Management',
          items: [
            { path: '/community-feed', icon: Rss, label: 'Community' },
            { path: '/chat', icon: MessageCircle, label: 'Chat Moderation' },
            { path: '/marketplace', icon: ShoppingBag, label: 'Shop Moderation' }
          ]
        },
        {
          label: 'Account',
          items: [
            { path: '/profile', icon: UserCircle, label: 'My Profile' },
            { path: '/support', icon: HelpCircle, label: 'Help' }
          ]
        }
      ];
    }

    if (currentUser.role === 'finance') {
      return [
        {
          label: 'Dashboard',
          items: [
            { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { path: '/finance-dashboard', icon: DollarSign, label: 'Finance Dashboard', highlight: true }
          ]
        },
        {
          label: 'Management',
          items: [
            { path: '/seller/billing', icon: TrendingUp, label: 'Revenue Overview' }
          ]
        },
        {
          label: 'Account',
          items: [
            { path: '/profile', icon: UserCircle, label: 'My Profile' }
          ]
        }
      ];
    }

    return [];
  };

  const menuGroups = getMenuGroups();

  const toggleGroup = (label: string) => {
    setOpenGroup(openGroup === label ? null : label);
  };

  return (
    <>
      {/* Menu Button - macOS style traffic lights */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-xl rounded-full shadow-lg hover:shadow-xl transition-all"
      >
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
        <span className="text-sm font-medium text-gray-700">Menu</span>
        <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </motion.button>

      {/* Sidebar Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              ref={sidebarRef}
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-16 left-4 z-50 w-72 max-h-[calc(100vh-6rem)] overflow-y-auto bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl"
            >
              <div className="p-4 space-y-2">
                {menuGroups.map((group, index) => (
                  <div key={group.label}>
                    <button
                      onClick={() => toggleGroup(group.label)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                      <span className={group.label === 'Account' ? 'text-red-500' : ''}>{group.label}</span>
                      {group.items.length > 1 && (
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${openGroup === group.label ? 'rotate-90' : ''}`}
                        />
                      )}
                    </button>

                    <AnimatePresence>
                      {(openGroup === group.label || group.items.length === 1) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden ml-3 mt-1 space-y-1"
                        >
                          {group.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            const isLocked = item.locked && item.feature;

                            return (
                              <Link
                                key={item.path}
                                to={isLocked ? '#' : item.path}
                                onClick={() => {
                                  if (!isLocked) {
                                    setIsOpen(false);
                                    setOpenGroup(null);
                                  }
                                }}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                                  isActive
                                    ? 'bg-blue-50 text-blue-600 font-medium'
                                    : isLocked
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : item.highlight
                                    ? 'text-blue-600 hover:bg-blue-50'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                <span className="flex-1 truncate">{item.label}</span>
                                {isLocked && <Lock className="w-3 h-3" />}
                                {item.badge && (
                                  <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                                    item.badge === 'NEW' ? 'bg-green-100 text-green-700' :
                                    item.badge === 'PRO' ? 'bg-purple-100 text-purple-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {item.badge}
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
