/*
  # Create staff_access_codes table
  
  1. New Tables
    - `staff_access_codes`
      - `id` (bigint, primary key, auto-increment)
      - `code` (text, unique) - The staff access code
      - `role` (text) - Staff role (e.g., 'staff', 'moderator', 'coach', 'governor')
      - `is_active` (boolean, default true) - Whether the code is active
      - `max_uses` (integer, nullable) - Maximum number of times code can be used (null = unlimited)
      - `current_uses` (integer, default 0) - Current number of uses
      - `created_by` (text, nullable) - Firebase UID of who created the code
      - `created_at` (timestamptz, default now())
      - `expires_at` (timestamptz, nullable) - Optional expiration date
      - `metadata` (jsonb, nullable) - Additional metadata
  
  2. Security
    - Enable RLS
    - Allow public to read active codes (for login verification)
    - Only governors can create/update/delete codes
*/

-- Create staff_access_codes table
CREATE TABLE IF NOT EXISTS staff_access_codes (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE staff_access_codes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active codes (needed for login verification)
CREATE POLICY "Anyone can read active codes"
  ON staff_access_codes
  FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Allow service role to manage codes (used by edge functions and admin operations)
CREATE POLICY "Service role can manage codes"
  ON staff_access_codes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_staff_access_codes_code ON staff_access_codes(code);
CREATE INDEX IF NOT EXISTS idx_staff_access_codes_active ON staff_access_codes(is_active) WHERE is_active = true;