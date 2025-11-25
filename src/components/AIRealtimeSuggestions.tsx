import { useState, useEffect } from 'react';
import { Lightbulb, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { enhancedAIService } from '../services/enhancedAIService';
import { aiContextService } from '../services/aiContextService';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function AIRealtimeSuggestions() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<
    Array<{
      type: string;
      message: string;
      priority: 'high' | 'medium' | 'low';
      action?: string;
    }>
  >([]);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const loadSuggestions = async () => {
      try {
        const context = await aiContextService.getUserContext(currentUser.uid);
        const newSuggestions = enhancedAIService.getRealtimeSuggestions(context);
        setSuggestions(newSuggestions);
      } catch (error) {
        console.error('Error loading suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSuggestions();

    const interval = setInterval(loadSuggestions, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const handleDismiss = (type: string) => {
    setDismissedSuggestions((prev) => new Set(prev).add(type));
  };

  const handleAction = (action?: string) => {
    if (!action) return;

    switch (action) {
      case 'browse-courses':
        navigate('/courses');
        break;
      case 'view-marketplace':
        navigate('/marketplace');
        break;
      case 'create-module':
        navigate('/create-module');
        break;
      case 'create-product':
        navigate('/create-product');
        break;
      case 'view-progress':
        navigate('/my-progress');
        break;
      case 'create-post':
        navigate('/community-feed');
        break;
      case 'view-analytics':
        navigate('/coach-dashboard');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const visibleSuggestions = suggestions.filter(
    (s) => !dismissedSuggestions.has(s.type)
  );

  if (loading || visibleSuggestions.length === 0) return null;

  const priorityColors = {
    high: 'border-red-500 bg-red-50',
    medium: 'border-orange-500 bg-orange-50',
    low: 'border-blue-500 bg-blue-50',
  };

  const priorityIcons = {
    high: '🔥',
    medium: '⚡',
    low: '💡',
  };

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {visibleSuggestions.map((suggestion, index) => (
          <motion.div
            key={suggestion.type}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ delay: index * 0.1 }}
            className={`border-l-4 ${priorityColors[suggestion.priority]} rounded-lg p-3 shadow-sm`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 text-xl">
                {priorityIcons[suggestion.priority]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-gray-900 font-medium">{suggestion.message}</p>
                  <button
                    onClick={() => handleDismiss(suggestion.type)}
                    className="flex-shrink-0 p-1 hover:bg-white/50 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                {suggestion.action && (
                  <button
                    onClick={() => handleAction(suggestion.action)}
                    className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <span>Take Action</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
