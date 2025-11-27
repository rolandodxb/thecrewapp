import { supabase } from '../lib/auth';
export type BadgeRank = 'Student' | 'Cadet' | 'Crew' | 'Pro Crew' | 'Elite Crew' | 'Captain';
export interface UserPoints {
  user_id: string;
  total_points: number;
  current_rank: BadgeRank;
  verified_crew: boolean;
  daily_login_streak: number;
  last_login_date: string;
}
export interface PointEvent {
  user_id: string;
  action: string;
  points: number;
  timestamp: string;
  metadata?: any;
}
export const POINT_VALUES = {
  DAILY_LOGIN: 10,
  WATCH_LESSON: 40,
  PASS_QUIZ: 100,
  COMPLETE_MODULE: 250,
  SEND_MESSAGE: 5,
  RECEIVE_LIKE: 3,
  SEND_REACTION: 2,
  UPLOAD_FILE: 20
};
export const RANK_THRESHOLDS = {
  Student: 0,
  Cadet: 1000,
  Crew: 2000,
  'Pro Crew': 3000,
  'Elite Crew': 4000,
  Captain: 5000
};
export const calculateRank = (points: number): BadgeRank => {
  if (points >= 5000) return 'Captain';
  if (points >= 4000) return 'Elite Crew';
  if (points >= 3000) return 'Pro Crew';
  if (points >= 2000) return 'Crew';
  if (points >= 1000) return 'Cadet';
  return 'Student';
};
export const getPointsToNextRank = (currentPoints: number): number => {
  const currentRank = calculateRank(currentPoints);
  const ranks: BadgeRank[] = ['Student', 'Cadet', 'Crew', 'Pro Crew', 'Elite Crew', 'Captain'];
  const currentIndex = ranks.indexOf(currentRank);
  if (currentIndex === ranks.length - 1) return 0;
  const nextRank = ranks[currentIndex + 1];
  return RANK_THRESHOLDS[nextRank] - currentPoints;
};
export const initializeUserPoints = async (userId: string): Promise<void> => {
  const { data, error } = await supabase
    .from('user_points')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    const initialData: UserPoints = {
      user_id: userId,
      total_points: 0,
      current_rank: 'Student',
      verified_crew: false,
      daily_login_streak: 0,
      last_login_date: ''
    };
    await supabase.from('user_points').insert(initialData);
  }
};
export const getUserPoints = async (userId: string): Promise<UserPoints | null> => {
  const { data, error } = await supabase
    .from('user_points')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  if (data) {
    return data as UserPoints;
  }

  await initializeUserPoints(userId);
  return await getUserPoints(userId);
};
export const awardPoints = async (
  userId: string,
  action: string,
  points: number,
  metadata?: any
): Promise<void> => {
  const userPoints = await getUserPoints(userId);
  if (!userPoints) return;

  if (userPoints.verified_crew) {
    console.log('User is verified crew, points frozen');
    return;
  }

  const newTotalPoints = userPoints.total_points + points;
  const newRank = calculateRank(newTotalPoints);

  await supabase
    .from('user_points')
    .update({
      total_points: newTotalPoints,
      current_rank: newRank
    })
    .eq('user_id', userId);

  await supabase.from('point_events').insert({
    user_id: userId,
    action,
    points,
    timestamp: new Date().toISOString(),
    metadata: metadata || {}
  });

  console.log(`Awarded ${points} points to user ${userId} for ${action}`);
};
export const handleDailyLogin = async (userId: string): Promise<void> => {
  const userPoints = await getUserPoints(userId);
  if (!userPoints) return;

  const today = new Date().toISOString().split('T')[0];
  const lastLogin = userPoints.last_login_date;

  if (lastLogin === today) {
    console.log('User already logged in today');
    return;
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const newStreak = lastLogin === yesterday ? userPoints.daily_login_streak + 1 : 1;

  await supabase
    .from('user_points')
    .update({
      last_login_date: today,
      daily_login_streak: newStreak
    })
    .eq('user_id', userId);

  await awardPoints(userId, 'daily_login', POINT_VALUES.DAILY_LOGIN, { streak: newStreak });
};
export const markLessonWatched = async (userId: string, courseId: string): Promise<void> => {
  await awardPoints(userId, 'watch_lesson', POINT_VALUES.WATCH_LESSON, { courseId });
};
export const handleQuizPass = async (userId: string, quizId: string, score: number): Promise<void> => {
  if (score >= 80) {
    await awardPoints(userId, 'pass_quiz', POINT_VALUES.PASS_QUIZ, { quizId, score });
  }
};
export const handleModuleCompletion = async (userId: string, moduleId: string): Promise<void> => {
  await awardPoints(userId, 'complete_module', POINT_VALUES.COMPLETE_MODULE, { moduleId });
};
export const handleMessageSent = async (userId: string, messageId: string): Promise<void> => {
  await awardPoints(userId, 'send_message', POINT_VALUES.SEND_MESSAGE, { messageId });
};
export const handleMessageLike = async (messageOwnerId: string, messageId: string, likedBy: string): Promise<void> => {
  await awardPoints(messageOwnerId, 'receive_like', POINT_VALUES.RECEIVE_LIKE, { messageId, likedBy });
};
export const handleReactionSent = async (userId: string, messageId: string, emoji: string): Promise<void> => {
  await awardPoints(userId, 'send_reaction', POINT_VALUES.SEND_REACTION, { messageId, emoji });
};
export const handleFileUpload = async (userId: string, fileId: string): Promise<void> => {
  await awardPoints(userId, 'upload_file', POINT_VALUES.UPLOAD_FILE, { fileId });
};
export const declareVerifiedCrew = async (userId: string): Promise<void> => {
  await supabase
    .from('user_points')
    .update({ verified_crew: true })
    .eq('user_id', userId);

  console.log(`User ${userId} is now a verified crew member`);
};
export const isVerifiedCrew = async (userId: string): Promise<boolean> => {
  const userPoints = await getUserPoints(userId);
  return userPoints?.verified_crew || false;
};
export const getLeaderboard = async (limitCount: number = 100): Promise<UserPoints[]> => {
  const { data, error } = await supabase
    .from('user_points')
    .select('*')
    .order('total_points', { ascending: false })
    .limit(limitCount);

  if (error) throw error;
  return data as UserPoints[];
};
export const getUserPointHistory = async (userId: string, limitCount: number = 50): Promise<PointEvent[]> => {
  const { data, error } = await supabase
    .from('point_events')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(limitCount);

  if (error) throw error;
  return data as PointEvent[];
};
export const getBadgeColor = (rank: BadgeRank): string => {
  switch (rank) {
    case 'Student': return 'bg-gray-500';
    case 'Cadet': return 'bg-blue-500';
    case 'Crew': return 'bg-green-500';
    case 'Pro Crew': return 'bg-purple-500';
    case 'Elite Crew': return 'bg-yellow-500';
    case 'Captain': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};
export const getBadgeIcon = (rank: BadgeRank): string => {
  switch (rank) {
    case 'Student': return '📚';
    case 'Cadet': return '🎓';
    case 'Crew': return '✈️';
    case 'Pro Crew': return '🌟';
    case 'Elite Crew': return '👑';
    case 'Captain': return '🏆';
    default: return '📚';
  }
};