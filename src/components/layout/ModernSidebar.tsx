import { useState, useRef, useEffect } from 'react';
import {
  Wallet, Ticket, LayoutDashboard, BookOpen, MessageCircle, HelpCircle, Users,
  GraduationCap, Brain, Plane, Briefcase, Crown, Lock, Calendar, UserCircle, Zap, Shield,
  Trophy, TrendingUp, BarChart3, Flag, HardDrive, Clock, Rss, ShoppingBag, DollarSign,
  Package, ClipboardList, Play, UserPlus, Link as LinkIcon, ChevronRight,
  Settings, UserCheck, Video, FileText, Bell, MoreVertical
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState<{ top: number; left: number } | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const groupRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHoveredGroup(null);
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
          label: 'Learning',
          items: [
            { path: '/courses', icon: BookOpen, label: 'Courses' },
            { path: '/my-progress', icon: TrendingUp, label: 'My Progress' },
            { path: '/video-courses', icon: Video, label: 'Video Courses' },
            { path: '/students', icon: Users, label: 'Students' },
            { path: '/ai-trainer', icon: Brain, label: 'AI Trainer', locked: !aiTrainerAccess.allowed, feature: 'ai-trainer' as Feature },
            { path: '/open-day', icon: Plane, label: 'Simulator', locked: !simulatorAccess.allowed, feature: 'simulator' as Feature }
          ]
        },
        {
          label: 'Career & Events',
          items: [
            { path: '/recruiters', icon: Briefcase, label: 'Career Portal', locked: !recruitersAccess.allowed, feature: 'recruiters' as Feature },
            { path: '/open-days', icon: Calendar, label: 'Open Days', locked: !openDaysAccess.allowed, feature: 'opendays' as Feature },
            { path: '/student-events', icon: Ticket, label: 'Events' }
          ]
        },
        {
          label: 'Community',
          items: [
            { path: '/community-feed', icon: Rss, label: 'Community Feed' },
            { path: '/community', icon: MessageCircle, label: 'Community Chat', badge: 'NEW' },
            { path: '/chat', icon: MessageCircle, label: 'Private Chat', locked: !chatAccess.allowed, feature: 'chat' as Feature },
            { path: '/conference', icon: Video, label: 'Conference Room', badge: 'NEW' },
            { path: '/invite-friends', icon: UserPlus, label: 'Invite Friends' },
            { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' }
          ]
        },
        {
          label: 'Marketplace',
          items: [
            { path: '/marketplace', icon: ShoppingBag, label: 'Shop' },
            { path: '/my-orders', icon: Package, label: 'My Orders' },
            { path: '/my-products', icon: Package, label: 'My Products' },
            { path: '/seller/dashboard', icon: DollarSign, label: 'Seller Dashboard' }
          ]
        },
        {
          label: 'Finances',
          items: [
            { path: '/wallet', icon: Wallet, label: 'Wallet', badge: 'NEW' },
            { path: '/affiliate-dashboard', icon: LinkIcon, label: 'Affiliates', badge: 'NEW' },
            { path: '/attendance', icon: ClipboardList, label: 'Attendance' }
          ]
        },
        {
          label: 'Tools & Settings',
          items: [
            { path: '/support', icon: HelpCircle, label: 'Help & Support' },
            { path: '/whats-new', icon: Rss, label: "What's New" },
            { path: '/documentation', icon: FileText, label: 'Documentation' },
            ...(currentUser.plan === 'pro' || currentUser.plan === 'vip' ? [
              { path: '/storage', icon: HardDrive, label: 'My Files', badge: 'PRO' },
              { path: '/login-activity', icon: Clock, label: 'Login Activity', badge: 'PRO' }
            ] : [])
          ]
        },
        {
          label: 'Account',
          items: [
            { path: '/profile', icon: UserCircle, label: 'My Profile' },
            { path: '/settings', icon: Settings, label: 'Settings' },
            { path: '/notifications', icon: Bell, label: 'Notifications' },
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
          label: 'Teaching',
          items: [
            { path: '/students', icon: Users, label: 'Students' },
            { path: '/attendance', icon: ClipboardList, label: 'Attendance', badge: 'NEW' },
            { path: '/activities-manage', icon: Calendar, label: 'Manage Activities', badge: 'NEW' },
            { path: '/courses', icon: BookOpen, label: 'Courses' },
            { path: '/video-courses', icon: Video, label: 'Video Courses' }
          ]
        },
        {
          label: 'Communication',
          items: [
            { path: '/chat', icon: MessageCircle, label: 'Chat' },
            { path: '/conference', icon: Video, label: 'Conference Room', badge: 'NEW' },
            { path: '/community-feed', icon: Rss, label: 'Community' }
          ]
        },
        {
          label: 'Marketplace',
          items: [
            { path: '/seller/dashboard', icon: Package, label: 'Seller Dashboard', badge: 'NEW' },
            { path: '/seller/billing', icon: DollarSign, label: 'My Earnings', badge: 'NEW' },
            { path: '/marketplace', icon: ShoppingBag, label: 'Shop' },
            { path: '/my-products', icon: Package, label: 'My Products' }
          ]
        },
        {
          label: 'Management',
          items: [
            { path: '/affiliate-dashboard', icon: LinkIcon, label: 'Affiliate Program', badge: 'NEW' },
            { path: '/wallet', icon: Wallet, label: 'My Wallet', badge: 'NEW' },
            { path: '/governor/reputation', icon: TrendingUp, label: 'Reputation Manager', badge: 'NEW' }
          ]
        },
        {
          label: 'Business',
          items: [
            { path: '/recruiters', icon: Briefcase, label: 'Career' },
            { path: '/open-days', icon: Calendar, label: 'Open Days' },
            { path: '/student-events', icon: Ticket, label: 'Events' }
          ]
        },
        {
          label: 'Account',
          items: [
            { path: '/profile', icon: UserCircle, label: 'My Profile' },
            { path: '/settings', icon: Settings, label: 'Settings' },
            { path: '/support', icon: HelpCircle, label: 'Help' }
          ]
        }
      ];
    }

    if (currentUser.role === 'governor') {
      return [
        {
          label: 'Control Center',
          items: [
            { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { path: '/governor/nexus', icon: Zap, label: 'Nexus Control', highlight: true }
          ]
        },
        {
          label: 'Analytics & Monitoring',
          items: [
            { path: '/governor/analytics', icon: BarChart3, label: 'Analytics', badge: 'NEW' },
            { path: '/governor/audit-logs', icon: Shield, label: 'Audit Logs', badge: 'NEW' },
            { path: '/moderator-dashboard', icon: Shield, label: 'Moderation' },
            { path: '/governor/moderation-insights', icon: BarChart3, label: 'Mod Insights', badge: 'NEW' }
          ]
        },
        {
          label: 'System Management',
          items: [
            { path: '/governor/feature-flags', icon: Flag, label: 'Feature Flags', badge: 'NEW' },
            { path: '/governor/system-control', icon: Shield, label: 'System Control', badge: 'NEW' },
            { path: '/governor/reputation', icon: TrendingUp, label: 'Reputation Manager', badge: 'NEW' },
            { path: '/governor/waitlist', icon: UserCheck, label: 'Waitlist', badge: 'NEW' },
            { path: '/staff-codes', icon: Lock, label: 'Staff Codes' },
            { path: '/storage', icon: HardDrive, label: 'Storage Manager' }
          ]
        },
        {
          label: 'Communication',
          items: [
            { path: '/chat', icon: MessageCircle, label: 'Chat' },
            { path: '/conference', icon: Video, label: 'Conference Room', badge: 'NEW' },
            { path: '/support-chat-manager', icon: MessageCircle, label: 'Support Manager' }
          ]
        },
        {
          label: 'Platform',
          items: [
            { path: '/courses', icon: BookOpen, label: 'Courses' },
            { path: '/marketplace', icon: ShoppingBag, label: 'Marketplace' },
            { path: '/community-feed', icon: Rss, label: 'Community' }
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
          label: 'Moderation',
          items: [
            { path: '/community-feed', icon: Rss, label: 'Community' },
            { path: '/chat', icon: MessageCircle, label: 'Chat Moderation' },
            { path: '/marketplace', icon: ShoppingBag, label: 'Shop Moderation' },
            { path: '/conference', icon: Video, label: 'Conference Rooms' }
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
          label: 'Financial Management',
          items: [
            { path: '/seller/billing', icon: DollarSign, label: 'Billing Management' },
            { path: '/wallet', icon: Wallet, label: 'Wallet System' },
            { path: '/affiliate-dashboard', icon: LinkIcon, label: 'Affiliates' }
          ]
        },
        {
          label: 'Platform',
          items: [
            { path: '/marketplace', icon: ShoppingBag, label: 'Marketplace' },
            { path: '/courses', icon: BookOpen, label: 'Courses' }
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

    return [
      {
        label: 'Dashboard',
        items: [{ path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }]
      },
      {
        label: 'Account',
        items: [
          { path: '/profile', icon: UserCircle, label: 'My Profile' },
          { path: '/settings', icon: Settings, label: 'Settings' }
        ]
      }
    ];
  };

  const handleMenuClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHoveredGroup(null);
    }
  };

  const handleGroupHover = (groupLabel: string) => {
    const groupRef = groupRefs.current[groupLabel];
    if (groupRef && sidebarRef.current) {
      const rect = groupRef.getBoundingClientRect();
      const sidebarRect = sidebarRef.current.getBoundingClientRect();
      setSubmenuPosition({
        top: rect.top,
        left: sidebarRect.right + 8
      });
      setHoveredGroup(groupLabel);
    }
  };

  const handleItemClick = () => {
    setIsOpen(false);
    setHoveredGroup(null);
  };

  const menuGroups = getMenuGroups();
  const currentGroup = menuGroups.find(g => g.label === hoveredGroup);

  return (
    <>
      {/* Menu Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={handleMenuClick}
        className="fixed top-2 sm:top-3 md:top-4 left-2 sm:left-3 md:left-4 z-50 flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-white/90 backdrop-blur-xl rounded-full shadow-lg hover:shadow-xl transition-all"
      >
        <span className="text-xs sm:text-sm font-medium text-gray-700">Menu</span>
        <ChevronRight className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Main Menu Panel - First Bubble */}
            <motion.div
              ref={sidebarRef}
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-12 sm:top-14 md:top-16 left-2 sm:left-3 md:left-4 z-50 w-56 sm:w-60 md:w-64 lg:w-72 max-h-[calc(100vh-4rem)] sm:max-h-[calc(100vh-5rem)] md:max-h-[calc(100vh-6rem)] overflow-y-auto bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl"
            >
              <div className="p-2 sm:p-3 md:p-4 space-y-1">
                {menuGroups.map((group) => {
                  if (group.items.length === 1) {
                    const item = group.items[0];
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    const isLocked = item.locked || (item.feature && !checkFeatureAccess(currentUser, item.feature).allowed);

                    return (
                      <Link
                        key={item.path}
                        to={isLocked ? '#' : item.path}
                        onClick={(e) => {
                          if (isLocked) e.preventDefault();
                          else handleItemClick();
                        }}
                        className={`flex items-center gap-2 sm:gap-2.5 md:gap-3 px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm transition-all ${
                          isActive
                            ? 'bg-gray-900 text-white'
                            : item.highlight
                            ? 'bg-gradient-to-r from-[#D71920]/10 to-pink-500/10 text-gray-900 hover:from-[#D71920]/20 hover:to-pink-500/20'
                            : isLocked
                            ? 'text-gray-400 cursor-not-allowed opacity-60'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="flex-1 truncate text-left">{item.label}</span>
                        {isLocked && <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />}
                        {item.badge && (
                          <span
                            className={`px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold rounded flex-shrink-0 ${
                              item.badge === 'NEW'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={group.label}
                      ref={(el) => (groupRefs.current[group.label] = el)}
                      onMouseEnter={() => handleGroupHover(group.label)}
                      className={`w-full flex items-center justify-between px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl transition-all ${
                        hoveredGroup === group.label
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="truncate">{group.label}</span>
                      {group.items.length > 1 && <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Submenu Panel - Second Bubble */}
            <AnimatePresence>
              {hoveredGroup && currentGroup && submenuPosition && (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    position: 'fixed',
                    top: submenuPosition.top,
                    left: submenuPosition.left
                  }}
                  onMouseLeave={() => setHoveredGroup(null)}
                  className="z-50 w-56 sm:w-60 md:w-64 lg:w-72 max-h-[calc(100vh-6rem)] sm:max-h-[calc(100vh-7rem)] md:max-h-[calc(100vh-8rem)] overflow-y-auto bg-white/95 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-2xl"
                >
                  <div className="p-2 sm:p-2.5 md:p-3 space-y-1">
                    {currentGroup.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      const isLocked = item.locked || (item.feature && !checkFeatureAccess(currentUser, item.feature).allowed);

                      return (
                        <Link
                          key={item.path}
                          to={isLocked ? '#' : item.path}
                          onClick={(e) => {
                            if (isLocked) e.preventDefault();
                            else handleItemClick();
                          }}
                          className={`flex items-center gap-2 sm:gap-2.5 md:gap-3 px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm transition-all ${
                            isActive
                              ? 'bg-gray-900 text-white'
                              : item.highlight
                              ? 'bg-gradient-to-r from-[#D71920]/10 to-pink-500/10 text-gray-900 hover:from-[#D71920]/20 hover:to-pink-500/20'
                              : isLocked
                              ? 'text-gray-400 cursor-not-allowed opacity-60'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Icon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="flex-1 truncate text-left">{item.label}</span>
                          {isLocked && <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />}
                          {item.badge && (
                            <span
                              className={`px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold rounded flex-shrink-0 ${
                                item.badge === 'NEW'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-purple-100 text-purple-700'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
