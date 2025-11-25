import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { courseExams } from '../data/examData';
import { Exam } from '../services/examService';

export async function initializeExams(): Promise<void> {
  try {
    console.log('Initializing exams...');

    for (const examData of courseExams) {
      const examId = examData.courseId;
      const examRef = doc(db, 'exams', examId);

      const questions = examData.questions.map((q, index) => ({
        id: q.id,
        questionText: q.question,
        options: q.options.map(opt => opt.text),
        correctIndex: q.options.findIndex(opt => opt.isCorrect),
        order: index,
      }));

      const exam: Exam = {
        id: examId,
        moduleId: '',
        lessonId: '',
        courseId: examData.courseId,
        examTitle: examData.courseName,
        allowedAttempts: -1,
        passingScore: examData.passingScore,
        cooldownMinutes: 5,
        questions,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(examRef, exam);
      console.log(`✅ Exam created for ${examData.courseName}`);
    }

    console.log('✅ All exams initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing exams:', error);
    throw error;
  }
}
