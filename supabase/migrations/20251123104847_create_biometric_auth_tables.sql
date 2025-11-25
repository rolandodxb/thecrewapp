/*
  # Create Biometric Authentication Tables

  1. New Tables
    - `webauthn_credentials`
      - `id` (uuid, primary key)
      - `user_id` (text, Firebase user ID)
      - `credential_id` (text, unique, WebAuthn credential ID)
      - `public_key` (text, public key for verification)
      - `counter` (bigint, signature counter for replay protection)
      - `device_name` (text, user-friendly device name)
      - `transports` (jsonb, array of supported transports)
      - `aaguid` (text, authenticator attestation GUID)
      - `credential_backed_up` (boolean)
      - `credential_device_type` (text)
      - `revoked` (boolean, default false)
      - `last_used` (timestamp)
      - `created_at` (timestamp)
    
    - `webauthn_challenges`
      - `id` (uuid, primary key)
      - `user_id` (text, Firebase user ID)
      - `challenge` (text, challenge string)
      - `type` (text, 'registration' or 'authentication')
      - `expires_at` (timestamp)
      - `created_at` (timestamp)
    
    - `backup_codes`
      - `id` (uuid, primary key)
      - `user_id` (text, Firebase user ID)
      - `code_hash` (text, bcrypt hash of the code)
      - `used` (boolean, default false)
      - `used_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own credentials
    - Add policies for service role to manage challenges
*/

-- Create webauthn_credentials table
CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  credential_id text UNIQUE NOT NULL,
  public_key text NOT NULL,
  counter bigint NOT NULL DEFAULT 0,
  device_name text NOT NULL,
  transports jsonb DEFAULT '[]'::jsonb,
  aaguid text,
  credential_backed_up boolean DEFAULT false,
  credential_device_type text,
  revoked boolean DEFAULT false,
  last_used timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_user_id ON webauthn_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_credential_id ON webauthn_credentials(credential_id);

-- Enable RLS
ALTER TABLE webauthn_credentials ENABLE ROW LEVEL SECURITY;

-- Users can view their own credentials
CREATE POLICY "Users can view own webauthn credentials"
  ON webauthn_credentials FOR SELECT
  TO authenticated
  USING (user_id = auth.jwt() ->> 'sub');

-- Users can delete their own credentials
CREATE POLICY "Users can delete own webauthn credentials"
  ON webauthn_credentials FOR DELETE
  TO authenticated
  USING (user_id = auth.jwt() ->> 'sub');

-- Service role can insert credentials (during registration)
CREATE POLICY "Service role can insert webauthn credentials"
  ON webauthn_credentials FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Service role can update credentials (counter, last_used, revoked)
CREATE POLICY "Service role can update webauthn credentials"
  ON webauthn_credentials FOR UPDATE
  TO service_role
  USING (true);

-- Create webauthn_challenges table
CREATE TABLE IF NOT EXISTS webauthn_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  challenge text NOT NULL,
  type text NOT NULL CHECK (type IN ('registration', 'authentication')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create index for cleanup of expired challenges
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_expires_at ON webauthn_challenges(expires_at);
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_user_id ON webauthn_challenges(user_id);

-- Enable RLS
ALTER TABLE webauthn_challenges ENABLE ROW LEVEL SECURITY;

-- Service role has full access to challenges
CREATE POLICY "Service role can manage challenges"
  ON webauthn_challenges FOR ALL
  TO service_role
  USING (true);

-- Create backup_codes table
CREATE TABLE IF NOT EXISTS backup_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  code_hash text NOT NULL,
  used boolean DEFAULT false,
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_backup_codes_user_id ON backup_codes(user_id);

-- Enable RLS
ALTER TABLE backup_codes ENABLE ROW LEVEL SECURITY;

-- Users can view their own backup codes (only unused ones)
CREATE POLICY "Users can view own unused backup codes"
  ON backup_codes FOR SELECT
  TO authenticated
  USING (user_id = auth.jwt() ->> 'sub' AND used = false);

-- Service role can manage backup codes
CREATE POLICY "Service role can manage backup codes"
  ON backup_codes FOR ALL
  TO service_role
  USING (true);
