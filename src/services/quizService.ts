import { supabase } from '../lib/supabase';

export interface QuizResult {
  id?: string;
  user_id: string;
  course_id: string;
  score: number;
  passed: boolean;
  answers: number[];
  completed_at?: string;
  created_at?: string;
}

export async function saveQuizResult(result: Omit<QuizResult, 'id' | 'created_at'>): Promise<QuizResult | null> {
  try {
    const { data, error } = await supabase
      .from('quiz_results')
      .insert([result])
      .select()
      .single();

    if (error) {
      console.error('Error saving quiz result:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to save quiz result:', error);
    return null;
  }
}

export async function getQuizResultsByCourse(userId: string, courseId: string): Promise<QuizResult[]> {
  try {
    const { data, error } = await supabase
      .from('quiz_results')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error fetching quiz results:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch quiz results:', error);
    return [];
  }
}

export async function getBestQuizScore(userId: string, courseId: string): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('quiz_results')
      .select('score')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .order('score', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching best score:', error);
      return null;
    }

    return data?.score || null;
  } catch (error) {
    console.error('Failed to fetch best score:', error);
    return null;
  }
}

export async function hasPassedQuiz(userId: string, courseId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('quiz_results')
      .select('passed')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('passed', true)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error checking quiz pass status:', error);
      return false;
    }

    return data?.passed || false;
  } catch (error) {
    console.error('Failed to check quiz pass status:', error);
    return false;
  }
}

export async function getUserQuizStats(userId: string): Promise<{
  totalQuizzes: number;
  passedQuizzes: number;
  averageScore: number;
}> {
  try {
    const { data, error } = await supabase
      .from('quiz_results')
      .select('score, passed')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching quiz stats:', error);
      return { totalQuizzes: 0, passedQuizzes: 0, averageScore: 0 };
    }

    if (!data || data.length === 0) {
      return { totalQuizzes: 0, passedQuizzes: 0, averageScore: 0 };
    }

    const totalQuizzes = data.length;
    const passedQuizzes = data.filter(r => r.passed).length;
    const averageScore = Math.round(
      data.reduce((sum, r) => sum + r.score, 0) / totalQuizzes
    );

    return { totalQuizzes, passedQuizzes, averageScore };
  } catch (error) {
    console.error('Failed to fetch quiz stats:', error);
    return { totalQuizzes: 0, passedQuizzes: 0, averageScore: 0 };
  }
}
