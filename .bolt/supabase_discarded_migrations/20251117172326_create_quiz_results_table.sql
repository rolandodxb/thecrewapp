/*
  # Create Quiz Results Table

  1. New Tables
    - `quiz_results`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `course_id` (text, course identifier)
      - `score` (integer, percentage score 0-100)
      - `passed` (boolean, true if score >= 80%)
      - `answers` (jsonb, stores user's answers)
      - `completed_at` (timestamptz, when quiz was completed)
      - `created_at` (timestamptz, record creation time)

  2. Security
    - Enable RLS on `quiz_results` table
    - Add policy for users to read their own quiz results
    - Add policy for users to insert their own quiz results
    - Add policy for users to view their quiz history

  3. Indexes
    - Index on user_id for faster queries
    - Index on course_id for course-specific queries
    - Composite index on (user_id, course_id) for user-course queries
*/

CREATE TABLE IF NOT EXISTS quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id text NOT NULL,
  score integer NOT NULL CHECK (score >= 0 AND score <= 100),
  passed boolean NOT NULL,
  answers jsonb DEFAULT '[]'::jsonb,
  completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quiz results"
  ON quiz_results
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz results"
  ON quiz_results
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_course_id ON quiz_results(course_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_course ON quiz_results(user_id, course_id);
