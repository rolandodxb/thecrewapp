import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Star, Flame } from 'lucide-react';
import { getUserPoints, getPointsToNextRank, UserPoints } from '../services/rewardsService';
import BadgeDisplay from './BadgeDisplay';
import ProgressBar from './ProgressBar';

interface PointsDashboardProps {
  userId: string;
}

export default function PointsDashboard({ userId }: PointsDashboardProps) {
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserPoints();
  }, [userId]);

  const loadUserPoints = async () => {
    setLoading(true);
    const data = await getUserPoints(userId);
    setUserPoints(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!userPoints) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg text-center">
        <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600">No points data available</p>
      </div>
    );
  }

  const pointsToNext = getPointsToNextRank(userPoints.total_points);

  return (
    <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-6 shadow-lg border-2 border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Trophy className="w-7 h-7 text-[#D71920]" />
          Your Progress
        </h2>
        <BadgeDisplay
          rank={userPoints.current_rank}
          size="lg"
          verifiedCrew={userPoints.verified_crew}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-[#D71920] to-[#B91518] rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5" />
            <span className="text-sm font-semibold opacity-90">Total Points</span>
          </div>
          <p className="text-3xl font-bold">{userPoints.total_points.toLocaleString()}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5" />
            <span className="text-sm font-semibold opacity-90">Daily Streak</span>
          </div>
          <p className="text-3xl font-bold">{userPoints.daily_login_streak} days</p>
        </div>
      </div>

      {!userPoints.verified_crew && pointsToNext > 0 && (
        <div className="mb-4">
          <ProgressBar
            current={userPoints.total_points}
            max={userPoints.total_points + pointsToNext}
            label="Progress to Next Rank"
            showPercentage={false}
            color="bg-gradient-to-r from-[#D71920] to-[#B91518]"
          />
          <p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            {pointsToNext} points until next rank
          </p>
        </div>
      )}

      {userPoints.verified_crew && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
          <p className="text-green-800 font-semibold text-center">
            🎉 Congratulations on becoming verified crew!
          </p>
        </div>
      )}
    </div>
  );
}
