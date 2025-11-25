/*
  # Create Marketplace Payment Intents Tracking Table

  1. New Tables
    - `marketplace_payment_intents`
      - `id` (uuid, primary key) - Unique identifier
      - `payment_intent_id` (text, unique) - Stripe payment intent ID
      - `firebase_order_id` (text) - Firebase Firestore order document ID
      - `firebase_buyer_uid` (text) - Firebase buyer user ID
      - `firebase_seller_uid` (text) - Firebase seller user ID
      - `product_id` (text) - Product identifier
      - `amount` (bigint) - Amount in cents
      - `currency` (text) - Currency code
      - `status` (text) - Payment status: pending, processing, succeeded, failed, canceled
      - `stripe_customer_id` (text) - Stripe customer ID
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `marketplace_payment_intents` table
    - Add policy for service role full access
    - Add policy for authenticated users to read their own payment intents

  3. Performance
    - Create indexes on payment_intent_id, firebase_order_id, firebase_buyer_uid for fast lookups
*/

CREATE TABLE IF NOT EXISTS marketplace_payment_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_intent_id text NOT NULL UNIQUE,
  firebase_order_id text NOT NULL,
  firebase_buyer_uid text NOT NULL,
  firebase_seller_uid text,
  product_id text NOT NULL,
  amount bigint NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'pending',
  stripe_customer_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled'))
);

ALTER TABLE marketplace_payment_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to payment intents"
  ON marketplace_payment_intents FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view own payment intents"
  ON marketplace_payment_intents FOR SELECT
  TO authenticated
  USING (
    firebase_buyer_uid = current_setting('request.jwt.claims', true)::json->>'sub'
    OR
    firebase_buyer_uid IN (
      SELECT user_id FROM stripe_customers
      WHERE customer_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE INDEX IF NOT EXISTS idx_marketplace_payment_intents_payment_intent
  ON marketplace_payment_intents(payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_payment_intents_firebase_order
  ON marketplace_payment_intents(firebase_order_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_payment_intents_buyer
  ON marketplace_payment_intents(firebase_buyer_uid);

CREATE INDEX IF NOT EXISTS idx_marketplace_payment_intents_status
  ON marketplace_payment_intents(status);

CREATE INDEX IF NOT EXISTS idx_marketplace_payment_intents_customer
  ON marketplace_payment_intents(stripe_customer_id);

CREATE OR REPLACE FUNCTION update_marketplace_payment_intents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER marketplace_payment_intents_updated_at
  BEFORE UPDATE ON marketplace_payment_intents
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_payment_intents_updated_at();