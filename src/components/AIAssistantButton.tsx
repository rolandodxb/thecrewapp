import { useState } from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import AIAssistant from './AIAssistant';
import { AIMode } from '../services/enhancedAIService';

interface AIAssistantButtonProps {
  initialMode?: AIMode;
  className?: string;
}

export default function AIAssistantButton({ initialMode = 'coach', className = '' }: AIAssistantButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed bottom-20 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow ${className}`}
        style={{ zIndex: 40 }}
      >
        <div className="relative">
          <Bot className="w-6 h-6" />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            className="absolute -top-1 -right-1"
          >
            <Sparkles className="w-3 h-3 text-yellow-300" />
          </motion.div>
        </div>
      </motion.button>

      {isOpen && (
        <AIAssistant
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          initialMode={initialMode}
        />
      )}
    </>
  );
}
