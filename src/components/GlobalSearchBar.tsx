import { useState, useEffect, useRef } from 'react';
import { Search, User, BookOpen, Package, Folder, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { globalSearch, SearchResult } from '../services/globalSearchService';

export default function GlobalSearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delaySearch = setTimeout(async () => {
      if (searchTerm.trim().length < 2) {
        setResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const searchResults = await globalSearch(searchTerm);
        setResults(searchResults);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchTerm]);

  const handleResultClick = (result: SearchResult) => {
    navigate(result.link);
    setSearchTerm('');
    setShowResults(false);
    setResults([]);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <User className="w-5 h-5" />;
      case 'course':
        return <BookOpen className="w-5 h-5" />;
      case 'module':
        return <Folder className="w-5 h-5" />;
      case 'product':
        return <Package className="w-5 h-5" />;
      default:
        return <Search className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'user':
        return 'bg-blue-100 text-blue-600';
      case 'course':
        return 'bg-green-100 text-green-600';
      case 'module':
        return 'bg-purple-100 text-purple-600';
      case 'product':
        return 'bg-orange-100 text-orange-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Search for users, courses, modules, or products..."
          className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#D71920] transition"
        />
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('');
              setResults([]);
              setShowResults(false);
            }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showResults && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 max-h-96 overflow-y-auto"
          >
            {results.map((result, index) => (
              <motion.button
                key={`${result.type}-${result.id}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleResultClick(result)}
                className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
              >
                {result.imageUrl ? (
                  <img
                    src={result.imageUrl}
                    alt={result.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getTypeColor(result.type)}`}>
                    {getIcon(result.type)}
                  </div>
                )}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900">{result.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(result.type)}`}>
                      {result.type}
                    </span>
                  </div>
                  {result.subtitle && (
                    <p className="text-sm text-gray-500 line-clamp-1">{result.subtitle}</p>
                  )}
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {isSearching && searchTerm && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-lg p-4 text-center">
          <div className="w-6 h-6 border-3 border-[#D71920] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Searching...</p>
        </div>
      )}

      {!isSearching && showResults && results.length === 0 && searchTerm.length >= 2 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-lg p-6 text-center">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-600">No results found for "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
}
