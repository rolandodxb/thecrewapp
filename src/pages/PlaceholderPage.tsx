import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface PlaceholderPageProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export default function PlaceholderPage({ icon: Icon, title, description }: PlaceholderPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center min-h-[60vh]"
    >
      <div className="text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-[#D71920] to-[#B91518] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Icon className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-[#1C1C1C] mb-4">{title}</h1>
        <p className="text-gray-600 max-w-md mx-auto mb-8">{description}</p>
        <div className="bg-[#EADBC8]/30 rounded-xl p-6 max-w-md mx-auto">
          <p className="text-sm text-gray-600">
            This feature is coming soon. UI components are ready for backend integration.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
