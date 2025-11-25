import { Brain, Upload, FileText, Sparkles, Send, Loader2, Wand2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useState, useRef, useEffect } from 'react';
import { analyzeCVForEmirates, getCabinCrewGuidance, optimizeCVForATS } from '../utils/aiService';
import CVAnalyzer from '../components/CVAnalyzer';
import { parseDocument } from '../utils/documentParser';
import { checkFeatureAccess } from '../utils/featureAccess';
import FeatureLock from '../components/FeatureLock';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AITrainerPage() {
  const { currentUser } = useApp();

  // Check feature access
  if (!currentUser) return null;

  const aiTrainerAccess = checkFeatureAccess(currentUser, 'ai-trainer');
  if (!aiTrainerAccess.allowed) {
    return (
      <FeatureLock
        requiredPlan={aiTrainerAccess.requiresPlan || 'vip'}
        featureName="AI Trainer"
        description={aiTrainerAccess.message}
      />
    );
  }

  const [activeTab, setActiveTab] = useState<'cv' | 'chat'>('cv');

  const [cvText, setCvText] = useState('');
  const [cvFeedback, setCvFeedback] = useState('');
  const [cvLoading, setCvLoading] = useState(false);
  const [cvError, setCvError] = useState('');
  const [optimizedCV, setOptimizedCV] = useState('');
  const [optimizing, setOptimizing] = useState(false);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.name.split('.').pop()?.toLowerCase();
    if (!['txt', 'pdf', 'doc', 'docx'].includes(fileType || '')) {
      setCvError('Please upload a .txt, .pdf, .doc, or .docx file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setCvError('File size must be less than 5MB');
      return;
    }

    setCvLoading(true);
    setCvError('');

    try {
      if (fileType === 'txt') {
        const text = await file.text();
        setCvText(text);
      } else {
        const parsed = await parseDocument(file);
        setCvText(parsed.text);
      }
      setCvError('');
    } catch (error: any) {
      setCvError(error.message || 'Failed to parse document. Please try again.');
      setCvText('');
    } finally {
      setCvLoading(false);
    }
  };

  const handleAnalyzeCV = async () => {
    if (!cvText.trim()) {
      setCvError('Please enter or upload your CV content first');
      return;
    }

    if (!currentUser) {
      setCvError('You must be logged in to use this feature');
      return;
    }

    setCvLoading(true);
    setCvError('');
    setCvFeedback('');
    setOptimizedCV('');

    try {
      const feedback = await analyzeCVForEmirates(cvText, currentUser.uid);
      setCvFeedback(feedback);
    } catch (error: any) {
      setCvError(error.message || 'Failed to analyze CV. Please try again.');
    } finally {
      setCvLoading(false);
    }
  };

  const handleOptimizeCV = async () => {
    if (!cvText.trim()) {
      setCvError('Please enter or upload your CV content first');
      return;
    }

    if (!currentUser) {
      setCvError('You must be logged in to use this feature');
      return;
    }

    setOptimizing(true);
    setCvError('');

    try {
      const optimized = await optimizeCVForATS(cvText, currentUser.uid);
      setOptimizedCV(optimized);
    } catch (error: any) {
      setCvError(error.message || 'Failed to optimize CV. Please try again.');
    } finally {
      setOptimizing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;

    if (!currentUser) {
      setChatError('You must be logged in to use this feature');
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);
    setChatError('');

    try {
      const response = await getCabinCrewGuidance(chatInput, currentUser.uid);
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      setChatError(error.message || 'Failed to get response. Please try again.');
    } finally {
      setChatLoading(false);
    }
  };

  const suggestedQuestions = [
    "How should I answer 'Tell me about yourself'?",
    "What should I wear for Emirates assessment?",
    "How do I show confidence in group activities?",
    "What are the most important grooming standards?",
    "How can I improve my English for the interview?",
  ];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-[#D71921] to-[#B91518] rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#000000]">Your AI Cabin Crew Trainer</h1>
            <p className="text-gray-600">Get personalized help to craft the perfect airline-ready CV and receive recruiter-style feedback.</p>
          </div>
        </div>
      </motion.div>

      <div className="mb-6 flex gap-2 border-b-2 border-gray-200">
        <button
          onClick={() => setActiveTab('cv')}
          className={`px-6 py-3 font-bold transition ${
            activeTab === 'cv'
              ? 'text-[#D71921] border-b-4 border-[#D71921] -mb-0.5'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <span>CV Optimization</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-6 py-3 font-bold transition ${
            activeTab === 'chat'
              ? 'text-[#D71921] border-b-4 border-[#D71921] -mb-0.5'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <span>Interactive Guidance</span>
          </div>
        </button>
      </div>

      {activeTab === 'cv' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="glass-card rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-[#000000] mb-4">Upload or Paste Your CV</h2>
            <p className="text-sm text-gray-600 mb-4">
              Paste your CV content or upload a file to get detailed improvement feedback from our AI recruiter.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="mb-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#D71921] transition cursor-pointer glass-light hover:glass-bubble"
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 font-semibold">Click to upload your CV</p>
                <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, or TXT (Max 5MB)</p>
              </button>
            </div>

            <div className="text-center text-gray-500 text-sm mb-4">or</div>

            <textarea
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              placeholder="Paste your CV content here...

Example:
John Doe
Email: john@example.com
Phone: +971 50 123 4567

PROFESSIONAL SUMMARY
Customer service professional with 3 years of experience in hospitality..."
              className="w-full h-64 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71921] focus:ring-2 focus:ring-[#D71921]/20 transition resize-none"
            />

            {cvError && (
              <div className="mt-4 p-3 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm">
                {cvError}
              </div>
            )}

            <button
              onClick={handleAnalyzeCV}
              disabled={cvLoading || !cvText.trim()}
              className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-[#D71921] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {cvLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  Analyze & Improve
                </>
              )}
            </button>
          </div>

          {cvFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-[#EADBC8] to-[#F5E6D3] rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-xl font-bold text-[#000000] mb-4 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-[#D71921]" />
                AI Feedback
              </h3>
              <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap">
                {cvFeedback}
              </div>

              <button
                onClick={handleOptimizeCV}
                disabled={optimizing || !cvText.trim()}
                className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-[#CBA135] to-[#B8941F] text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {optimizing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Optimized CV...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Generate ATS-Optimized CV
                  </>
                )}
              </button>
            </motion.div>
          )}

          {optimizedCV && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-xl font-bold text-[#000000] mb-4 flex items-center gap-2">
                <Wand2 className="w-6 h-6 text-[#CBA135]" />
                Your ATS-Optimized Aviation CV
              </h3>
              <div className="glass-light rounded-xl p-6 mb-4 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                  {optimizedCV}
                </pre>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(optimizedCV);
                  alert('CV copied to clipboard! You can now paste it into your document editor.');
                }}
                className="w-full px-6 py-3 bg-[#D71920] text-white rounded-xl font-bold hover:bg-[#B91518] transition"
              >
                Copy to Clipboard
              </button>
            </motion.div>
          )}
        </motion.div>
      )}

      {activeTab === 'chat' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-2xl shadow-lg overflow-hidden flex flex-col"
          style={{ height: 'calc(100vh - 300px)', minHeight: '500px' }}
        >
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {chatMessages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-[#D71921] to-[#B91518] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#000000] mb-2">Your AI Trainer is Ready!</h3>
                <p className="text-gray-600 mb-6">Ask your first question or try one of these:</p>
                <div className="max-w-2xl mx-auto space-y-2">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => setChatInput(q)}
                      className="w-full px-4 py-3 glass-light hover:bg-[#EADBC8] border-2 border-gray-200 hover:border-[#D71921] rounded-xl text-left text-sm text-gray-700 transition"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-[#D71921] to-[#B91518] text-white'
                          : 'bg-gradient-to-br from-[#EADBC8] to-[#F5E6D3] text-gray-800'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gradient-to-br from-[#EADBC8] to-[#F5E6D3] px-4 py-3 rounded-2xl">
                      <Loader2 className="w-5 h-5 animate-spin text-[#D71921]" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </>
            )}
          </div>

          {chatError && (
            <div className="px-6 py-3 bg-red-50 border-t-2 border-red-200 text-red-700 text-sm">
              {chatError}
            </div>
          )}

          <div className="border-t-2 border-gray-200 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything about cabin crew..."
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71921] focus:ring-2 focus:ring-[#D71921]/20 transition"
                disabled={chatLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={chatLoading || !chatInput.trim()}
                className="px-6 py-3 bg-gradient-to-r from-[#D71921] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
