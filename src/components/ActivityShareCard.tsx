import { Calendar, MapPin, Users, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Activity } from '../services/activityAttendanceService';

interface ActivityShareCardProps {
  activity: Activity;
  onJoin?: (activityId: string) => void;
  isJoined?: boolean;
  currentUserId?: string;
}

export function ActivityShareCard({ activity, onJoin, isJoined, currentUserId }: ActivityShareCardProps) {
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    if (!onJoin || !currentUserId) return;

    setJoining(true);
    try {
      await onJoin(activity.id);
    } catch (error) {
      console.error('Error joining activity:', error);
    } finally {
      setJoining(false);
    }
  };

  const eventDate = activity.date.toDate();
  const isPast = eventDate < new Date();
  const isFull = activity.maxAttendees && activity.totalCheckIns >= activity.maxAttendees;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 border-2 border-[#D71920]/20 shadow-lg max-w-md my-2"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 bg-gradient-to-r from-[#D71920] to-[#B91518] rounded-lg flex items-center justify-center flex-shrink-0">
          <Calendar className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-gray-900 text-lg mb-1">{activity.name}</h4>
          <p className="text-sm text-gray-600 line-clamp-2">{activity.description}</p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Calendar className="w-4 h-4 text-[#D71920]" />
          <span className="font-medium">
            {eventDate.toLocaleDateString()} at{' '}
            {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <MapPin className="w-4 h-4 text-[#D71920]" />
          <span>{activity.location}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Users className="w-4 h-4 text-[#D71920]" />
          <span>
            {activity.totalCheckIns} joined
            {activity.maxAttendees && ` / ${activity.maxAttendees} max`}
          </span>
        </div>
      </div>

      <div className="pt-3 border-t border-gray-200">
        {isJoined ? (
          <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-center font-semibold flex items-center justify-center gap-2">
            <UserPlus className="w-4 h-4" />
            You're Attending!
          </div>
        ) : isPast ? (
          <div className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-center font-semibold">
            Event Ended
          </div>
        ) : isFull ? (
          <div className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-center font-semibold">
            Event Full
          </div>
        ) : (
          <button
            onClick={handleJoin}
            disabled={joining || !activity.checkInEnabled}
            className="w-full px-4 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-lg hover:shadow-lg transition font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus className="w-5 h-5" />
            {joining ? 'Joining...' : activity.checkInEnabled ? 'Join Activity' : 'Registration Closed'}
          </button>
        )}
      </div>

      <div className="mt-3 text-xs text-gray-500 text-center">
        {!activity.checkInEnabled && !isPast && !isFull && 'Registration will open soon'}
        {activity.checkInEnabled && !isPast && !isFull && 'Free to join - No payment required'}
      </div>
    </motion.div>
  );
}
