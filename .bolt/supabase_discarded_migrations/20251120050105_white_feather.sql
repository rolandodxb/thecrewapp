/*
  # Create AI Logs Table with RLS

  1. New Tables
    - `ai_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `request_type` (text, type of AI request)
      - `request_data` (jsonb, request payload)
      - `response_data` (jsonb, AI response)
      - `tokens_used` (integer, number of tokens consumed)
      - `cost` (decimal, cost of the request)
      - `duration_ms` (integer, request duration in milliseconds)
      - `status` (text, success/error status)
      - `error_message` (text, error details if any)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `ai_logs` table
    - Add policy for authenticated users to read AI logs
    - Add policy for service role to insert logs
*/

CREATE TABLE IF NOT EXISTS ai_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  request_type text NOT NULL,
  request_data jsonb,
  response_data jsonb,
  tokens_used integer DEFAULT 0,
  cost decimal(10,6) DEFAULT 0,
  duration_ms integer DEFAULT 0,
  status text NOT NULL DEFAULT 'success',
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read AI logs (for governors and admins)
CREATE POLICY "Authenticated users can read AI logs"
  ON ai_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow service role to insert AI logs
CREATE POLICY "Service role can insert AI logs"
  ON ai_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS ai_logs_user_id_idx ON ai_logs(user_id);
CREATE INDEX IF NOT EXISTS ai_logs_created_at_idx ON ai_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS ai_logs_request_type_idx ON ai_logs(request_type);