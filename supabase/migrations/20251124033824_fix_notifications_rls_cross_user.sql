/*
  # Fix Notifications RLS for Cross-User Creation

  1. Changes
    - Allow authenticated users to create notifications for ANY user
    - This is needed for system features like community posts, mentions, etc.
    - Users creating notifications for others is a normal use case

  2. Security
    - Users can only READ their own notifications
    - Users can only UPDATE their own notifications (mark as read)
    - Users can only DELETE their own notifications
    - Any authenticated user can CREATE notifications for others
*/

-- Drop existing insert policy if it exists
DO $$
BEGIN
  DROP POLICY IF EXISTS "Authenticated users can create notifications" ON notifications;
  DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
  DROP POLICY IF EXISTS "Authenticated users can create notifications for any user" ON notifications;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Allow authenticated users to create notifications for any user
CREATE POLICY "Authenticated users can create notifications for any user"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Ensure other policies exist (read, update, delete)
DO $$
BEGIN
  -- Drop and recreate read policy
  DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;

  CREATE POLICY "Users can read own notifications"
    ON notifications
    FOR SELECT
    TO authenticated
    USING (
      user_id = auth.uid()::text
    );

  -- Drop and recreate update policy
  DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

  CREATE POLICY "Users can update own notifications"
    ON notifications
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

  -- Drop and recreate delete policy
  DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

  CREATE POLICY "Users can delete own notifications"
    ON notifications
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid()::text);

EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;
