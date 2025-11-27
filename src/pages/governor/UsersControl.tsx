import { useState } from 'react';
import { useEffect } from 'react';
import { User as UserType } from '../../context/AppContext';
import { Search, Ban, Volume2, VolumeX, TrendingUp, TrendingDown, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function UsersControl() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      const usersData: UserType[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          email: data.email || '',
          name: data.name || 'Unknown User',
          role: data.role || 'student',
          plan: data.plan || 'free',
          country: data.country || '',
          bio: data.bio || '',
          photoURL: data.photo_base64 || '',
          expectations: data.expectations || '',
          hasCompletedOnboarding: data.hasCompletedOnboarding || false,
          hasSeenWelcomeBanner: data.hasSeenWelcomeBanner || false,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          banned: data.banned || false,
          muted: data.muted || false,
        };
      });
      
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleBan = async (userId: string) => {
    try {
      const user = users.find(u => u.uid === userId);
      if (!user) return;
      
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        banned: !user.banned,
        updatedAt: new Date().toISOString()
      });
      
      setUsers(users.map(u => u.uid === userId ? { ...u, banned: !u.banned } : u));
    } catch (error) {
      console.error('Error updating user ban status:', error);
      alert('Failed to update user status. Please try again.');
    }
  };

  const handleMute = async (userId: string) => {
    try {
      const user = users.find(u => u.uid === userId);
      if (!user) return;
      
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        muted: !user.muted,
        updatedAt: new Date().toISOString()
      });
      
      setUsers(users.map(u => u.uid === userId ? { ...u, muted: !u.muted } : u));
    } catch (error) {
      console.error('Error updating user mute status:', error);
      alert('Failed to update user status. Please try again.');
    }
  };

  const handlePromote = async (userId: string) => {
    try {
      const user = users.find(u => u.uid === userId);
      if (!user) return;
      
      const newRole = user.role === 'student' ? 'mentor' : user.role === 'mentor' ? 'governor' : 'governor';
      
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: new Date().toISOString()
      });
      
      setUsers(users.map(u => u.uid === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error('Error promoting user:', error);
      alert('Failed to promote user. Please try again.');
    }
  };

  const handleDemote = async (userId: string) => {
    try {
      const user = users.find(u => u.uid === userId);
      if (!user) return;
      
      const newRole = user.role === 'governor' ? 'mentor' : user.role === 'mentor' ? 'student' : 'student';
      
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: new Date().toISOString()
      });
      
      setUsers(users.map(u => u.uid === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error('Error demoting user:', error);
      alert('Failed to demote user. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D71920] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#1C1C1C] mb-2">Users Control</h1>
        <p className="text-gray-600">Manage all platform users and permissions</p>
      </div>

      <div className="glass-light rounded-2xl shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 transition"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 transition"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="mentor">Mentors</option>
            <option value="governor">Governors</option>
          </select>

          <div className="col-span-2 flex items-center justify-end gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Active: {users.filter(u => !u.banned).length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">Banned: {users.filter(u => u.banned).length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-light rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#EADBC8]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#1C1C1C]">User</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#1C1C1C]">Role</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#1C1C1C]">Country</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#1C1C1C]">Status</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-[#1C1C1C]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <motion.tr
                  key={user.uid}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-gray-100 hover:bg-[#EADBC8]/20 transition"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.photoURL || `data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23ddd%22 width=%22200%22 height=%22200%22/%3E%3Ctext fill=%22%23999%22 font-family=%22sans-serif%22 font-size=%2260%22 dy=%2210.5rem%22 font-weight=%22bold%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22%3E${user.name?.[0] || 'U'}%3C/text%3E%3C/svg%3E`}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-bold text-[#1C1C1C]">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${
                      user.role === 'governor' ? 'bg-[#B9975B] text-white' :
                      user.role === 'mentor' ? 'bg-[#D71920] text-white' :
                      'bg-gray-200 text-gray-700'
                    }`}>
                      {user.role === 'governor' && <Shield className="w-3 h-3" />}
                      <span className="capitalize">{user.role}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-600">{user.country}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {user.banned && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600">
                          <Ban className="w-3 h-3" />
                          Banned
                        </span>
                      )}
                      {user.muted && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-600">
                          <VolumeX className="w-3 h-3" />
                          Muted
                        </span>
                      )}
                      {!user.banned && !user.muted && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Active
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleBan(user.uid)}
                        className={`p-2 rounded-lg transition ${
                          user.banned
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-red-100 text-red-600 hover:bg-red-200'
                        }`}
                        title={user.banned ? 'Unban' : 'Ban'}
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMute(user.uid)}
                        className={`p-2 rounded-lg transition ${
                          user.muted
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                        }`}
                        title={user.muted ? 'Unmute' : 'Mute'}
                      >
                        {user.muted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handlePromote(user.uid)}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                        title="Promote"
                        disabled={user.role === 'governor'}
                      >
                        <TrendingUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDemote(user.uid)}
                        className="p-2 glass-bubble text-gray-600 rounded-lg hover:bg-gray-200 transition"
                        title="Demote"
                        disabled={user.role === 'student'}
                      >
                        <TrendingDown className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
