import { motion } from 'framer-motion';
import { TypingIndicator as TypingIndicatorType } from '../../services/enhancedChatService';

interface TypingIndicatorProps {
  typingUsers: TypingIndicatorType[];
}

export default function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].userName} is typing`;
    }
    if (typingUsers.length === 2) {
      return `${typingUsers[0].userName} and ${typingUsers[1].userName} are typing`;
    }
    return `${typingUsers.length} people are typing`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-2 px-4 py-2 glass-card rounded-full w-fit"
    >
      <div className="flex gap-1">
        <motion.div
          className="w-2 h-2 bg-[#D71920] rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
        />
        <motion.div
          className="w-2 h-2 bg-[#D71920] rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
        />
        <motion.div
          className="w-2 h-2 bg-[#D71920] rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
        />
      </div>
      <span className="text-xs text-gray-600 font-medium">{getTypingText()}</span>
    </motion.div>
  );
}
