import { Timestamp } from 'firebase/firestore';

interface MessageBubbleProps {
  text: string;
  senderName?: string;
  senderRole: 'student' | 'mentor' | 'governor';
  createdAt: Timestamp;
  isOwn: boolean;
}

export default function MessageBubble({
  text,
  senderName,
  senderRole,
  createdAt,
  isOwn,
}: MessageBubbleProps) {
  const formatTime = (timestamp: Timestamp | null) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate();
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getRoleStyle = () => {
    if (isOwn) {
      switch (senderRole) {
        case 'mentor':
          return 'bg-gradient-to-r from-[#D71921] to-[#B91518] text-white';
        case 'governor':
          return 'bg-gradient-to-r from-[#FFD700] to-[#D4AF37] text-[#000000]';
        default:
          return 'bg-gray-200 text-gray-800';
      }
    } else {
      switch (senderRole) {
        case 'mentor':
          return 'bg-red-50 border-2 border-red-200 text-gray-800';
        case 'governor':
          return 'bg-yellow-50 border-2 border-yellow-300 text-gray-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    }
  };

  const getRoleBadge = () => {
    switch (senderRole) {
      case 'mentor':
        return '👨‍🏫 Mentor';
      case 'governor':
        return '👑 Governor';
      default:
        return '🎓 Student';
    }
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[75%] md:max-w-[60%]`}>
        {!isOwn && senderName && (
          <div className="mb-1 px-2">
            <span className="text-xs font-bold text-gray-600">{senderName}</span>
            <span className="ml-2 text-xs text-gray-500">{getRoleBadge()}</span>
          </div>
        )}
        <div className={`rounded-2xl px-4 py-3 ${getRoleStyle()}`}>
          <p className="text-sm whitespace-pre-wrap break-words">{text}</p>
        </div>
        <div className={`mt-1 px-2 text-xs text-gray-400 ${isOwn ? 'text-right' : 'text-left'}`}>
          {formatTime(createdAt)}
        </div>
      </div>
    </div>
  );
}
