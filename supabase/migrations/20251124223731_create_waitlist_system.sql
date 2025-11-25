/*
  # Create Waitlist System for App Launch

  1. New Tables
    - `waitlist`
      - `id` (uuid, primary key)
      - `email` (text, unique, required) - Email address
      - `name` (text, required) - Full name
      - `created_at` (timestamptz) - Signup timestamp
      - `approved` (boolean, default false) - Approval status
      - `approved_at` (timestamptz) - Approval timestamp
      - `approved_by` (text) - Staff member who approved

    - `staff_access_codes`
      - `id` (uuid, primary key)
      - `code` (text, unique, required) - Access code
      - `is_active` (boolean, default true) - Code status
      - `created_at` (timestamptz)
      - `used_count` (integer, default 0) - How many times used

  2. Security
    - Enable RLS on both tables
    - Public can insert to waitlist
    - Only authenticated users can read their own waitlist entry
    - Only service role can approve waitlist entries
    - Only service role can manage staff codes

  3. Initial Data
    - Insert the staff access code: Gigi171224@
*/

-- Create waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  approved boolean DEFAULT false,
  approved_at timestamptz,
  approved_by text
);

-- Create staff access codes table
CREATE TABLE IF NOT EXISTS staff_access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  used_count integer DEFAULT 0
);

-- Enable RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_access_codes ENABLE ROW LEVEL SECURITY;

-- Waitlist policies: Anyone can join, only approved can see their status
CREATE POLICY "Anyone can join waitlist"
  ON waitlist
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Users can view their own waitlist entry"
  ON waitlist
  FOR SELECT
  TO authenticated
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Staff codes policies: Only service role can manage
CREATE POLICY "Service role can manage staff codes"
  ON staff_access_codes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can check staff codes"
  ON staff_access_codes
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Insert initial staff access code
INSERT INTO staff_access_codes (code, is_active)
VALUES ('Gigi171224@', true)
ON CONFLICT (code) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_approved ON waitlist(approved);
CREATE INDEX IF NOT EXISTS idx_staff_codes_active ON staff_access_codes(is_active);
