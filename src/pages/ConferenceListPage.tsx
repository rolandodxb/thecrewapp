import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Users, Lock, Calendar, Clock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Conference {
  id: string;
  title: string;
  description: string;
  hostId: string;
  hostName: string;
  accessKey: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  status: 'scheduled' | 'active' | 'ended';
  maxParticipants?: number;
  currentParticipants: number;
  requiresPayment: boolean;
  price?: number;
  eventId?: string;
}

export default function ConferenceListPage() {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolledEvents, setEnrolledEvents] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (currentUser) {
      loadConferences();
      loadEnrollments();
    }
  }, [currentUser]);

  const loadConferences = async () => {
    try {
      const confsRef = collection(db, 'conferences');
      const q = query(
        confsRef,
        where('status', 'in', ['scheduled', 'active'])
      );
      const snapshot = await getDocs(q);

      const confs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Conference[];

      setConferences(confs.sort((a, b) =>
        a.startTime.toMillis() - b.startTime.toMillis()
      ));
    } catch (error) {
      console.error('Error loading conferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEnrollments = async () => {
    if (!currentUser) return;
    try {
      const enrollmentsRef = collection(db, 'eventEnrollments');
      const q = query(enrollmentsRef, where('userId', '==', currentUser.uid));
      const snapshot = await getDocs(q);

      const eventIds = new Set(snapshot.docs.map(doc => doc.data().eventId));
      setEnrolledEvents(eventIds);
    } catch (error) {
      console.error('Error loading enrollments:', error);
    }
  };

  const canAccess = (conference: Conference): boolean => {
    if (!conference.eventId) return true;
    return enrolledEvents.has(conference.eventId);
  };

  const handleJoinConference = (conference: Conference) => {
    if (!canAccess(conference)) {
      alert('You need to enroll in the event first to access this conference.');
      if (conference.eventId) {
        navigate(`/student-events`);
      }
      return;
    }
    navigate(`/conference/${conference.id}`);
  };

  const formatTime = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#D71920] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Conference Rooms
          </h1>
          <p className="text-gray-600">Join live video conferences and interactive sessions</p>
        </motion.div>

        {/* Conferences Grid */}
        {conferences.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-2xl p-12 text-center"
          >
            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Conferences Available</h3>
            <p className="text-gray-600">Check back later for upcoming conference sessions</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {conferences.map((conference, index) => (
              <motion.div
                key={conference.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card rounded-2xl p-6 hover:shadow-2xl transition-all border-2 border-transparent hover:border-[#D71920]"
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      conference.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {conference.status === 'active' ? '🔴 Live Now' : '📅 Scheduled'}
                  </span>
                  {!canAccess(conference) && (
                    <Lock className="w-4 h-4 text-gray-400" />
                  )}
                </div>

                {/* Conference Info */}
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                  {conference.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {conference.description}
                </p>

                {/* Host */}
                <div className="flex items-center gap-2 mb-3 text-sm text-gray-700">
                  <Users className="w-4 h-4" />
                  <span>Host: {conference.hostName}</span>
                </div>

                {/* Time */}
                <div className="flex items-center gap-2 mb-3 text-sm text-gray-700">
                  <Calendar className="w-4 h-4" />
                  <span>{formatTime(conference.startTime)}</span>
                </div>

                {/* Participants */}
                <div className="flex items-center gap-2 mb-4 text-sm text-gray-700">
                  <Users className="w-4 h-4" />
                  <span>
                    {conference.currentParticipants}
                    {conference.maxParticipants && ` / ${conference.maxParticipants}`} participants
                  </span>
                </div>

                {/* Access Key (only if enrolled) */}
                {canAccess(conference) && (
                  <div className="mb-4 p-3 bg-green-50 rounded-lg border-2 border-green-200">
                    <p className="text-xs text-green-700 font-semibold mb-1">Access Key:</p>
                    <p className="text-lg font-mono font-bold text-green-900 tracking-wider">
                      {conference.accessKey}
                    </p>
                  </div>
                )}

                {/* Join Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleJoinConference(conference)}
                  disabled={!canAccess(conference)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                    canAccess(conference)
                      ? 'bg-gradient-to-r from-[#D71920] to-pink-600 text-white hover:shadow-lg'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {canAccess(conference) ? (
                    <>
                      <Video className="w-5 h-5" />
                      <span>Join Conference</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      <span>Enroll in Event First</span>
                    </>
                  )}
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
