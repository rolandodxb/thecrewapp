import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, TrendingUp, Shield, AlertTriangle, Mail, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { getLeaderboard, UserPoints } from '../services/rewardsService';
import BadgeDisplay from '../components/BadgeDisplay';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface UserWithDetails extends UserPoints {
  userName: string;
  email: string;
  role: string;
  photoURL?: string;
  achievements?: string[];
  bio?: string;
}

interface GroupedUsers {
  admins: UserWithDetails[];
  supportAgents: UserWithDetails[];
  mentors: UserWithDetails[];
  students: UserWithDetails[];
}

export default function LeaderboardPage() {
  const [groupedUsers, setGroupedUsers] = useState<GroupedUsers>({
    admins: [],
    supportAgents: [],
    mentors: [],
    students: []
  });
  const [loading, setLoading] = useState(true);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const leaderboardData = await getLeaderboard(500);

      const usersWithDetails: UserWithDetails[] = await Promise.all(
        usersSnapshot.docs.map(async (userDoc) => {
          const userData = userDoc.data();
          const pointsData = leaderboardData.find(p => p.user_id === userDoc.id);

          return {
            user_id: userDoc.id,
            userName: userData.name || userData.displayName || 'Unknown User',
            email: userData.email || '',
            role: userData.role || 'student',
            photoURL: userData.photoURL || userData.profilePicture || userData.photo_base64 || '',
            achievements: userData.achievements || [],
            bio: userData.bio || '',
            total_points: pointsData?.total_points || 0,
            current_rank: pointsData?.current_rank || 'Bronze',
            daily_login_streak: pointsData?.daily_login_streak || 0,
            verified_crew: pointsData?.verified_crew || false,
          };
        })
      );

      const grouped: GroupedUsers = {
        admins: [],
        supportAgents: [],
        mentors: [],
        students: []
      };

      usersWithDetails.forEach(user => {
        const role = user.role.toLowerCase();
        if (role === 'governor' || role === 'admin') {
          grouped.admins.push(user);
        } else if (role === 'support' || role === 'support-agent') {
          grouped.supportAgents.push(user);
        } else if (role === 'mentor' || role === 'coach') {
          grouped.mentors.push(user);
        } else {
          grouped.students.push(user);
        }
      });

      grouped.admins.sort((a, b) => b.total_points - a.total_points);
      grouped.supportAgents.sort((a, b) => b.total_points - a.total_points);
      grouped.mentors.sort((a, b) => b.total_points - a.total_points);
      grouped.students.sort((a, b) => b.total_points - a.total_points);

      setGroupedUsers(grouped);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Award className="w-6 h-6 text-amber-600" />;
    return <span className="text-gray-500 font-bold">#{index + 1}</span>;
  };

  const getRankBackground = (index: number) => {
    if (index === 0) return 'from-yellow-50 to-amber-50 border-yellow-300';
    if (index === 1) return 'from-gray-50 to-gray-100 border-gray-300';
    if (index === 2) return 'from-amber-50 to-orange-50 border-amber-300';
    return 'from-white to-gray-50 border-gray-200';
  };

  const getRoleDisplay = (role: string) => {
    const roleLower = role.toLowerCase();
    if (roleLower === 'governor' || roleLower === 'admin') {
      return { label: 'Governor', color: 'bg-red-100 text-red-900', icon: '👑' };
    }
    if (roleLower === 'support' || roleLower === 'support-agent') {
      return { label: 'Support Agent', color: 'bg-blue-100 text-blue-900', icon: '💬' };
    }
    if (roleLower === 'mentor' || roleLower === 'coach') {
      return { label: 'Mentor', color: 'bg-purple-100 text-purple-900', icon: '⭐' };
    }
    return { label: 'Student', color: 'bg-green-100 text-green-900', icon: '🎓' };
  };

  const getRoleIcon = (role: string) => {
    const roleLower = role.toLowerCase();
    if (roleLower === 'governor' || roleLower === 'admin') {
      return <Shield className="w-5 h-5 text-[#D71920]" />;
    }
    if (roleLower === 'support' || roleLower === 'support-agent') {
      return <Mail className="w-5 h-5 text-blue-600" />;
    }
    if (roleLower === 'mentor' || roleLower === 'coach') {
      return <Star className="w-5 h-5 text-purple-600" />;
    }
    return null;
  };

  const renderUserCard = (user: UserWithDetails, index: number, globalIndex: number) => {
    return (
      <motion.div
        key={user.user_id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: globalIndex * 0.02 }}
        onClick={() => setExpandedUserId(expandedUserId === user.user_id ? null : user.user_id)}
        className={`glass-card rounded-2xl p-4 md:p-6 shadow-md hover:shadow-xl transition-all border-2 bg-gradient-to-br cursor-pointer ${getRankBackground(index)}`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
            <div className="flex items-center justify-center w-10 h-10 flex-shrink-0">
              {getRankIcon(index)}
            </div>

            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#D71920] to-[#B91518] shadow-lg ring-4 ring-white">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.userName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white font-bold text-2xl">${user.userName.charAt(0).toUpperCase()}</div>`;
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold text-2xl">
                  {user.userName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-bold text-base md:text-lg text-gray-900 truncate">
                  {user.userName}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${getRoleDisplay(user.role).color}`}>
                  <span>{getRoleDisplay(user.role).icon}</span>
                  <span>{getRoleDisplay(user.role).label}</span>
                </span>
                <BadgeDisplay
                  rank={user.current_rank}
                  size="sm"
                  verifiedCrew={user.verified_crew}
                />
              </div>
              {user.bio && (
                <p className="text-xs md:text-sm text-gray-600 truncate line-clamp-1">
                  {user.bio}
                </p>
              )}
              {user.daily_login_streak > 0 && (
                <p className="text-xs md:text-sm text-orange-600 mt-1 font-medium">
                  🔥 {user.daily_login_streak} day streak
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto md:ml-auto">
            <div className="text-right">
              <p className="text-2xl md:text-3xl font-bold text-[#D71920]">
                {user.total_points.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">points</p>
            </div>
          </div>
        </div>

        {user.achievements && user.achievements.length > 0 && (
          <div className="mt-4 pt-4 border-t-2 border-white/40">
            <div className="flex flex-wrap gap-2">
              {user.achievements.map((achievement, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full"
                >
                  🏆 {achievement}
                </span>
              ))}
            </div>
          </div>
        )}

        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{
            height: expandedUserId === user.user_id ? 'auto' : 0,
            opacity: expandedUserId === user.user_id ? 1 : 0
          }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          {expandedUserId === user.user_id && (
            <div className="mt-4 pt-4 border-t-2 border-white/40 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="glass-card rounded-xl p-3">
                  <p className="text-xs text-gray-600 mb-1">Total Points</p>
                  <p className="text-2xl font-bold text-[#D71920]">{user.total_points.toLocaleString()}</p>
                </div>

                <div className="glass-card rounded-xl p-3">
                  <p className="text-xs text-gray-600 mb-1">Current Rank</p>
                  <div className="flex items-center gap-2">
                    <BadgeDisplay rank={user.current_rank} size="md" />
                  </div>
                </div>

                <div className="glass-card rounded-xl p-3">
                  <p className="text-xs text-gray-600 mb-1">Daily Streak</p>
                  <p className="text-xl font-bold text-orange-600">{user.daily_login_streak} days 🔥</p>
                </div>

                {user.verified_crew && (
                  <div className="glass-card rounded-xl p-3 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-bold text-blue-900">Verified Crew</span>
                    </div>
                  </div>
                )}
              </div>

              {user.bio && (
                <div className="glass-card rounded-xl p-3">
                  <p className="text-xs text-gray-600 mb-1">Bio</p>
                  <p className="text-sm text-gray-700">{user.bio}</p>
                </div>
              )}

              {user.achievements && user.achievements.length > 0 && (
                <div className="glass-card rounded-xl p-3">
                  <p className="text-xs text-gray-600 mb-2">All Achievements</p>
                  <div className="flex flex-wrap gap-2">
                    {user.achievements.map((achievement, idx) => (
                      <span key={idx} className="px-3 py-1 bg-yellow-100 text-yellow-900 rounded-full text-xs font-semibold">
                        🏆 {achievement}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    );
  };

  const renderSection = (users: UserWithDetails[], title: string, icon: string, gradient: string, startIndex: number) => {
    if (users.length === 0) return null;

    return (
      <div className="mb-8">
        <div className={`rounded-2xl p-6 mb-4 shadow-lg bg-gradient-to-br ${gradient} border-2 border-white/40`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{icon}</span>
              <div>
                <h2 className="text-2xl font-bold text-white">{title}</h2>
                <p className="text-white/80 text-sm">{users.length} member{users.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
              <p className="text-white font-bold text-sm">Total Points</p>
              <p className="text-white text-xl font-bold">
                {users.reduce((sum, u) => sum + u.total_points, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {users.map((user, index) => renderUserCard(user, index, startIndex + index))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#D71920] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalUsers = groupedUsers.admins.length + groupedUsers.supportAgents.length +
                     groupedUsers.mentors.length + groupedUsers.students.length;

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="glass-card rounded-2xl p-6 md:p-8 mb-6 border-2 border-white/40">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
            <TrendingUp className="w-12 h-12 text-[#D71920] flex-shrink-0" />
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Leaderboard</h1>
              <p className="text-gray-700 mt-1">Top {totalUsers} Academy Members by Performance</p>
            </div>
          </div>

          <div className="glass-card rounded-xl p-4 bg-red-50 border-2 border-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-red-900">Security Notice</p>
                <p className="text-xs text-red-800 mt-1">
                  Unauthorized external communication will result in a strike (warning).
                  <span className="font-bold"> 3 strikes lead to permanent ban.</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {totalUsers === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Members Yet</h3>
            <p className="text-gray-600">Be the first to join the leaderboard!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {renderSection(groupedUsers.admins, 'Admins', '👑', 'from-red-500 to-red-600', 0)}
            {renderSection(groupedUsers.supportAgents, 'Support Agents', '💬', 'from-blue-500 to-blue-600', groupedUsers.admins.length)}
            {renderSection(groupedUsers.mentors, 'Mentors', '⭐', 'from-purple-500 to-purple-600', groupedUsers.admins.length + groupedUsers.supportAgents.length)}
            {renderSection(groupedUsers.students, 'Students', '🎓', 'from-green-500 to-green-600', groupedUsers.admins.length + groupedUsers.supportAgents.length + groupedUsers.mentors.length)}
          </div>
        )}
      </div>
    </div>
  );
}
