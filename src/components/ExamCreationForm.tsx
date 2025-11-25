import { useState } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { createExam, ExamQuestion } from '../services/examService';
import { motion, AnimatePresence } from 'framer-motion';

interface ExamCreationFormProps {
  moduleId: string;
  lessonId: string;
  courseId: string;
  createdBy: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ExamCreationForm({
  moduleId,
  lessonId,
  courseId,
  createdBy,
  onClose,
  onSuccess
}: ExamCreationFormProps) {
  const [examTitle, setExamTitle] = useState('');
  const [passingScore, setPassingScore] = useState(80);
  const [cooldownMinutes, setCooldownMinutes] = useState(5);
  const [questions, setQuestions] = useState<Omit<ExamQuestion, 'id'>[]>([
    {
      questionText: '',
      options: ['', '', '', ''],
      correctIndex: 0,
      explanation: '',
      order: 0
    }
  ]);
  const [saving, setSaving] = useState(false);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: '',
        options: ['', '', '', ''],
        correctIndex: 0,
        explanation: '',
        order: questions.length
      }
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const addOption = (qIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options.push('');
    setQuestions(updated);
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options = updated[qIndex].options.filter((_, i) => i !== oIndex);
    if (updated[qIndex].correctIndex >= updated[qIndex].options.length) {
      updated[qIndex].correctIndex = updated[qIndex].options.length - 1;
    }
    setQuestions(updated);
  };

  const handleSubmit = async () => {
    if (!examTitle.trim()) {
      alert('Please enter an exam title');
      return;
    }

    const invalidQuestions = questions.filter(
      q => !q.questionText.trim() || q.options.filter(o => o.trim()).length < 2
    );

    if (invalidQuestions.length > 0) {
      alert('Please fill in all questions and provide at least 2 options for each');
      return;
    }

    try {
      setSaving(true);
      await createExam({
        moduleId,
        lessonId,
        courseId,
        examTitle,
        questions,
        passingScore,
        cooldownMinutes,
        createdBy
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating exam:', error);
      alert('Failed to create exam. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="bg-gradient-to-r from-[#D71920] to-[#B91518] p-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Create Exam</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Exam Title
            </label>
            <input
              type="text"
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#D71920] focus:outline-none"
              placeholder="e.g., Introduction to Emirates Quiz"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Passing Score (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#D71920] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Retry Cooldown (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={cooldownMinutes}
                onChange={(e) => setCooldownMinutes(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#D71920] focus:outline-none"
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Questions</h3>
              <button
                onClick={addQuestion}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
              >
                <Plus className="w-4 h-4" />
                Add Question
              </button>
            </div>

            <div className="space-y-6">
              {questions.map((question, qIndex) => (
                <div key={qIndex} className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-gray-700">
                      Question {qIndex + 1}
                    </span>
                    {questions.length > 1 && (
                      <button
                        onClick={() => removeQuestion(qIndex)}
                        className="p-1 hover:bg-red-100 rounded-lg transition text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    value={question.questionText}
                    onChange={(e) =>
                      updateQuestion(qIndex, 'questionText', e.target.value)
                    }
                    className="w-full px-4 py-2 mb-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="Enter question text"
                  />

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-gray-700">Options</label>
                      <button
                        onClick={() => addOption(qIndex)}
                        className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-semibold transition"
                      >
                        + Add Option
                      </button>
                    </div>
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={question.correctIndex === oIndex}
                          onChange={() => updateQuestion(qIndex, 'correctIndex', oIndex)}
                          className="w-4 h-4 text-green-600"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) =>
                            updateOption(qIndex, oIndex, e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          placeholder={`Option ${oIndex + 1}`}
                        />
                        {question.options.length > 2 && (
                          <button
                            onClick={() => removeOption(qIndex, oIndex)}
                            className="p-2 hover:bg-red-100 rounded-lg transition text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={question.explanation || ''}
                    onChange={(e) =>
                      updateQuestion(qIndex, 'explanation', e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                    placeholder="Explanation (optional)"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gray-100 p-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Creating...' : 'Create Exam'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
