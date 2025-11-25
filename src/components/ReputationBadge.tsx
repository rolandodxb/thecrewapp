import { Shield, Star, Award, Crown, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface ReputationBadgeProps {
  score: number;
  tier: 'novice' | 'trusted' | 'veteran' | 'elite' | 'legendary';
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
}

export function ReputationBadge({ score, tier, size = 'md', showScore = false }: ReputationBadgeProps) {
  const getTierConfig = () => {
    switch (tier) {
      case 'legendary':
        return {
          icon: Crown,
          gradient: 'from-yellow-400 via-yellow-500 to-amber-500',
          text: 'Legendary',
          glow: 'shadow-yellow-500/50'
        };
      case 'elite':
        return {
          icon: Sparkles,
          gradient: 'from-purple-400 via-purple-500 to-pink-500',
          text: 'Elite',
          glow: 'shadow-purple-500/50'
        };
      case 'veteran':
        return {
          icon: Award,
          gradient: 'from-blue-400 via-blue-500 to-cyan-500',
          text: 'Veteran',
          glow: 'shadow-blue-500/50'
        };
      case 'trusted':
        return {
          icon: Star,
          gradient: 'from-green-400 via-green-500 to-emerald-500',
          text: 'Trusted',
          glow: 'shadow-green-500/50'
        };
      default:
        return {
          icon: Shield,
          gradient: 'from-gray-400 via-gray-500 to-gray-600',
          text: 'Novice',
          glow: 'shadow-gray-500/50'
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'px-2 py-1',
          icon: 'w-3 h-3',
          text: 'text-xs',
          score: 'text-xs'
        };
      case 'lg':
        return {
          container: 'px-4 py-2',
          icon: 'w-6 h-6',
          text: 'text-base',
          score: 'text-lg'
        };
      default:
        return {
          container: 'px-3 py-1.5',
          icon: 'w-4 h-4',
          text: 'text-sm',
          score: 'text-sm'
        };
    }
  };

  const config = getTierConfig();
  const sizeClasses = getSizeClasses();
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-2 bg-gradient-to-r ${config.gradient} text-white rounded-full ${sizeClasses.container} font-semibold shadow-lg ${config.glow}`}
    >
      <Icon className={sizeClasses.icon} />
      <span className={sizeClasses.text}>{config.text}</span>
      {showScore && (
        <>
          <span className="text-white/50">•</span>
          <span className={`${sizeClasses.score} font-bold`}>{score}</span>
        </>
      )}
    </motion.div>
  );
}
