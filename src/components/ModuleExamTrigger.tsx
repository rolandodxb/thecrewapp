import { useState, useEffect } from 'react';
import { CheckCircle, Trophy } from 'lucide-react';
import { getCourseProgress } from '../services/enrollmentService';
import { courseExams } from '../data/examData';
import ExamInterface from './ExamInterface';
import ExamResultModal from './ExamResultModal';
import { ExamResult } from '../services/examService';
import { supabase } from '../lib/auth';
interface ModuleExamTriggerProps {
  userId: string;
  courseIds: string[];
  moduleId: string;
  moduleName: string;
}
export default function ModuleExamTrigger({ userId, courseIds, moduleId, moduleName }: ModuleExamTriggerProps) {
  const [allCoursesComplete, setAllCoursesComplete] = useState(false);
  const [showExam, setShowExam] = useState(false);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [combinedQuestions, setCombinedQuestions] = useState<any[]>([]);
  useEffect(() => {
    checkAllCoursesComplete();
  }, [userId, courseIds]);
  const checkAllCoursesComplete = async () => {
    if (!userId || courseIds.length === 0) return;
    try {
      console.log('ModuleExamTrigger: Checking completion for courses:', courseIds);
      const progressChecks = await Promise.all(
        courseIds.map(async (courseId) => {
          const courseProgress = await getCourseProgress(userId, courseId);
          const examsRef = collection(db, 'exams');
          const examQuery = query(examsRef, where('courseId', '==', courseId));
          const examSnapshot = await getDocs(examQuery);
          let examPassed = false;
          if (!examSnapshot.empty) {
            const exam = examSnapshot.docs[0];
            const examId = exam.id;
            const resultRef = doc(db, 'userExams', `${examId}_${userId}_latest`);
            const resultSnap = await getDoc(resultRef);
            examPassed = resultSnap.exists() && resultSnap.data().passed === true;
          } else {
            examPassed = true;
          }
          const isComplete = courseProgress?.completed === true && examPassed;
          console.log(`Course ${courseId} - completed:`, courseProgress?.completed, 'exam passed:', examPassed, 'isComplete:', isComplete);
          return isComplete;
        })
      );
      const allComplete = progressChecks.every(complete => complete === true);
      console.log('ModuleExamTrigger: All courses complete:', allComplete);
      setAllCoursesComplete(allComplete);
      if (allComplete) {
        const questions = courseIds
          .map(courseId => {
            const exam = courseExams.find(e => e.courseId === courseId);
            return exam?.questions || [];
          })
          .flat();
        console.log('ModuleExamTrigger: Combined questions:', questions.length);
        setCombinedQuestions(questions);
      }
    } catch (error) {
      console.error('Error checking course completion:', error);
    }
  };
  const handleStartExam = () => {
    console.log('ModuleExamTrigger: Starting combined exam');
    setShowExam(true);
  };
  const handleExamComplete = (result: ExamResult) => {
    console.log('ModuleExamTrigger: Exam completed with result:', result);
    setExamResult(result);
    setShowExam(false);
    setShowResultModal(true);
  };
  const handleCloseResultModal = () => {
    setShowResultModal(false);
  };
  if (!allCoursesComplete || courseIds.length === 0) {
    return null;
  }
  if (showExam && combinedQuestions.length > 0) {
    const mockExam = {
      id: `module_${moduleId}_exam`,
      moduleId: moduleId,
      lessonId: '',
      courseId: courseIds[0],
      examTitle: `${moduleName} - Final Assessment`,
      allowedAttempts: -1,
      passingScore: 70,
      cooldownMinutes: 5,
      questions: combinedQuestions.map((q, index) => ({
        id: q.id,
        questionText: q.question,
        options: q.options.map((opt: any) => opt.text),
        correctIndex: q.options.findIndex((opt: any) => opt.isCorrect),
        order: index,
      })),
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return <ExamInterface exam={mockExam} onComplete={handleExamComplete} />;
  }
  return (
    <>
      <div className="glass-card p-6 mb-6 border-2 border-green-500">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-800">🎉 Module Complete!</h3>
            <p className="text-gray-600">
              You've completed all {courseIds.length} courses. Take the final exam to unlock the next module.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 mb-4">
          {courseIds.map((_, index) => (
            <div key={index} className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">Course {index + 1}</span>
            </div>
          ))}
        </div>
        <button
          onClick={handleStartExam}
          className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold hover:shadow-lg transition"
        >
          Take Final Exam ({combinedQuestions.length} Questions)
        </button>
      </div>
      {showResultModal && examResult && (
        <ExamResultModal
          isOpen={showResultModal}
          onClose={handleCloseResultModal}
          result={examResult}
        />
      )}
    </>
  );
}