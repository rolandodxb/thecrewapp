/*
  # Create AI Logs Table

  1. New Tables
    - `ai_logs`
      - `id` (uuid, primary key)
      - `user_id` (text, required)
      - `prompt` (text, required)
      - `response` (text, required)
      - `created_at` (timestamptz, default now())
      - `model` (text, default 'gpt-4o-mini')
      - `tokens_used` (integer, optional)
  
  2. Security
    - Enable RLS on `ai_logs` table
    - Add policy for authenticated users to insert their own logs
    - Add policy for authenticated users to read their own logs
    - Add policy for governors to read all logs
*/

CREATE TABLE IF NOT EXISTS ai_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  prompt text NOT NULL,
  response text NOT NULL,
  created_at timestamptz DEFAULT now(),
  model text DEFAULT 'gpt-4o-mini',
  tokens_used integer
);

ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own AI logs"
  ON ai_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can read own AI logs"
  ON ai_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE INDEX IF NOT EXISTS idx_ai_logs_user_id ON ai_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created_at ON ai_logs(created_at DESC);
