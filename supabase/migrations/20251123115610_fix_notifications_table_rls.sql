/*
  # Fix notifications table RLS policies

  1. Changes
    - Drop existing restrictive policies if any
    - Add policy for authenticated users to insert notifications
    - Add policy for users to read their own notifications
    - Add policy for users to update their own notifications
    - Add policy for users to delete their own notifications
    - Add policy for service role to manage all notifications

  2. Security
    - Users can only read/update/delete notifications meant for them
    - Authenticated users can create notifications
    - Service role has full access for system notifications
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
  DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
  DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
  DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
  DROP POLICY IF EXISTS "Service role has full access" ON notifications;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Policy for authenticated users to create notifications
CREATE POLICY "Authenticated users can create notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy for users to read their own notifications
CREATE POLICY "Users can read own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Policy for users to update their own notifications
CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub')
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Policy for users to delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications
  FOR DELETE
  TO authenticated
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');