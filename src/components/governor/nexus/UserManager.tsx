import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, Ban, TrendingDown, CheckCircle, XCircle, Search, Filter, Mail, Key, UserX, UserCheck } from 'lucide-react';
import { useFirestoreCollection } from '../../../hooks/useFirestoreRealtime';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useApp } from '../../../context/AppContext';
import { auditLogService } from '../../../services/auditLogService';

interface User {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: string;
  subscription?: string;
  plan?: string;
  status?: string;
  banned?: boolean;
  muted?: boolean;
  verified?: boolean;
  lastLogin?: any;
  createdAt?: any;
}

export default function UserManager() {
  const { currentUser } = useApp();
  const { data: allUsers, loading } = useFirestoreCollection<User>('users');
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const isGovernor = currentUser?.role === 'governor';

  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesPlan = planFilter === 'all' || (user.subscription || user.plan) === planFilter;
    const matchesStatus = statusFilter === 'all' ||
                          (statusFilter === 'banned' && user.banned) ||
                          (statusFilter === 'muted' && user.muted) ||
                          (statusFilter === 'active' && !user.banned && !user.muted);
    return matchesSearch && matchesRole && matchesPlan && matchesStatus;
  });

  const toggleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.size === 0) return;
    if (!confirm(`${action} ${selectedUsers.size} selected users?`)) return;

    setProcessing('bulk');
    try {
      const promises = Array.from(selectedUsers).map(async (userId) => {
        const user = allUsers.find(u => u.id === userId);
        if (!user) return;

        const updates: any = { updatedAt: new Date().toISOString() };

        switch (action) {
          case 'ban':
            updates.banned = true;
            break;
          case 'unban':
            updates.banned = false;
            break;
          case 'mute':
            updates.muted = true;
            break;
          case 'unmute':
            updates.muted = false;
            break;
          case 'downgrade':
            updates.subscription = 'free';
            updates.plan = 'free';
            break;
        }

        await updateDoc(doc(db, 'users', userId), updates);
        await auditLogService.log(
          currentUser!.uid,
          currentUser!.email,
          `Bulk ${action}: ${user.email}`,
          'admin_action',
          { targetEmail: user.email, action }
        );
      });

      await Promise.all(promises);
      setSelectedUsers(new Set());
      alert(`Successfully ${action}ed ${selectedUsers.size} users`);
    } catch (error) {
      console.error('Error performing bulk action:', error);
      alert('Failed to complete bulk action');
    } finally {
      setProcessing(null);
    }
  };

  const handleSingleAction = async (user: User, action: string) => {
    if (!isGovernor) return;

    setProcessing(user.id);
    try {
      const updates: any = { updatedAt: new Date().toISOString() };

      switch (action) {
        case 'ban':
          updates.banned = true;
          break;
        case 'unban':
          updates.banned = false;
          break;
        case 'mute':
          updates.muted = true;
          break;
        case 'unmute':
          updates.muted = false;
          break;
        case 'downgrade':
          updates.subscription = 'free';
          updates.plan = 'free';
          break;
        case 'promote':
          const newRole = prompt('Enter new role (student, crew, mentor, governor):', user.role);
          if (newRole && ['student', 'crew', 'mentor', 'governor'].includes(newRole)) {
            updates.role = newRole;
          } else {
            throw new Error('Invalid role');
          }
          break;
        case 'verify':
          updates.verified = true;
          break;
      }

      await updateDoc(doc(db, 'users', user.id), updates);
      await auditLogService.log(
        currentUser!.uid,
        currentUser!.email,
        `${action}: ${user.email}`,
        'admin_action',
        { targetEmail: user.email, action, changes: updates }
      );
    } catch (error) {
      console.error('Error performing action:', error);
      alert('Failed to perform action');
    } finally {
      setProcessing(null);
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      governor: 'bg-red-100 text-red-800',
      mentor: 'bg-blue-100 text-blue-800',
      crew: 'bg-green-100 text-green-800',
      student: 'bg-gray-100 text-gray-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      vip: 'bg-purple-100 text-purple-800',
      pro: 'bg-blue-100 text-blue-800',
      basic: 'bg-green-100 text-green-800',
      free: 'bg-gray-100 text-gray-800',
    };
    return colors[plan] || 'bg-gray-100 text-gray-800';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-light rounded-xl shadow-lg border border-gray-200 p-3 md:p-6"
    >
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-700" />
          <h2 className="text-xl font-bold text-gray-900">User Manager</h2>
          {!loading && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {filteredUsers.length}/{allUsers.length}
            </span>
          )}
        </div>
        {selectedUsers.size > 0 && (
          <span className="text-sm font-semibold text-blue-600">
            {selectedUsers.size} selected
          </span>
        )}
      </div>

      {!isGovernor && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
          View only mode. User management requires governor access.
        </div>
      )}

      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="crew">Crew</option>
            <option value="mentor">Mentors</option>
            <option value="governor">Governors</option>
          </select>

          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="basic">Basic</option>
            <option value="pro">Pro</option>
            <option value="vip">VIP</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
            <option value="muted">Muted</option>
          </select>
        </div>

        {isGovernor && selectedUsers.size > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <span className="text-sm font-semibold text-blue-900">Bulk Actions:</span>
            <button
              onClick={() => handleBulkAction('ban')}
              disabled={processing !== null}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition"
            >
              Ban Selected
            </button>
            <button
              onClick={() => handleBulkAction('unban')}
              disabled={processing !== null}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition"
            >
              Unban Selected
            </button>
            <button
              onClick={() => handleBulkAction('mute')}
              disabled={processing !== null}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition"
            >
              Mute Selected
            </button>
            <button
              onClick={() => handleBulkAction('downgrade')}
              disabled={processing !== null}
              className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition"
            >
              Downgrade to Free
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-3">Loading users...</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {isGovernor && filteredUsers.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg sticky top-0 z-10">
              <input
                type="checkbox"
                checked={selectedUsers.size === filteredUsers.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <span className="text-sm font-semibold text-gray-700">Select All</span>
            </div>
          )}

          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className={`glass-light border rounded-xl p-4 hover:border-gray-400 transition ${
                selectedUsers.has(user.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                {isGovernor && (
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(user.id)}
                    onChange={() => toggleSelectUser(user.id)}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-bold text-gray-900 break-words">{user.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${getRoleBadge(user.role)}`}>
                      {user.role.toUpperCase()}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${getPlanBadge(user.subscription || user.plan || 'free')}`}>
                      {(user.subscription || user.plan || 'free').toUpperCase()}
                    </span>
                    {user.banned && (
                      <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-xs font-bold">
                        BANNED
                      </span>
                    )}
                    {user.muted && (
                      <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 text-xs font-bold">
                        MUTED
                      </span>
                    )}
                    {user.verified && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 break-all">{user.email}</p>
                  {user.lastLogin && (
                    <p className="text-xs text-gray-500 mt-1">
                      Last login: {new Date(user.lastLogin.toDate?.() || user.lastLogin).toLocaleString()}
                    </p>
                  )}
                </div>

                {isGovernor && (
                  <div className="flex flex-wrap gap-1 flex-shrink-0">
                    {user.banned ? (
                      <button
                        onClick={() => handleSingleAction(user, 'unban')}
                        disabled={processing === user.id}
                        className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
                        title="Unban"
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSingleAction(user, 'ban')}
                        disabled={processing === user.id}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
                        title="Ban"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleSingleAction(user, 'promote')}
                      disabled={processing === user.id}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
                      title="Change Role"
                    >
                      <Shield className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleSingleAction(user, 'downgrade')}
                      disabled={processing === user.id}
                      className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition disabled:opacity-50"
                      title="Downgrade"
                    >
                      <TrendingDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-gray-600">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No users found matching filters</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
