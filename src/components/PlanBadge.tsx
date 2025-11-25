import { Plan } from '../context/AppContext';
import { Crown, Shield, Circle } from 'lucide-react';

interface PlanBadgeProps {
  plan: Plan;
  size?: 'sm' | 'md' | 'lg';
}

export default function PlanBadge({ plan, size = 'md' }: PlanBadgeProps) {
  const configs = {
    free: {
      label: 'Free',
      icon: Circle,
      bgColor: 'bg-gray-500',
      textColor: 'text-white',
      borderColor: 'border-gray-600',
    },
    pro: {
      label: 'Pro',
      icon: Shield,
      bgColor: 'bg-gradient-to-r from-[#FF3B3F] to-[#E6282C]',
      textColor: 'text-white',
      borderColor: 'border-[#E6282C]',
    },
    vip: {
      label: 'VIP',
      icon: Crown,
      bgColor: 'bg-gradient-to-r from-[#3D4A52] to-[#2A3439]',
      textColor: 'text-white',
      borderColor: 'border-[#2A3439]',
    },
  };

  const config = configs[plan];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border-2 font-bold shadow-md ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses[size]}`}
    >
      <Icon className={iconSizes[size]} />
      <span>{config.label}</span>
    </div>
  );
}
