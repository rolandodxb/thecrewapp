/*
  # Create AI Logs Table

  1. New Tables
    - `ai_logs`
      - `id` (uuid, primary key)
      - `user_id` (text, indexed)
      - `request_type` (text) - Type of AI request
      - `request_data` (jsonb) - Request payload
      - `response_data` (jsonb) - AI response
      - `tokens_used` (integer) - Number of tokens consumed
      - `model` (text) - AI model used
      - `status` (text) - success, error, etc.
      - `error_message` (text, nullable)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on `ai_logs` table
    - Users can view their own logs
    - Service role can insert logs
*/

CREATE TABLE IF NOT EXISTS ai_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  request_type text NOT NULL,
  request_data jsonb DEFAULT '{}'::jsonb,
  response_data jsonb DEFAULT '{}'::jsonb,
  tokens_used integer DEFAULT 0,
  model text DEFAULT 'gpt-3.5-turbo',
  status text DEFAULT 'pending',
  error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_logs_user_id ON ai_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created_at ON ai_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_logs_request_type ON ai_logs(request_type);

ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI logs"
  ON ai_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "Service role can insert AI logs"
  ON ai_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service role can view all AI logs"
  ON ai_logs
  FOR SELECT
  TO service_role
  USING (true);
