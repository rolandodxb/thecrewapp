import { useState, useEffect, useRef } from 'react';
import { X, Minimize2, Maximize2, Send, Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { sendPrivateMessage, getPrivateMessages } from '../services/chatService';
import { onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: any;
  voiceNote?: string;
}

interface FloatingMessengerProps {
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  onClose: () => void;
}

export default function FloatingMessenger({
  recipientId,
  recipientName,
  recipientAvatar,
  onClose
}: FloatingMessengerProps) {
  const { currentUser } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 380, y: window.innerHeight - 500 });
  const [isDragging, setIsDragging] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const conversationId = [currentUser?.uid, recipientId].sort().join('_');

  useEffect(() => {
    if (!currentUser) return;

    const messagesQuery = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, snapshot => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [currentUser, conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!currentUser || !newMessage.trim()) return;

    try {
      await sendPrivateMessage(
        currentUser.uid,
        currentUser.name,
        recipientId,
        recipientName,
        newMessage.trim()
      );
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          if (currentUser) {
            await sendPrivateMessage(
              currentUser.uid,
              currentUser.name,
              recipientId,
              recipientName,
              '[Voice Note]',
              base64Audio
            );
          }
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Unable to access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = Math.max(0, Math.min(window.innerWidth - 350, e.clientX - startX));
      const newY = Math.max(0, Math.min(window.innerHeight - 100, e.clientY - startY));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 9999,
        width: '350px'
      }}
      className="glass-card rounded-2xl shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div
        onMouseDown={handleDragStart}
        className="bg-gradient-to-r from-[#D71920] to-[#B91518] text-white p-4 cursor-move flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          {recipientAvatar ? (
            <img src={recipientAvatar} alt={recipientName} className="w-10 h-10 rounded-full" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
              {recipientName.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="font-bold">{recipientName}</h3>
            <p className="text-xs opacity-75">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="hover:bg-white/20 p-2 rounded-lg transition"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: '400px' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        message.senderId === currentUser?.uid
                          ? 'bg-gradient-to-r from-[#D71920] to-[#B91518] text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {message.voiceNote ? (
                        <audio controls className="max-w-full">
                          <source src={message.voiceNote} type="audio/webm" />
                        </audio>
                      ) : (
                        <p className="text-sm">{message.text}</p>
                      )}
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp?.toDate?.()?.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <button
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onMouseLeave={stopRecording}
                    className={`p-2 rounded-lg transition ${
                      isRecording ? 'bg-red-500 text-white' : 'hover:bg-gray-100'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#D71920]"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!newMessage.trim()}
                    className="p-2 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                {isRecording && (
                  <p className="text-xs text-red-500 mt-2 animate-pulse">Recording... Release to send</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
