import { motion } from 'framer-motion';
import { UserPresence } from '../../services/enhancedChatService';

interface PresenceBadgeProps {
  presence: UserPresence | null;
  size?: 'sm' | 'md' | 'lg';
}

export default function PresenceBadge({ presence, size = 'md' }: PresenceBadgeProps) {
  if (!presence) return null;

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const getStatusColor = () => {
    switch (presence.status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    if (presence.status === 'online') return 'Online';
    if (presence.status === 'away') return 'Away';

    const now = Date.now();
    const lastSeen = presence.lastSeen.toDate().getTime();
    const diff = now - lastSeen;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="relative inline-flex items-center group">
      <motion.div
        className={`${sizeClasses[size]} ${getStatusColor()} rounded-full border-2 border-white`}
        animate={
          presence.status === 'online'
            ? { scale: [1, 1.2, 1] }
            : {}
        }
        transition={{ duration: 2, repeat: Infinity }}
      />
      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        {getStatusText()}
      </div>
    </div>
  );
}
