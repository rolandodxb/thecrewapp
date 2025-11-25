import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Mail, MapPin, Calendar, Award, BookOpen, TrendingUp, Filter } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy as firestoreOrderBy } from 'firebase/firestore';
import { useApp } from '../context/AppContext';

interface Student {
  id: string;
  name: string;
  email: string;
  country: string;
  plan: string;
  createdAt: string;
  updatedAt: string;
  bio: string;
  photo_base64: string;
  photoURL?: string;
}

interface StudentStats {
  totalCourses: number;
  completedCourses: number;
  enrolledCourses: number;
}

export default function StudentsPage() {
  const { currentUser } = useApp();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string>('all');

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'student'));
      const querySnapshot = await getDocs(q);

      const studentsData: Student[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        studentsData.push({
          id: doc.id,
          name: data.name || data.displayName || 'Unknown',
          email: data.email || '',
          country: data.country || 'Not specified',
          plan: data.plan || data.subscription || 'free',
          createdAt: data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate().toISOString() : data.createdAt) : new Date().toISOString(),
          updatedAt: data.updatedAt ? (typeof data.updatedAt.toDate === 'function' ? data.updatedAt.toDate().toISOString() : data.updatedAt) : new Date().toISOString(),
          bio: data.bio || '',
          photo_base64: data.photo_base64 || '',
          photoURL: data.photoURL || data.profilePicture || ''
        });
      });

      studentsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.country.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = selectedPlan === 'all' || student.plan === selectedPlan;
    return matchesSearch && matchesPlan;
  });

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'vip':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white';
      case 'pro':
        return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  const getStudentInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D71921] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#000000] flex items-center gap-3">
            <Users className="w-8 h-8 text-[#D71921]" />
            Students Management
          </h1>
          <p className="text-gray-600 mt-1">View and manage all registered students</p>
        </div>
        <div className="bg-gradient-to-br from-[#D71921] to-[#B91518] text-white px-6 py-3 rounded-xl font-bold shadow-lg">
          {filteredStudents.length} Students
        </div>
      </div>

      <div className="glass-light rounded-2xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71921] focus:outline-none transition"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="pl-12 pr-8 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71921] focus:outline-none transition appearance-none glass-light cursor-pointer"
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="vip">VIP</option>
            </select>
          </div>
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="glass-light rounded-2xl shadow-lg p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">No Students Found</h3>
          <p className="text-gray-600">
            {searchTerm || selectedPlan !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No students have registered yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredStudents.map((student, index) => {

            return (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-light rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition"
              >
                <div className="bg-gradient-to-r from-[#EADBC8] to-[#F5E6D3] p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-[#D71921] to-[#B91518] flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-lg">
                      {(student.photoURL || student.photo_base64) ? (
                        <img
                          src={student.photoURL || student.photo_base64}
                          alt={student.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getStudentInitials(student.name)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-[#000000] truncate">{student.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{student.email}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPlanBadgeColor(student.plan)}`}>
                      {student.plan.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-4 h-4 text-[#D71921]" />
                    <span>{student.country}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-4 h-4 text-[#D71921]" />
                    <span>Joined {new Date(student.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-700">
                    <TrendingUp className="w-4 h-4 text-[#D71921]" />
                    <span>Last updated: {new Date(student.updatedAt).toLocaleDateString()}</span>
                  </div>

                  {student.bio && (
                    <p className="text-sm text-gray-600 line-clamp-3 pt-2 border-t border-gray-100">
                      {student.bio}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
