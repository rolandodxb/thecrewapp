import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Send, AlertCircle, Loader2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../lib/firebase';
import { openaiClient } from '../../../utils/openaiClient';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tokensUsed?: number;
}

export default function AIAssistantPanel() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    const checkAIStatus = async () => {
      try {
        const statusDoc = await getDoc(doc(db, 'systemControl', 'ai'));
        if (statusDoc.exists()) {
          const data = statusDoc.data();
          setAiEnabled(data.enabled !== false);
        }
      } catch (error) {
        console.error('Error checking AI status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkAIStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !aiEnabled || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setPrompt('');
    setLoading(true);

    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const chatMessages = [
        {
          role: 'system' as const,
          content: 'You are an AI assistant for The Crew Academy Governor Control Nexus. Provide helpful, concise responses about system operations, analytics, and management tasks.',
        },
        ...messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        {
          role: 'user' as const,
          content: userMessage.content,
        },
      ];

      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      let streamedContent = '';

      await openaiClient.streamChat(chatMessages, {
        userId,
        onChunk: (content) => {
          streamedContent += content;
          setMessages((prev) => {
            const updated = [...prev];
            const lastMessage = updated[updated.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              lastMessage.content = streamedContent;
            }
            return updated;
          });
        },
        onComplete: (totalTokens) => {
          setMessages((prev) => {
            const updated = [...prev];
            const lastMessage = updated[updated.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              lastMessage.tokensUsed = totalTokens;
            }
            return updated;
          });
        },
        onError: (error) => {
          console.error('AI Assistant Error:', error);
          setMessages((prev) => {
            const updated = [...prev];
            const lastMessage = updated[updated.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              lastMessage.content = error.message?.includes('disabled')
                ? 'AI features are currently disabled. Enable them in the AI Control Panel below.'
                : `Failed to get AI response: ${error.message}`;
            }
            return updated;
          });
        },
      });
    } catch (error: any) {
      console.error('AI Assistant Error:', error);
      setMessages((prev) => {
        const updated = [...prev];
        const lastMessage = updated[updated.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          lastMessage.content = 'Failed to get AI response. Please check your Cloudflare Worker configuration.';
        }
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-light rounded-xl shadow-lg border-2 border-gray-200 p-6"
      >
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Checking AI status...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-light rounded-xl shadow-lg border-2 border-transparent hover:border-gray-200 overflow-hidden transition"
    >
      <div className="bg-gradient-to-r from-[#5A6B75] to-[#3D4A52] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 glass-light/10 rounded-xl flex items-center justify-center border border-white/20">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI Assistant</h2>
              <p className="text-xs text-white/80">Powered by OpenAI GPT-4</p>
            </div>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
            aiEnabled
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-red-100 text-red-700 border border-red-300'
          }`}>
            {aiEnabled ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {!aiEnabled && (
        <div className="mx-6 mt-4 p-3 bg-[#D71920]/10 border border-red-300 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-red-700 font-semibold">AI Assistant Disabled</p>
            <p className="text-xs text-red-600 mt-1">
              Enable AI in the AI Control Panel below to use this feature.
            </p>
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 glass-light rounded-xl border-2 border-gray-200">
              <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-700 font-semibold">AI Assistant Ready</p>
              <p className="text-xs text-gray-500 mt-1">Ask me anything about system operations</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-50 border border-blue-300 ml-8'
                    : 'bg-gray-50 border border-gray-200 mr-8'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-semibold text-gray-600">
                    {message.role === 'user' ? 'You' : 'AI Assistant'}
                  </span>
                  {message.tokensUsed && (
                    <span className="text-xs text-[#5A6B75]">{message.tokensUsed} tokens</span>
                  )}
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </motion.div>
            ))
          )}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-sm text-gray-600 glass-light rounded-lg p-3 border border-gray-200"
            >
              <Loader2 className="w-4 h-4 animate-spin text-[#5A6B75]" />
              AI is thinking...
            </motion.div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex gap-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={aiEnabled ? "Ask the AI assistant..." : "AI disabled"}
              disabled={!aiEnabled || loading}
              rows={2}
              className="flex-1 px-4 py-3 glass-light border-2 border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D71920] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={!aiEnabled || loading || !prompt.trim()}
              className="px-6 py-3 bg-gradient-to-r from-[#5A6B75] to-[#3D4A52] hover:from-[#3D4A52] hover:to-[#2A3439] text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2 self-end shadow-md"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </form>
      </div>
    </motion.div>
  );
}
