import { BadgeRank, getBadgeColor, getBadgeIcon } from '../services/rewardsService';

interface BadgeDisplayProps {
  rank: BadgeRank;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  verifiedCrew?: boolean;
}

export default function BadgeDisplay({ rank, size = 'md', showLabel = true, verifiedCrew = false }: BadgeDisplayProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  const iconSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl'
  };

  if (verifiedCrew) {
    return (
      <span className={`inline-flex items-center gap-1 ${sizeClasses[size]} bg-gradient-to-r from-[#D71920] to-[#B91518] text-white font-bold rounded-full`}>
        <span className={iconSizes[size]}>✓</span>
        {showLabel && <span>Verified Crew</span>}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 ${sizeClasses[size]} ${getBadgeColor(rank)} text-white font-bold rounded-full`}>
      <span className={iconSizes[size]}>{getBadgeIcon(rank)}</span>
      {showLabel && <span>{rank}</span>}
    </span>
  );
}
