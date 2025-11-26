import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface DashboardHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  colorFrom: string;
  colorTo: string;
  borderColor?: string;
}

export default function DashboardHeader({
  icon: Icon,
  title,
  subtitle,
  colorFrom,
  colorTo,
  borderColor = 'transparent'
}: DashboardHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-light border-2 border-${borderColor} hover:border-${borderColor} rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-lg transition`}
    >
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-${colorFrom} to-${colorTo} rounded-lg sm:rounded-xl flex items-center justify-center shadow-md flex-shrink-0`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight truncate">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 line-clamp-1">
            {subtitle}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
