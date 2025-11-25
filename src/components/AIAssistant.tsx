import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Send, Bot, X, Sparkles, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { enhancedAIService, AIMode } from '../services/enhancedAIService';
import { useApp } from '../context/AppContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  actionItems?: Array<{
    title: string;
    action: string;
    icon: string;
  }>;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AIMode;
}

export default function AIAssistant({ isOpen, onClose, initialMode = 'coach' }: AIAssistantProps) {
  const { currentUser } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<AIMode>(initialMode);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const modes: Array<{ id: AIMode; label: string }> = [
    { id: 'coach', label: 'Training Coach' },
    { id: 'cv-mentor', label: 'CV Mentor' },
    { id: 'tech-support', label: 'Tech Support' },
    { id: 'marketplace-advisor', label: 'Marketplace' },
    { id: 'content-instructor', label: 'Learning Guide' },
  ];

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const personality = enhancedAIService.getPersonality(currentMode);
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: personality.greeting,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, currentMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleModeChange = (mode: AIMode) => {
    setCurrentMode(mode);
    enhancedAIService.setMode(mode);
    const personality = enhancedAIService.getPersonality(mode);
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: personality.greeting,
        timestamp: new Date(),
      },
    ]);
    setShowModeSelector(false);
  };

  const handleSend = async () => {
    if (!input.trim() || !currentUser || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await enhancedAIService.generateAIResponse(
        currentUser.uid,
        userMessage.content,
        currentMode
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        suggestions: response.suggestions,
        actionItems: response.actionItems,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'I apologize, but I encountered an error. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleActionClick = (action: string) => {
    console.log('Action clicked:', action);
  };

  const personality = enhancedAIService.getPersonality(currentMode);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed bottom-20 right-4 md:right-6"
      style={{
        zIndex: 2147483647,
        position: 'fixed',
        pointerEvents: 'auto'
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.2 }}
        className="w-[85vw] sm:w-80 max-w-xs h-[420px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
      >
        <div className={`${personality.color} text-white p-3 rounded-t-2xl flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-lg">
              {personality.icon}
            </div>
            <div>
              <h2 className="text-base font-bold">AI Assistant</h2>
              <button
                onClick={() => setShowModeSelector(!showModeSelector)}
                className="flex items-center gap-1 text-xs text-white/90 hover:text-white transition-colors"
              >
                <span>{modes.find((m) => m.id === currentMode)?.label}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showModeSelector ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <AnimatePresence>
          {showModeSelector && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-gray-200 overflow-hidden"
            >
              <div className="p-2 grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto">
                {modes.map((mode) => {
                  const modePersonality = enhancedAIService.getPersonality(mode.id);
                  return (
                    <button
                      key={mode.id}
                      onClick={() => handleModeChange(mode.id)}
                      className={`p-2 rounded-lg text-left transition-all ${
                        currentMode === mode.id
                          ? `${modePersonality.color} text-white`
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{modePersonality.icon}</span>
                        <span className="text-xs font-medium">{mode.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gradient-to-b from-gray-50 to-white">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl p-2.5 shadow-sm ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Bot className="w-3.5 h-3.5 text-gray-600" />
                    <span className="text-[10px] font-medium text-gray-600">AI</span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>

                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <p className="text-xs text-gray-600 font-medium">Suggestions:</p>
                    {message.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="block w-full text-left text-xs bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors border border-blue-200"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                {message.actionItems && message.actionItems.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <p className="text-xs text-gray-600 font-medium">Quick Actions:</p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {message.actionItems.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleActionClick(item.action)}
                          className="flex items-center gap-2 text-xs bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors border border-blue-200"
                        >
                          <span>{item.icon}</span>
                          <span className="truncate">{item.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-xl p-2.5 shadow-sm">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-200 bg-white p-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask me anything..."
              className="flex-1 px-3 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm transition-all"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
