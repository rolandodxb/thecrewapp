import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { supabaseChatService, SupabaseChatMessage, Conversation } from '../services/supabaseChatService';
import { auth } from '../lib/firebase';
import { Search, Mic, Send, MessageCircle, Square, Smile, Paperclip, X, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';

// Voice Message Player Component
function VoiceMessagePlayer({ audioUrl, isOwn }: { audioUrl: string; isOwn: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Validate URL before rendering
  if (!audioUrl || audioUrl.length < 100 || !audioUrl.includes('.webm')) {
    console.warn('⚠️ Invalid audio URL, skipping player:', audioUrl);
    return <p className="text-xs italic opacity-70">Voice message (unavailable)</p>;
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      console.log('✅ Audio duration loaded:', audio.duration);
      setDuration(audio.duration);
    };
    const handleEnded = () => setIsPlaying(false);
    const handleError = (e: Event) => {
      console.error('❌ Audio playback error:', e);
      const audioElement = e.target as HTMLAudioElement;
      console.error('Audio error details:', {
        error: audioElement.error,
        code: audioElement.error?.code,
        message: audioElement.error?.message,
        src: audioElement.src?.substring(0, 100)
      });
      setError(true);
    };
    const handleCanPlay = () => {
      console.log('✅ Audio can play');
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  useEffect(() => {
    console.log('🎵 VoiceMessagePlayer mounted:', {
      urlLength: audioUrl?.length,
      urlStart: audioUrl?.substring(0, 50),
      isDataUrl: audioUrl?.startsWith('data:'),
      audioType: audioUrl?.match(/data:([^;]+)/)?.[1]
    });
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (error) {
    return (
      <div className="text-xs text-red-500">
        ⚠️ Unable to play audio
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 min-w-[200px]">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <button
        onClick={togglePlay}
        className={`p-2 rounded-full transition ${
          isOwn ? 'bg-white/20 hover:bg-white/30' : 'bg-blue-100 hover:bg-blue-200'
        }`}
      >
        {isPlaying ? (
          <Pause className={`w-4 h-4 ${isOwn ? 'text-white' : 'text-blue-600'}`} />
        ) : (
          <Play className={`w-4 h-4 ${isOwn ? 'text-white' : 'text-blue-600'}`} />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className={`h-1 rounded-full ${isOwn ? 'bg-white/20' : 'bg-gray-200'} overflow-hidden`}>
          <div
            className={`h-full ${isOwn ? 'bg-white' : 'bg-blue-500'} transition-all`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </p>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<SupabaseChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [showMobileMessages, setShowMobileMessages] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const conversationId = supabaseChatService.getPublicRoomId();

  useEffect(() => {
    const initializePublicRoom = async () => {
      await supabaseChatService.ensurePublicRoom();
      const convs = await supabaseChatService.getConversations();
      setConversations(convs);
      const publicRoom = convs.find(c => c.id === conversationId);
      if (publicRoom) {
        setSelectedConversation(publicRoom);
      }
    };
    initializePublicRoom();
  }, [conversationId]);

  useEffect(() => {
    if (!selectedConversation) return;

    setLoading(true);
    const unsubscribe = supabaseChatService.subscribeToMessages(
      selectedConversation.id,
      (msgs) => {
        setMessages(msgs);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading messages:', error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!currentUser || (!messageText.trim() && !selectedFile) || !selectedConversation) return;

    setSending(true);
    try {
      let messageType: 'text' | 'image' | 'audio' | 'file' = 'text';
      let messageContent = messageText.trim();

      if (selectedFile) {
        if (selectedFile.name.startsWith('voice-') && selectedFile.type.startsWith('audio/')) {
          messageType = 'audio';
          messageContent = '🎤 Voice message';
        } else if (selectedFile.type.startsWith('image/')) {
          messageType = 'image';
          messageContent = messageContent || '📷 Image';
        } else {
          messageType = 'file';
          messageContent = messageContent || '📎 File';
        }
      }

      await supabaseChatService.sendMessage(
        selectedConversation.id,
        messageContent,
        messageType,
        selectedFile || undefined
      );
      setMessageText('');
      setSelectedFile(null);
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message: ' + (error as Error).message);
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleEmojiClick = (emojiData: any) => {
    setMessageText(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        setSelectedFile(audioFile);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  const filteredConversations = conversations.filter(conv =>
    conv?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!currentUser) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-gray-600">Please log in to access community chat.</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 p-4 gap-4 overflow-hidden">
      {/* Left Sidebar - Full screen on mobile when no conversation selected */}
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className={`${showMobileMessages ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col gap-3`}
      >
        {/* Top Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2 bg-white rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm"
          >
            home
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2 bg-white rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm"
          >
            back
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search"
            className="w-full pl-11 pr-11 py-2.5 bg-white rounded-full text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition shadow-sm"
          />
          <Mic className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>

        {/* Conversation List Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex-1 bg-white rounded-3xl shadow-lg overflow-hidden flex flex-col"
        >
          <div className="p-4">
            <p className="text-sm text-gray-500 font-medium">conversation list</p>
          </div>

          <div className="flex-1 overflow-y-auto px-2">
            <AnimatePresence mode="popLayout">
              {filteredConversations.map((conv, index) => (
                <motion.button
                  key={conv.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    setSelectedConversation(conv);
                    setShowMobileMessages(true);
                  }}
                  className={`w-full px-3 py-3 text-left rounded-2xl hover:bg-gray-50 transition mb-2 ${
                    selectedConversation?.id === conv.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {conv.name?.charAt(0) || 'C'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{conv.name}</h3>
                      <p className="text-xs text-gray-500 truncate">Community Room</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>

      {/* Main Chat Area */}
      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 0.1 }}
        className={`${!showMobileMessages ? 'hidden md:flex' : 'flex'} flex-1 bg-white rounded-3xl shadow-lg overflow-hidden flex-col w-full`}
      >
        {selectedConversation ? (
          <>
            {/* Top Bar with Back Button */}
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <button
                onClick={() => setShowMobileMessages(false)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-full transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full pl-11 pr-11 py-2.5 bg-gray-50 rounded-full text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                />
                <Mic className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {!loading && messages.length === 0 ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center"
                >
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Message</h3>
                    <p className="text-sm text-gray-500">Description</p>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {messages.map((message, index) => {
                      const isOwn = message.sender_id === currentUser?.uid;
                      const isVoiceMessage = message.content === '🎤 Voice message' && message.attachment_url;

                      // Debug all messages with attachments
                      if (message.attachment_url) {
                        console.log('📎 Message with attachment:', {
                          messageId: message.id,
                          content: message.content,
                          contentType: message.content_type,
                          hasAttachmentUrl: !!message.attachment_url,
                          attachmentUrlLength: message.attachment_url?.length,
                          attachmentUrlStart: message.attachment_url?.substring(0, 30),
                          attachmentMetadata: message.attachment_metadata
                        });
                      }

                      return (
                        <motion.div
                          key={message.id || `msg-${index}`}
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{
                            type: 'spring',
                            damping: 25,
                            stiffness: 300,
                            delay: index * 0.02
                          }}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex items-end gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                            {!isOwn && (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {message.sender_name?.charAt(0) || 'U'}
                              </div>
                            )}
                            <div
                              className={`px-4 py-3 rounded-2xl ${
                                isOwn
                                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md'
                                  : 'bg-gray-100 text-gray-900 rounded-bl-md'
                              }`}
                            >
                              {!isOwn && (
                                <p className="text-xs font-semibold mb-1 opacity-70">
                                  {message.sender_name}
                                </p>
                              )}

                              {/* Voice Message */}
                              {(message.content === '🎤 Voice message' ||
                                (message.attachment_metadata?.name?.startsWith('voice-') && message.attachment_url)) &&
                                message.attachment_url &&
                                message.attachment_url.includes('.webm') &&
                                message.attachment_url.length > 100 ? (
                                <div>
                                  <VoiceMessagePlayer audioUrl={message.attachment_url} isOwn={isOwn} />
                                </div>
                              ) : (message.content === '🎤 Voice message') ? (
                                /* Broken voice message from old data - skip rendering audio player */
                                <p className="text-xs italic opacity-70">Voice message (unavailable)</p>
                              ) : message.content_type === 'image' && message.attachment_url ? (
                                /* Image Message */
                                <div>
                                  <img
                                    src={message.attachment_url}
                                    alt="Shared image"
                                    className="rounded-lg max-w-xs mb-2"
                                  />
                                  {message.content !== '📷 Image' && (
                                    <p className="text-sm leading-relaxed">{message.content}</p>
                                  )}
                                </div>
                              ) : (
                                /* Text/Regular Message */
                                <p className="text-sm leading-relaxed">{message.content}</p>
                              )}

                              <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
                                {new Date(message.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-100">
              {isRecording && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-3 px-4 py-2 bg-red-50 rounded-2xl flex items-center gap-2 text-sm animate-pulse max-w-4xl mx-auto"
                >
                  <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                  <span className="text-red-900 font-medium">Recording: {formatTime(recordingTime)}</span>
                </motion.div>
              )}

              {selectedFile && !isRecording && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-3 px-4 py-2 bg-blue-50 rounded-2xl flex items-center justify-between text-xs max-w-4xl mx-auto"
                >
                  <span className="text-blue-900 truncate">{selectedFile.name}</span>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-red-600 hover:text-red-700 font-medium ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

              <div className="flex items-center gap-3 max-w-4xl mx-auto relative">
                {showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute bottom-full right-0 mb-2 z-50"
                  >
                    <EmojiPicker onEmojiClick={handleEmojiClick} />
                  </motion.div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,audio/*,video/*,.pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending || isRecording}
                  className="p-2.5 bg-white hover:bg-gray-50 rounded-full transition disabled:opacity-50 shadow-sm"
                  title="Attach file"
                >
                  <Paperclip className="w-5 h-5 text-gray-600" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  disabled={sending || isRecording}
                  className="p-2.5 bg-white hover:bg-gray-50 rounded-full transition disabled:opacity-50 shadow-sm"
                  title="Add emoji"
                >
                  <Smile className="w-5 h-5 text-gray-600" />
                </motion.button>

                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type Message"
                    disabled={isRecording}
                    className="w-full pl-4 pr-11 py-3 bg-gray-100 rounded-full text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition disabled:opacity-50"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={sending}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition ${
                      isRecording
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                        : 'hover:bg-gray-200'
                    }`}
                    title={isRecording ? "Stop recording" : "Record voice"}
                  >
                    {isRecording ? (
                      <Square className="w-5 h-5 text-white" />
                    ) : (
                      <Mic className="w-5 h-5 text-gray-400" />
                    )}
                  </motion.button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSendMessage}
                  disabled={(!messageText.trim() && !selectedFile) || sending || isRecording}
                  className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full hover:shadow-lg transition disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </>
        ) : (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex-1 flex items-center justify-center"
          >
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-1">Message</h3>
              <p className="text-sm text-gray-500">Description</p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
