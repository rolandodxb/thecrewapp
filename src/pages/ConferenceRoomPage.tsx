import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, MessageSquare, Users, Settings, Send, Mic, MicOff, ArrowLeft, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import {
  getConference,
  joinConference,
  updateConferenceSettings,
  sendConferenceMessage,
  subscribeToConferenceMessages,
  getConferenceParticipants,
  endConference,
  Conference,
  ConferenceMessage
} from '../services/conferenceService';

export default function ConferenceRoomPage() {
  const { conferenceId } = useParams<{ conferenceId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [conference, setConference] = useState<Conference | null>(null);
  const [accessKey, setAccessKey] = useState('');
  const [hasAccess, setHasAccess] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState<ConferenceMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (conferenceId) {
      loadConference();
    }
  }, [conferenceId]);

  useEffect(() => {
    if (hasAccess && conferenceId) {
      const unsubscribe = subscribeToConferenceMessages(conferenceId, setMessages);
      loadParticipants();
      return () => unsubscribe();
    }
  }, [hasAccess, conferenceId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConference = async () => {
    if (!conferenceId) return;
    const conf = await getConference(conferenceId);
    setConference(conf);
  };

  const loadParticipants = async () => {
    if (!conferenceId) return;
    const parts = await getConferenceParticipants(conferenceId);
    setParticipants(parts);
  };

  const handleJoin = async () => {
    if (!conferenceId || !currentUser || !accessKey) return;

    try {
      const result = await joinConference(
        conferenceId,
        currentUser.uid,
        currentUser.name,
        accessKey
      );

      if (result.success && result.conference) {
        setHasAccess(true);
        setConference(result.conference);
      } else {
        alert(result.message);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to join conference');
    }
  };

  const handleSendMessage = async () => {
    if (!conferenceId || !currentUser || !newMessage.trim() || !conference) return;

    if (conference.slow_mode_enabled) {
      const now = Date.now();
      const timeSinceLastMessage = (now - lastMessageTime) / 1000;

      if (timeSinceLastMessage < conference.slow_mode_seconds) {
        alert(`Please wait ${Math.ceil(conference.slow_mode_seconds - timeSinceLastMessage)} seconds`);
        return;
      }
    }

    try {
      await sendConferenceMessage(
        conferenceId,
        currentUser.uid,
        currentUser.name,
        currentUser.photoURL,
        newMessage.trim()
      );
      setNewMessage('');
      setLastMessageTime(Date.now());
    } catch (error: any) {
      alert(error.message || 'Failed to send message');
    }
  };

  const handleToggleChat = async () => {
    if (!conferenceId || !currentUser || !conference) return;
    if (conference.host_id !== currentUser.uid) return;

    try {
      await updateConferenceSettings(conferenceId, currentUser.uid, {
        chat_enabled: !conference.chat_enabled
      });
      setConference({ ...conference, chat_enabled: !conference.chat_enabled });
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleToggleSlowMode = async () => {
    if (!conferenceId || !currentUser || !conference) return;
    if (conference.host_id !== currentUser.uid) return;

    try {
      await updateConferenceSettings(conferenceId, currentUser.uid, {
        slow_mode_enabled: !conference.slow_mode_enabled
      });
      setConference({ ...conference, slow_mode_enabled: !conference.slow_mode_enabled });
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleEndConference = async () => {
    if (!conferenceId || !currentUser || !conference) return;
    if (conference.host_id !== currentUser.uid) return;

    if (confirm('Are you sure you want to end this conference?')) {
      try {
        await endConference(conferenceId, currentUser.uid);
        navigate('/events');
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = event => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          if (currentUser && conferenceId) {
            await sendConferenceMessage(
              conferenceId,
              currentUser.uid,
              currentUser.name,
              currentUser.photoURL,
              '[Voice Note]'
            );
          }
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      alert('Unable to access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  if (!conference) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#D71920] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-3xl p-8 max-w-md w-full shadow-2xl"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-[#D71920] to-[#B91518] rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{conference.title}</h1>
            <p className="text-gray-600">{conference.description}</p>
            <p className="text-sm text-gray-500 mt-2">Hosted by {conference.host_name}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Enter Access Key
              </label>
              <input
                type="text"
                value={accessKey}
                onChange={e => setAccessKey(e.target.value)}
                placeholder="Enter conference key..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#D71920] transition"
              />
            </div>

            <button
              onClick={handleJoin}
              disabled={!accessKey}
              className="w-full px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50"
            >
              Join Conference
            </button>

            <button
              onClick={() => navigate(-1)}
              className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition"
            >
              Go Back
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const isHost = currentUser?.uid === conference.host_id;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-700 rounded-lg transition"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">{conference.title}</h1>
            <p className="text-sm text-gray-400">{participants.length} participants</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChat(!showChat)}
            className={`p-3 rounded-lg transition ${
              showChat ? 'bg-[#D71920] text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          {isHost && (
            <>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-white"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={handleEndConference}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition text-white font-semibold"
              >
                End Conference
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 bg-black flex items-center justify-center">
          <iframe
            src={conference.meet_link}
            allow="camera; microphone; fullscreen; display-capture"
            className="w-full h-full"
            title="Conference Video"
          />
        </div>

        {/* Chat Sidebar */}
        <AnimatePresence>
          {showChat && conference.chat_enabled && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 400 }}
              exit={{ width: 0 }}
              className="bg-gray-800 flex flex-col overflow-hidden"
            >
              <div className="p-4 border-b border-gray-700">
                <h2 className="text-white font-bold flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Conference Chat
                </h2>
                {conference.slow_mode_enabled && (
                  <p className="text-xs text-yellow-400 mt-1">
                    Slow mode: {conference.slow_mode_seconds}s
                  </p>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => (
                  <div key={msg.id} className="flex gap-2">
                    {msg.user_avatar ? (
                      <img
                        src={msg.user_avatar}
                        alt={msg.user_name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-bold">
                        {msg.user_name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{msg.user_name}</span>
                        <span className="text-xs text-gray-400">
                          {msg.created_at.toDate().toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">{msg.message}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-gray-700">
                <div className="flex items-center gap-2">
                  <button
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onMouseLeave={stopRecording}
                    className={`p-2 rounded-lg transition ${
                      isRecording ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D71920]"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="p-2 bg-[#D71920] text-white rounded-lg hover:bg-[#B91518] transition disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                {isRecording && (
                  <p className="text-xs text-red-400 mt-2 animate-pulse">
                    Recording... Release to send
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && isHost && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setShowSettings(false)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                onClick={e => e.stopPropagation()}
                className="bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4"
              >
                <h2 className="text-2xl font-bold text-white mb-4">Conference Settings</h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white">Enable Chat</span>
                    <button
                      onClick={handleToggleChat}
                      className={`w-12 h-6 rounded-full transition ${
                        conference.chat_enabled ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          conference.chat_enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white">Slow Mode</span>
                    <button
                      onClick={handleToggleSlowMode}
                      className={`w-12 h-6 rounded-full transition ${
                        conference.slow_mode_enabled ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          conference.slow_mode_enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {conference.slow_mode_enabled && (
                    <div>
                      <label className="text-white text-sm">Slow Mode Duration (seconds)</label>
                      <input
                        type="number"
                        value={conference.slow_mode_seconds}
                        onChange={async e => {
                          const value = parseInt(e.target.value) || 5;
                          await updateConferenceSettings(conferenceId!, currentUser!.uid, {
                            slow_mode_seconds: value
                          });
                          setConference({ ...conference, slow_mode_seconds: value });
                        }}
                        className="w-full mt-2 px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D71920]"
                        min="1"
                        max="60"
                      />
                    </div>
                  )}

                  <button
                    onClick={() => setShowSettings(false)}
                    className="w-full px-4 py-2 bg-[#D71920] text-white rounded-lg font-semibold hover:bg-[#B91518] transition"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
