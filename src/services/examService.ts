import { supabase } from '../lib/auth';
export interface ExamQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  order: number;
}
export interface Exam {
  id: string;
  moduleId: string;
  lessonId: string;
  courseId: string;
  examTitle: string;
  allowedAttempts: number;
  passingScore: number;
  cooldownMinutes: number;
  questions: ExamQuestion[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
export interface UserExamResult {
  userId: string;
  moduleId: string;
  lessonId: string;
  courseId: string;
  attempts: number;
  lastScore: number;
  passed: boolean;
  passedAt?: string;
  lastAttemptAt: string;
  answers: number[];
  canRetryAt?: string;
}
export interface ExamSubmission {
  answers: number[];
  timeSpent: number;
}
export interface ExamResult {
  score: number;
  passed: boolean;
  correctAnswers: number;
  totalQuestions: number;
  pointsAwarded: number;
  incorrectQuestions: number[];
}
export const createExam = async (examData: {
  moduleId: string;
  lessonId: string;
  courseId: string;
  examTitle: string;
  questions: Omit<ExamQuestion, 'id'>[];
  passingScore?: number;
  allowedAttempts?: number;
  cooldownMinutes?: number;
  createdBy: string;
}): Promise<string> => {
  try {
    const examId = `${examData.moduleId}_${examData.lessonId}`;
    const examRef = doc(db, 'exams', examId);
    const questionsWithIds: ExamQuestion[] = examData.questions.map((q, index) => ({
      ...q,
      id: `q${index + 1}`,
      order: q.order || index
    }));
    const exam: Exam = {
      id: examId,
      moduleId: examData.moduleId,
      lessonId: examData.lessonId,
      courseId: examData.courseId,
      examTitle: examData.examTitle,
      allowedAttempts: examData.allowedAttempts || -1,
      passingScore: examData.passingScore || 80,
      cooldownMinutes: examData.cooldownMinutes || 5,
      questions: questionsWithIds,
      createdBy: examData.createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(examRef, exam);
    console.log('Exam created successfully:', examId);
    return examId;
  } catch (error) {
    console.error('Error creating exam:', error);
    throw error;
  }
};
export const getExam = async (moduleId: string, lessonId: string): Promise<Exam | null> => {
  try {
    const examId = `${moduleId}_${lessonId}`;
    const examRef = doc(db, 'exams', examId);
    const examSnap = await getDoc(examRef);
    if (examSnap.exists()) {
      return examSnap.data() as Exam;
    }
    return null;
  } catch (error) {
    console.error('Error getting exam:', error);
    return null;
  }
};
export const getExamByCourseId = async (courseId: string): Promise<Exam | null> => {
  try {
    if (!courseId) {
      console.warn('getExamByCourseId: No courseId provided');
      return null;
    }
    const examsRef = collection(db, 'exams');
    const q = query(examsRef, where('courseId', '==', courseId));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const examData = snapshot.docs[0].data() as Exam;
      console.log('Found exam for courseId:', courseId, 'examId:', examData.id);
      return examData;
    }
    console.log('No exam found for courseId:', courseId);
    return null;
  } catch (error) {
    console.error('Error getting exam by course ID:', courseId, error);
    return null;
  }
};
export const updateExam = async (
  moduleId: string,
  lessonId: string,
  updates: Partial<Omit<Exam, 'id' | 'moduleId' | 'lessonId' | 'createdAt' | 'createdBy'>>
): Promise<void> => {
  try {
    const examId = `${moduleId}_${lessonId}`;
    const examRef = doc(db, 'exams', examId);
    await updateDoc(examRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    console.log('Exam updated successfully');
  } catch (error) {
    console.error('Error updating exam:', error);
    throw error;
  }
};
export const deleteExam = async (moduleId: string, lessonId: string): Promise<void> => {
  try {
    const examId = `${moduleId}_${lessonId}`;
    const examRef = doc(db, 'exams', examId);
    await deleteDoc(examRef);
    console.log('Exam deleted successfully');
  } catch (error) {
    console.error('Error deleting exam:', error);
    throw error;
  }
};
export const getUserExamResult = async (
  userId: string,
  moduleId: string,
  lessonId: string
): Promise<UserExamResult | null> => {
  try {
    const resultId = `${userId}_${moduleId}_${lessonId}`;
    const resultRef = doc(db, 'userExams', resultId);
    const resultSnap = await getDoc(resultRef);
    if (resultSnap.exists()) {
      return resultSnap.data() as UserExamResult;
    }
    return null;
  } catch (error: any) {
    // Suppress permission errors until Firestore rules are deployed
    if (error?.code === 'permission-denied') {
      console.warn('⚠️ Exam result permission denied - deploy Firestore rules to fix');
      return null;
    }
    console.error('Error getting user exam result:', error);
    return null;
  }
};
export const canTakeExam = async (
  userId: string,
  moduleId: string,
  lessonId: string
): Promise<{ canTake: boolean; reason?: string; retryAt?: string }> => {
  try {
    const result = await getUserExamResult(userId, moduleId, lessonId);
    if (!result) {
      return { canTake: true };
    }
    if (result.passed) {
      return { canTake: false, reason: 'Already passed this exam' };
    }
    if (result.canRetryAt) {
      const retryTime = new Date(result.canRetryAt).getTime();
      const now = new Date().getTime();
      if (now < retryTime) {
        return {
          canTake: false,
          reason: 'Cooldown period active',
          retryAt: result.canRetryAt
        };
      }
    }
    return { canTake: true };
  } catch (error) {
    console.error('Error checking if user can take exam:', error);
    return { canTake: false, reason: 'Error checking eligibility' };
  }
};
export const submitExam = async (
  userId: string,
  moduleId: string,
  lessonId: string,
  courseId: string,
  submission: ExamSubmission
): Promise<ExamResult> => {
  try {
    console.log('submitExam called with:', { userId, moduleId, lessonId, courseId });
    let exam: Exam | null = null;
    if (courseId && (!moduleId || !lessonId)) {
      exam = await getExamByCourseId(courseId);
      if (exam) {
        moduleId = exam.moduleId || '';
        lessonId = exam.lessonId || '';
      }
    } else {
      exam = await getExam(moduleId, lessonId);
    }
    if (!exam) {
      console.error('Exam not found for:', { moduleId, lessonId, courseId });
      throw new Error('Exam not found');
    }
    console.log('Exam found:', exam.id);
    if (moduleId && lessonId) {
      const eligibility = await canTakeExam(userId, moduleId, lessonId);
      if (!eligibility.canTake) {
        throw new Error(eligibility.reason || 'Cannot take exam at this time');
      }
    }
    let correctAnswers = 0;
    const incorrectQuestions: number[] = [];
    exam.questions.forEach((question, index) => {
      if (submission.answers[index] === question.correctIndex) {
        correctAnswers++;
      } else {
        incorrectQuestions.push(index);
      }
    });
    const totalQuestions = exam.questions.length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const passed = score >= exam.passingScore;
    const resultId = courseId && (!moduleId || !lessonId)
      ? `${exam.id}_${userId}_latest`
      : `${userId}_${moduleId}_${lessonId}`;
    const resultRef = doc(db, 'userExams', resultId);
    const existingResult = await getDoc(resultRef);
    const attempts = existingResult.exists() ? (existingResult.data().attempts || 0) + 1 : 1;
    const isFirstPass = existingResult.exists() ? !existingResult.data().passed : true;
    let pointsAwarded = 0;
    if (passed && isFirstPass) {
      pointsAwarded = 40;
      if (moduleId && lessonId) {
        const previousResult = await getUserExamResult(userId, moduleId, lessonId);
        if (!previousResult || previousResult.attempts === 0) {
          pointsAwarded += 10;
        }
      }
    }
    const now = new Date();
    const userResult: any = {
      userId,
      moduleId,
      lessonId,
      courseId,
      attempts,
      lastScore: score,
      passed,
      lastAttemptAt: now.toISOString(),
      answers: submission.answers
    };
    if (passed) {
      userResult.passedAt = now.toISOString();
    } else if (existingResult.exists() && existingResult.data().passedAt) {
      userResult.passedAt = existingResult.data().passedAt;
    }
    if (!passed && exam.cooldownMinutes > 0) {
      userResult.canRetryAt = new Date(now.getTime() + exam.cooldownMinutes * 60 * 1000).toISOString();
    }
    await setDoc(resultRef, userResult);
    if (passed) {
      await handleExamPass(userId, moduleId, lessonId, courseId, pointsAwarded);
    }
    return {
      score,
      passed,
      correctAnswers,
      totalQuestions,
      pointsAwarded,
      incorrectQuestions
    };
  } catch (error) {
    console.error('Error submitting exam:', error);
    throw error;
  }
};
const handleExamPass = async (
  userId: string,
  moduleId: string,
  lessonId: string,
  courseId: string,
  pointsAwarded: number
): Promise<void> => {
  try {
    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', userId);
      const userPointsRef = doc(db, 'user_points', userId);
      const courseProgressRef = doc(db, 'course_progress', `${userId}_${courseId}`);
      const userSnap = await transaction.get(userRef);
      const userPointsSnap = await transaction.get(userPointsRef);
      if (userPointsSnap.exists()) {
        const currentPoints = userPointsSnap.data().total_points || 0;
        const newPoints = currentPoints + pointsAwarded;
        transaction.update(userPointsRef, {
          total_points: newPoints,
          updated_at: new Date().toISOString()
        });
        const pointEventRef = doc(collection(db, 'point_events'));
        transaction.set(pointEventRef, {
          user_id: userId,
          points: pointsAwarded,
          action: 'exam_passed',
          description: `Passed exam for lesson ${lessonId}`,
          created_at: new Date().toISOString()
        });
      }
      transaction.set(
        courseProgressRef,
        {
          user_id: userId,
          course_id: courseId,
          module_id: moduleId,
          completed: true,
          completed_at: new Date().toISOString(),
          last_accessed: new Date().toISOString()
        },
        { merge: true }
      );
      if (userSnap.exists()) {
        const recentActivity = userSnap.data().recentActivity || [];
        const newActivity = {
          lessonId,
          lessonTitle: `Passed exam for ${lessonId}`,
          moduleId,
          timestamp: new Date().toISOString()
        };
        const updatedActivity = [newActivity, ...recentActivity].slice(0, 20);
        transaction.update(userRef, {
          recentActivity: updatedActivity,
          lastActive: new Date().toISOString()
        });
      }
    });
    console.log('Exam pass handled successfully');
  } catch (error) {
    console.error('Error handling exam pass:', error);
    throw error;
  }
};
export const getExamsByModule = async (moduleId: string): Promise<Exam[]> => {
  try {
    const examsRef = collection(db, 'exams');
    const q = query(examsRef, where('moduleId', '==', moduleId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Exam);
  } catch (error) {
    console.error('Error getting exams by module:', error);
    return [];
  }
};
export const getUserExamHistory = async (userId: string): Promise<UserExamResult[]> => {
  try {
    const resultsRef = collection(db, 'userExams');
    const q = query(resultsRef, where('userId', '==', userId), orderBy('lastAttemptAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as UserExamResult);
  } catch (error) {
    console.error('Error getting user exam history:', error);
    return [];
  }
};