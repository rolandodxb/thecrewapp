import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl md:rounded-2xl shadow-lg p-8 md:p-12 text-center"
    >
      <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Icon className="w-10 h-10 md:w-12 md:h-12 text-gray-400" />
      </div>
      <h3 className="text-xl md:text-2xl font-bold text-[#000000] mb-3">
        {title}
      </h3>
      <p className="text-sm md:text-base text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {action && (
            <button
              onClick={action.onClick}
              className="px-6 py-3 bg-gradient-to-r from-[#D71921] to-[#B91518] text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:shadow-[#FFD700]/30 transition"
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-6 py-3 bg-[#FFD700] text-[#000000] rounded-xl font-bold hover:bg-[#D4AF37] transition"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
