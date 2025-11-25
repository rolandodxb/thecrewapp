import { useState } from 'react';
import { FileText, Sparkles, Download, MessageSquare, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { parseDocument } from '../utils/documentParser';
import { openaiClient } from '../utils/openaiClient';

interface CVAnalyzerProps {
  cvUrl: string;
  userId: string;
}

interface AnalysisResult {
  score: number;
  strengths: string[];
  improvements: string[];
  missingElements: string[];
  aviationFit: 'excellent' | 'good' | 'needs-improvement';
  suggestions: string[];
}

interface ConversationMessage {
  role: 'assistant' | 'user';
  content: string;
}

export default function CVAnalyzer({ cvUrl, userId }: CVAnalyzerProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [converting, setConverting] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [cvText, setCvText] = useState('');
  const [showBuilder, setShowBuilder] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [chatting, setChatting] = useState(false);

  const analyzeCV = async () => {
    setAnalyzing(true);
    try {
      const response = await fetch(cvUrl);
      const blob = await response.blob();
      const file = new File([blob], 'cv.pdf', { type: blob.type });

      const parsedDoc = await parseDocument(file);
      setCvText(parsedDoc.text);

      const prompt = `You are an aviation industry CV expert. Analyze the following CV and provide:
1. An overall score (0-100)
2. Key strengths (list 3-5 points)
3. Areas for improvement (list 3-5 points)
4. Missing elements for aviation roles (list any missing)
5. Aviation industry fit rating (excellent/good/needs-improvement)
6. Specific suggestions for aviation roles

CV Content:
${parsedDoc.text}

Respond in JSON format with this structure:
{
  "score": number,
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "missingElements": ["element1", "element2"],
  "aviationFit": "excellent|good|needs-improvement",
  "suggestions": ["suggestion1", "suggestion2"]
}`;

      const result = await openaiClient.sendMessage(
        [
          { role: 'system', content: 'You are an expert aviation industry CV analyst.' },
          { role: 'user', content: prompt },
        ],
        userId
      );

      const parsedAnalysis = JSON.parse(result.reply);
      setAnalysis(parsedAnalysis);
    } catch (error) {
      console.error('Error analyzing CV:', error);
      alert('Failed to analyze CV. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const convertToATS = async () => {
    if (!cvText) {
      alert('Please analyze the CV first');
      return;
    }

    setConverting(true);
    try {
      const prompt = `Convert the following CV to an ATS-friendly format optimized for aviation roles.

Requirements:
- Use clear section headers (Summary, Experience, Education, Skills, Certifications)
- Use standard fonts and formatting
- Include aviation-specific keywords
- Format dates consistently (MM/YYYY)
- Use bullet points for achievements
- Quantify achievements where possible
- Highlight relevant certifications and licenses

Original CV:
${cvText}

Provide the converted CV in plain text format with clear formatting.`;

      const result = await openaiClient.sendMessage(
        [
          { role: 'system', content: 'You are an expert at creating ATS-friendly CVs for aviation professionals.' },
          { role: 'user', content: prompt },
        ],
        userId
      );

      const atsCV = result.reply;

      const blob = new Blob([atsCV], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ATS_Aviation_CV.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      alert('ATS-formatted CV downloaded successfully!');
    } catch (error) {
      console.error('Error converting to ATS:', error);
      alert('Failed to convert CV. Please try again.');
    } finally {
      setConverting(false);
    }
  };

  const startInteractiveBuilder = () => {
    setShowBuilder(true);
    setConversation([
      {
        role: 'assistant',
        content: "Hello! I'm your aviation CV assistant. I'll help you create a perfect CV for aviation roles. Let's start by understanding your background. What position are you targeting in the aviation industry?",
      },
    ]);
  };

  const sendMessage = async () => {
    if (!userInput.trim() || chatting) return;

    const newMessage: ConversationMessage = {
      role: 'user',
      content: userInput,
    };

    setConversation((prev) => [...prev, newMessage]);
    setUserInput('');
    setChatting(true);

    try {
      const conversationHistory = [...conversation, newMessage].map((msg) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      }));

      const systemPrompt = `You are an expert aviation career counselor helping create ATS-optimized CVs.

Current CV content (if available):
${cvText || 'No CV uploaded yet'}

Your role:
- Ask targeted questions about education, certifications, flight hours, aircraft types, experience
- Provide specific aviation industry advice
- Suggest ATS keywords and phrases
- Recommend structure improvements
- Identify missing critical information for aviation roles
- Be encouraging and professional

Keep responses concise and actionable.`;

      const result = await openaiClient.sendMessage(
        [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
        ],
        userId
      );

      setConversation((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: result.reply,
        },
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setChatting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={analyzeCV}
          disabled={analyzing}
          className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-5 h-5" />
          {analyzing ? 'Analyzing...' : 'Analyze CV'}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={convertToATS}
          disabled={converting || !cvText}
          className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-[#CBA135] to-[#B8941E] text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-5 h-5" />
          {converting ? 'Converting...' : 'Convert to ATS'}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={startInteractiveBuilder}
          className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold hover:shadow-lg transition"
        >
          <MessageSquare className="w-5 h-5" />
          Interactive Builder
        </motion.button>
      </div>

      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">CV Analysis</h3>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-[#D71920]">{analysis.score}%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div
                className={`p-4 rounded-xl ${
                  analysis.aviationFit === 'excellent'
                    ? 'bg-green-50 border-2 border-green-300'
                    : analysis.aviationFit === 'good'
                    ? 'bg-yellow-50 border-2 border-yellow-300'
                    : 'bg-red-50 border-2 border-red-300'
                }`}
              >
                <p className="text-sm font-bold text-gray-700 mb-1">Aviation Fit</p>
                <p className="text-lg font-bold capitalize">{analysis.aviationFit}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h4 className="font-bold text-gray-900">Strengths</h4>
                </div>
                <ul className="space-y-2">
                  {analysis.strengths.map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                      <span className="text-green-600 mt-1">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <h4 className="font-bold text-gray-900">Areas for Improvement</h4>
                </div>
                <ul className="space-y-2">
                  {analysis.improvements.map((improvement, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                      <span className="text-orange-600 mt-1">•</span>
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {analysis.missingElements.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-red-600" />
                    <h4 className="font-bold text-gray-900">Missing Elements</h4>
                  </div>
                  <ul className="space-y-2">
                    {analysis.missingElements.map((element, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700">
                        <span className="text-red-600 mt-1">•</span>
                        <span>{element}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                <h4 className="font-bold text-gray-900 mb-2">Suggestions for Aviation Roles</h4>
                <ul className="space-y-2">
                  {analysis.suggestions.map((suggestion, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700 text-sm">
                      <span className="text-blue-600 mt-1">→</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {showBuilder && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Interactive CV Builder</h3>

            <div className="h-96 overflow-y-auto mb-4 space-y-4 p-4 bg-gray-50 rounded-xl">
              {conversation.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-xl ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-[#D71920] to-[#B91518] text-white'
                        : 'bg-white border-2 border-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your response..."
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 transition"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={sendMessage}
                disabled={chatting || !userInput.trim()}
                className="px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {chatting ? 'Sending...' : 'Send'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
