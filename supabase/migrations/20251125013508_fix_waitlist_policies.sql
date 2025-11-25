/*
  # Fix Waitlist Policies

  1. Changes
    - Drop existing restrictive policies
    - Allow all authenticated users to view waitlist (role check happens in app)
    - Allow all authenticated users to update waitlist (role check happens in app)

  2. Security
    - Authenticated users only
    - Application handles role-based access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own waitlist entry" ON waitlist;
DROP POLICY IF EXISTS "Governors can view all waitlist entries" ON waitlist;
DROP POLICY IF EXISTS "Governors can approve waitlist entries" ON waitlist;

-- Allow authenticated users to view all waitlist entries
CREATE POLICY "Authenticated users can view waitlist"
  ON waitlist
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to update waitlist entries
CREATE POLICY "Authenticated users can update waitlist"
  ON waitlist
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
