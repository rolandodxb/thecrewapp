import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { communityFeedService, CommunityPost } from '../services/communityFeedService';
import { supabase } from '../lib/auth';
import { Award, BookOpen, Trophy, Grid3x3, Lock, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
interface UserStats {
  totalPoints: number;
  certificatesEarned: number;
  coursesCompleted: number;
  modulesCompleted: number;
}
interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: string;
  plan?: string;
  bio?: string;
  photoURL?: string;
  photo_base64?: string;
}
export default function SocialProfilePage() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const viewingUserId = searchParams.get('userId');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats>({
    totalPoints: 0,
    certificatesEarned: 0,
    coursesCompleted: 0,
    modulesCompleted: 0
  });
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  useEffect(() => {
    if (!currentUser) return;
    const loadUserProfile = async () => {
      try {
        setLoading(true);
        const targetUserId = viewingUserId || currentUser.uid;
        // Load user profile data
        const userQuery = query(collection(db, 'users'), where('uid', '==', targetUserId));
        const userSnapshot = await getDocs(userQuery);
        let userData: UserProfile = {
          uid: targetUserId,
          name: 'Unknown User',
          email: '',
          role: 'student',
        };
        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0].data();
          userData = {
            uid: targetUserId,
            name: userDoc.name || userDoc.displayName || 'Unknown User',
            email: userDoc.email || '',
            role: userDoc.role || 'student',
            plan: userDoc.plan || undefined,
            bio: userDoc.bio || 'No bio added yet',
            photoURL: userDoc.photoURL || '',
            photo_base64: userDoc.photo_base64 || '',
          };
        }
        setProfileUser(userData);
        // Load user's posts
        const { posts: userPosts } = await communityFeedService.getPosts(
          undefined,
          undefined,
          { userId: targetUserId }
        );
        setPosts(userPosts);
        // Load total points from user_points collection (all roles)
        const pointsQuery = query(
          collection(db, 'user_points'),
          where('user_id', '==', targetUserId)
        );
        const pointsSnapshot = await getDocs(pointsQuery);
        const totalPoints = pointsSnapshot.empty ? 0 : pointsSnapshot.docs[0].data().total_points || 0;
        // Only load detailed achievements for students
        const userRole = userData.role.toLowerCase();
        if (userRole === 'student') {
          // Load achievements from course_enrollments collection
          const enrollmentsQuery = query(
            collection(db, 'course_enrollments'),
            where('user_id', '==', targetUserId)
          );
          const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
          let modulesCompleted = 0;
          enrollmentsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.completed) {
              modulesCompleted++;
            }
          });
          // Load certificates
          const certificatesQuery = query(
            collection(db, 'certificates'),
            where('userId', '==', targetUserId)
          );
          const certificatesSnapshot = await getDocs(certificatesQuery);
          // Count unique completed courses
          const completedCourses = new Set<string>();
          enrollmentsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.completed && data.course_id) {
              completedCourses.add(data.course_id);
            }
          });
          setStats({
            totalPoints,
            certificatesEarned: certificatesSnapshot.size,
            coursesCompleted: completedCourses.size,
            modulesCompleted
          });
        } else {
          // For governor, mentor, support - only show points
          setStats({
            totalPoints,
            certificatesEarned: 0,
            coursesCompleted: 0,
            modulesCompleted: 0
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUserProfile();
  }, [currentUser, viewingUserId]);
  const handlePostClick = (post: CommunityPost) => {
    navigate('/community-feed', { state: { postId: post.id } });
  };
  const isOwnProfile = !viewingUserId || viewingUserId === currentUser?.uid;
  if (!currentUser) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-gray-600">Please log in to view profiles.</p>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D71920] border-t-transparent"></div>
      </div>
    );
  }
  if (!profileUser) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-gray-600">User not found.</p>
      </div>
    );
  }
  const displayPhoto = profileUser.photo_base64 || profileUser.photoURL ||
    `data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23ddd%22 width=%22200%22 height=%22200%22/%3E%3Ctext fill=%22%23999%22 font-family=%22sans-serif%22 font-size=%2260%22 dy=%2210.5rem%22 font-weight=%22bold%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22%3E${profileUser.name?.[0] || 'U'}%3C/text%3E%3C/svg%3E`;
  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-3 md:px-6 py-4 md:py-8">
        {!isOwnProfile && (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 mb-4 px-4 py-2 liquid-button-secondary rounded-lg font-semibold transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}
        <div className="liquid-crystal-panel p-4 md:p-8 mb-4 md:mb-6">
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-xl">
                <img
                  src={displayPhoto}
                  alt={profileUser.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {profileUser.name}
            </h1>
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white text-xs font-bold rounded-full uppercase">
                {profileUser.role}
              </span>
              {profileUser.plan && (
                <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-full uppercase">
                  {profileUser.plan}
                </span>
              )}
            </div>
            <p className="text-center text-gray-700 max-w-2xl mb-6 text-sm md:text-base leading-relaxed">
              {profileUser.bio}
            </p>
          </div>
        </div>
        <div className="liquid-crystal-panel p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-[#D71920]" />
            <h2 className="text-lg md:text-xl font-bold text-gray-900">Achievements</h2>
          </div>
          {profileUser.role.toLowerCase() === 'student' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="liquid-card-overlay p-4 rounded-xl text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stats.totalPoints}</div>
                <div className="text-xs text-gray-600 font-semibold">Points</div>
              </div>
              <div className="liquid-card-overlay p-4 rounded-xl text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-[#D71920] to-[#B91518] rounded-full flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stats.certificatesEarned}</div>
                <div className="text-xs text-gray-600 font-semibold">Certificates</div>
              </div>
              <div className="liquid-card-overlay p-4 rounded-xl text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stats.coursesCompleted}</div>
                <div className="text-xs text-gray-600 font-semibold">Courses</div>
              </div>
              <div className="liquid-card-overlay p-4 rounded-xl text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stats.modulesCompleted}</div>
                <div className="text-xs text-gray-600 font-semibold">Modules</div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="liquid-card-overlay p-6 rounded-xl text-center max-w-xs w-full">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stats.totalPoints}</div>
                <div className="text-sm text-gray-600 font-semibold">Total Points</div>
              </div>
            </div>
          )}
        </div>
        <div className="liquid-crystal-panel p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Grid3x3 className="w-5 h-5 text-[#D71920]" />
            <h2 className="text-lg md:text-xl font-bold text-gray-900">Posts</h2>
            <span className="ml-auto text-sm text-gray-600 font-semibold">{posts.length} posts</span>
          </div>
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <Grid3x3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-700 mb-2">No posts yet</h3>
              <p className="text-sm text-gray-600">
                {isOwnProfile ? 'Share your first post with the community!' : 'This user has not posted yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-1 md:gap-2">
              {posts.map((post) => (
                <motion.div
                  key={post.id}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handlePostClick(post)}
                  className="relative aspect-square cursor-pointer rounded-lg overflow-hidden bg-gray-100"
                >
                  {post.imageUrl ? (
                    <img
                      src={post.imageUrl}
                      alt="Post"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-2">
                      <p className="text-xs text-gray-600 text-center line-clamp-3">
                        {post.content}
                      </p>
                    </div>
                  )}
                  {post.targetAudience !== 'all' && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-[#D71920] rounded-full flex items-center justify-center">
                      <Lock className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end p-2">
                    <div className="text-white text-xs font-semibold">
                      {post.reactionsCount.fire + post.reactionsCount.heart + post.reactionsCount.thumbsUp + post.reactionsCount.laugh + post.reactionsCount.wow > 0 && (
                        <span>❤️ {post.reactionsCount.fire + post.reactionsCount.heart + post.reactionsCount.thumbsUp + post.reactionsCount.laugh + post.reactionsCount.wow}</span>
                      )}
                      {post.commentsCount > 0 && (
                        <span className="ml-2">💬 {post.commentsCount}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}