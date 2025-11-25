import { useState } from 'react';
import { X, Users, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface CreateConversationModalProps {
  onClose: () => void;
  onCreateGroup: (title: string, memberIds: string[]) => void;
  onCreatePrivate: (memberId: string) => void;
  availableUsers: Array<{ id: string; name: string; photoURL?: string }>;
}

export default function CreateConversationModal({
  onClose,
  onCreateGroup,
  onCreatePrivate,
  availableUsers,
}: CreateConversationModalProps) {
  const [type, setType] = useState<'group' | 'private'>('private');
  const [title, setTitle] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card p-6 rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">New Conversation</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setType('private')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all ${
              type === 'private'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="font-medium">Direct Message</span>
          </button>
          <button
            onClick={() => setType('group')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all ${
              type === 'group'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="font-medium">Group Chat</span>
          </button>
        </div>

        {type === 'group' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter group name"
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {type === 'group' ? 'Select Members' : 'Select User'}
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
          />
        </div>

        <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
          {filteredUsers.map((user) => (
            <button
              key={user.id}
              onClick={() => toggleUser(user.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                selectedUsers.includes(user.id)
                  ? 'bg-blue-50 border-2 border-blue-500'
                  : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-gray-900">{user.name}</div>
              </div>
              {selectedUsers.includes(user.id) && (
                <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
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
            <div className="text-center py-8 text-gray-500">
              No users found
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={
              (type === 'group' && (!title.trim() || selectedUsers.length === 0)) ||
              (type === 'private' && selectedUsers.length !== 1)
            }
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create
          </button>
        </div>
      </motion.div>
    </div>
  );
}
