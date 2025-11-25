/*
  # Notification System - Complete Schema

  1. New Tables
    - `notifications`
      - Stores all user notifications with type, priority, and metadata
      - Indexed for fast queries by userId and read status
    
    - `notification_preferences`
      - User-specific notification settings
      - Controls which notification types users receive
    
    - `known_devices`
      - Tracks trusted login devices for security alerts
      - Used to detect unknown login attempts

  2. Security
    - Enable RLS on all tables
    - Users can only access their own notifications and preferences
    - System/admin can create notifications for any user
    
  3. Indexes
    - Optimize queries for userId + createdAt
    - Optimize queries for userId + read status
*/

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  read boolean DEFAULT false,
  read_at timestamptz,
  action_url text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text UNIQUE NOT NULL,
  
  -- Bug Reports
  bug_report_status_changes boolean DEFAULT true,
  bug_report_new_comments boolean DEFAULT true,
  bug_report_assigned boolean DEFAULT true,
  
  -- Chat & Messaging
  chat_private_messages boolean DEFAULT true,
  chat_group_messages boolean DEFAULT true,
  chat_community_messages boolean DEFAULT false,
  chat_mentions boolean DEFAULT true,
  
  -- Community Feed
  community_new_posts boolean DEFAULT true,
  community_post_comments boolean DEFAULT true,
  community_post_reactions boolean DEFAULT false,
  community_my_post_activity boolean DEFAULT true,
  
  -- System
  system_new_features boolean DEFAULT true,
  system_feature_shutdowns boolean DEFAULT true,
  system_announcements boolean DEFAULT true,
  system_maintenance boolean DEFAULT true,
  
  -- Learning
  learning_new_courses boolean DEFAULT true,
  learning_new_modules boolean DEFAULT true,
  learning_course_updates boolean DEFAULT true,
  learning_exam_reminders boolean DEFAULT true,
  learning_achievements boolean DEFAULT true,
  
  -- Security
  security_unknown_logins boolean DEFAULT true,
  security_account_restrictions boolean DEFAULT true,
  security_password_changes boolean DEFAULT true,
  
  -- Meta settings
  email_notifications boolean DEFAULT false,
  push_notifications boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Known devices for security tracking
CREATE TABLE IF NOT EXISTS known_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  device_fingerprint text NOT NULL,
  device_type text NOT NULL,
  browser text NOT NULL,
  os text NOT NULL,
  ip_address text,
  location jsonb DEFAULT '{}',
  trusted boolean DEFAULT true,
  last_used_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, device_fingerprint)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
  ON notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
  ON notifications(user_id, read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_type 
  ON notifications(type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_known_devices_user 
  ON known_devices(user_id, last_used_at DESC);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE known_devices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.jwt() ->> 'sub')
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.jwt() ->> 'sub');

-- RLS Policies for notification_preferences
CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own preferences"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own preferences"
  ON notification_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.jwt() ->> 'sub')
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

-- RLS Policies for known_devices
CREATE POLICY "Users can view own devices"
  ON known_devices FOR SELECT
  TO authenticated
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own devices"
  ON known_devices FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own devices"
  ON known_devices FOR UPDATE
  TO authenticated
  USING (user_id = auth.jwt() ->> 'sub')
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own devices"
  ON known_devices FOR DELETE
  TO authenticated
  USING (user_id = auth.jwt() ->> 'sub');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();