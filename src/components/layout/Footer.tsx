import { Heart, Shield, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="liquid-footer border-t border-white/20 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span>© {currentYear} The Crew Academy</span>
            </div>
            <span className="hidden sm:inline text-gray-400">|</span>
            <div className="hidden sm:flex items-center gap-1">
              <span>Made with</span>
              <Heart className="w-3 h-3 text-red-500 fill-current" />
              <span>in UAE</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/support"
              className="flex items-center gap-1 hover:text-gray-900 transition-colors"
            >
              <Mail className="w-3 h-3" />
              <span className="hidden sm:inline">Support</span>
            </Link>
            <span className="text-gray-400">|</span>
            <Link
              to="/support"
              className="flex items-center gap-1 hover:text-gray-900 transition-colors"
            >
              <Shield className="w-3 h-3" />
              <span className="hidden sm:inline">Privacy</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
