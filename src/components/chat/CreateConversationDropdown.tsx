import { useState } from 'react';
import { X, Users, MessageCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateConversationDropdownProps {
  onCreateGroup: (title: string, memberIds: string[]) => void;
  onCreatePrivate: (memberId: string) => void;
  availableUsers: Array<{ id: string; name: string; photoURL?: string }>;
  onClose: () => void;
}

export default function CreateConversationDropdown({
  onCreateGroup,
  onCreatePrivate,
  availableUsers,
  onClose,
}: CreateConversationDropdownProps) {
  const [type, setType] = useState<'group' | 'private'>('private');
  const [title, setTitle] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredUsers = availableUsers.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    if (type === 'group') {
      if (!title.trim() || selectedUsers.length === 0) {
        alert('Please enter a group name and select members');
        return;
      }
      onCreateGroup(title.trim(), selectedUsers);
    } else {
      if (selectedUsers.length !== 1) {
        alert('Please select one user for direct message');
        return;
      }
      onCreatePrivate(selectedUsers[0]);
    }
    onClose();
  };

  const toggleUser = (userId: string) => {
    if (type === 'private') {
      setSelectedUsers([userId]);
    } else {
      setSelectedUsers((prev) =>
        prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
      );
    }
  };

  return (
    <div className="border-b border-white/20 backdrop-blur-sm bg-white/10">
      <div className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">New Conversation</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setType('private');
              setSelectedUsers([]);
            }}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all ${
              type === 'private'
                ? 'bg-blue-600 text-white'
                : 'bg-white/20 text-gray-700 hover:bg-white/30'
            }`}
          >
            <MessageCircle className="w-3 h-3" />
            <span>Direct</span>
          </button>
          <button
            onClick={() => {
              setType('group');
              setSelectedUsers([]);
            }}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all ${
              type === 'group'
                ? 'bg-blue-600 text-white'
                : 'bg-white/20 text-gray-700 hover:bg-white/30'
            }`}
          >
            <Users className="w-3 h-3" />
            <span>Group</span>
          </button>
        </div>

        {type === 'group' && (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Group name"
            className="w-full px-3 py-1.5 bg-white/20 border border-white/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600"
          />
        )}

        <div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between px-3 py-1.5 bg-white/20 border border-white/30 rounded-lg text-sm hover:bg-white/30 transition-colors"
          >
            <span className="text-gray-700">
              {selectedUsers.length > 0
                ? `${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''} selected`
                : type === 'group'
                ? 'Select members'
                : 'Select user'}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users..."
                    className="w-full px-3 py-1.5 bg-white/20 border border-white/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600 mb-2"
                  />
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => toggleUser(user.id)}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg transition-all text-left ${
                        selectedUsers.includes(user.id)
                          ? 'bg-blue-100 border border-blue-500'
                          : 'bg-white/20 hover:bg-white/30'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-900">{user.name}</span>
                      {selectedUsers.includes(user.id) && (
                        <div className="ml-auto w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No users found
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-gray-700 text-sm font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={
              (type === 'group' && (!title.trim() || selectedUsers.length === 0)) ||
              (type === 'private' && selectedUsers.length !== 1)
            }
            className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
