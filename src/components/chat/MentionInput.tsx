import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import { db } from '../../lib/auth';
import { User, AtSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  bio?: string;
  role?: string;
  plan?: string;
}
interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  onTyping?: () => void;
  conversationMembers?: string[];
}
export default function MentionInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled,
  onTyping,
  conversationMembers = [],
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<UserProfile[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState<number>(-1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserCard, setShowUserCard] = useState<UserProfile | null>(null);
  const [cardPosition, setCardPosition] = useState({ x: 0, y: 0 });
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const checkForMention = async () => {
      const cursorPosition = inputRef.current?.selectionStart || 0;
      const textBeforeCursor = value.substring(0, cursorPosition);
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');
      if (lastAtIndex !== -1) {
        const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
        if (!textAfterAt.includes(' ') && textAfterAt.length > 0) {
          setMentionStart(lastAtIndex);
          setSearchTerm(textAfterAt);
          await searchUsers(textAfterAt);
          setShowSuggestions(true);
          setSelectedIndex(0);
        } else if (textAfterAt.length === 0) {
          setMentionStart(lastAtIndex);
          setSearchTerm('');
          await loadConversationMembers();
          setShowSuggestions(true);
          setSelectedIndex(0);
        }
      } else {
        setShowSuggestions(false);
      }
    };
    checkForMention();
  }, [value]);
  const loadConversationMembers = async () => {
    try {
      const q = query(
        collection(db, 'users'),
        limit(20)
      );
      const snapshot = await getDocs(q);
      const users: UserProfile[] = snapshot.docs.map(doc => ({
        uid: doc.id,
        name: doc.data().name || 'Unknown',
        email: doc.data().email || '',
        photoURL: doc.data().photoURL,
        bio: doc.data().bio,
        role: doc.data().role,
        plan: doc.data().plan,
      }));
      setSuggestions(users);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };
  const searchUsers = async (search: string) => {
    if (search.length < 1) {
      setSuggestions([]);
      return;
    }
    try {
      const q = query(
        collection(db, 'users'),
        where('name', '>=', search),
        where('name', '<=', search + '\uf8ff'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      const users: UserProfile[] = snapshot.docs.map(doc => ({
        uid: doc.id,
        name: doc.data().name || 'Unknown',
        email: doc.data().email || '',
        photoURL: doc.data().photoURL,
        bio: doc.data().bio,
        role: doc.data().role,
        plan: doc.data().plan,
      }));
      setSuggestions(users);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };
  const insertMention = (user: UserProfile) => {
    if (mentionStart === -1) return;
    const beforeMention = value.substring(0, mentionStart);
    const afterMention = value.substring(inputRef.current?.selectionStart || value.length);
    const newValue = `${beforeMention}@${user.name} ${afterMention}`;
    onChange(newValue);
    setShowSuggestions(false);
    setMentionStart(-1);
    setSearchTerm('');
    setTimeout(() => {
      inputRef.current?.focus();
      const newPosition = mentionStart + user.name.length + 2;
      inputRef.current?.setSelectionRange(newPosition, newPosition);
    }, 0);
  };
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        insertMention(suggestions[selectedIndex]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    if (onTyping) onTyping();
  };
  const handleMentionClick = async (e: React.MouseEvent, mentionText: string) => {
    e.preventDefault();
    const userName = mentionText.substring(1).trim();
    try {
      const q = query(
        collection(db, 'users'),
        where('name', '==', userName),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        const userProfile: UserProfile = {
          uid: snapshot.docs[0].id,
          name: userData.name || 'Unknown',
          email: userData.email || '',
          photoURL: userData.photoURL,
          bio: userData.bio,
          role: userData.role,
          plan: userData.plan,
        };
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        setCardPosition({ x: rect.left, y: rect.bottom + 5 });
        setShowUserCard(userProfile);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };
  const renderMessageWithMentions = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span
            key={index}
            className="text-blue-600 font-semibold cursor-pointer hover:underline"
            onClick={(e) => handleMentionClick(e, part)}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };
  return (
    <div className="relative">
      <textarea
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        style={{ minHeight: '48px', maxHeight: '120px' }}
      />
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-64 overflow-y-auto z-50"
          >
            <div className="p-2">
              <div className="text-xs text-gray-500 px-3 py-2 flex items-center gap-2">
                <AtSign className="w-3 h-3" />
                Mention someone
              </div>
              {suggestions.map((user, index) => (
                <button
                  key={user.uid}
                  onClick={() => insertMention(user)}
                  className={`w-full px-3 py-2 rounded-lg text-left flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                    index === selectedIndex ? 'bg-blue-50' : ''
                  }`}
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{user.name}</div>
                    <div className="text-xs text-gray-500 truncate">{user.email}</div>
                  </div>
                  {user.plan && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                      {user.plan}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showUserCard && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowUserCard(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                position: 'fixed',
                left: cardPosition.x,
                top: cardPosition.y,
              }}
              className="z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-6 max-w-sm"
            >
              <div className="flex items-start gap-4">
                {showUserCard.photoURL ? (
                  <img
                    src={showUserCard.photoURL}
                    alt={showUserCard.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-500" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{showUserCard.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{showUserCard.email}</p>
                  {showUserCard.bio && (
                    <p className="text-sm text-gray-700 mb-3">{showUserCard.bio}</p>
                  )}
                  <div className="flex gap-2">
                    {showUserCard.role && (
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                        {showUserCard.role}
                      </span>
                    )}
                    {showUserCard.plan && (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                        {showUserCard.plan}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}