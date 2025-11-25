/*
  # Fix stripe_customers user_id column type
  
  1. Changes
    - Change `stripe_customers.user_id` from UUID to TEXT to support Firebase UIDs
    - Firebase UIDs are alphanumeric strings, not UUIDs
    - Remove foreign key constraint to auth.users since we use Firebase auth
  
  2. Dependencies
    - Drop views that depend on user_id
    - Drop RLS policies that depend on user_id
    - Drop foreign key constraint to auth.users
    - Change column type
    - Recreate views and RLS policies (but NOT the foreign key)
*/

-- Drop views that depend on user_id
DROP VIEW IF EXISTS stripe_user_subscriptions;
DROP VIEW IF EXISTS stripe_user_orders;

-- Drop policies that depend on user_id column
DROP POLICY IF EXISTS "Users can view their own customer data" ON stripe_customers;
DROP POLICY IF EXISTS "Users can view their own subscription data" ON stripe_subscriptions;
DROP POLICY IF EXISTS "Users can view their own order data" ON stripe_orders;

-- Drop foreign key constraint to auth.users (we use Firebase auth, not Supabase auth)
ALTER TABLE stripe_customers 
DROP CONSTRAINT IF EXISTS stripe_customers_user_id_fkey;

-- Change user_id column type from UUID to TEXT
ALTER TABLE stripe_customers 
ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Recreate the RLS policies (using TEXT comparison)
CREATE POLICY "Users can view their own customer data"
  ON stripe_customers
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::TEXT);

CREATE POLICY "Users can view their own subscription data"
  ON stripe_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id FROM stripe_customers WHERE user_id = auth.uid()::TEXT
    )
  );

CREATE POLICY "Users can view their own order data"
  ON stripe_orders
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id FROM stripe_customers WHERE user_id = auth.uid()::TEXT
    )
  );

-- Recreate the views with TEXT user_id
CREATE VIEW stripe_user_subscriptions AS
SELECT 
  c.customer_id,
  s.subscription_id,
  s.status AS subscription_status,
  s.price_id,
  s.current_period_start,
  s.current_period_end,
  s.cancel_at_period_end,
  s.payment_method_brand,
  s.payment_method_last4
FROM stripe_customers c
LEFT JOIN stripe_subscriptions s ON c.customer_id = s.customer_id
WHERE c.user_id = auth.uid()::TEXT 
  AND c.deleted_at IS NULL 
  AND s.deleted_at IS NULL;

CREATE VIEW stripe_user_orders AS
SELECT 
  c.customer_id,
  o.id AS order_id,
  o.checkout_session_id,
  o.payment_intent_id,
  o.amount_subtotal,
  o.amount_total,
  o.currency,
  o.payment_status,
  o.status AS order_status,
  o.created_at AS order_date
FROM stripe_customers c
LEFT JOIN stripe_orders o ON c.customer_id = o.customer_id
WHERE c.user_id = auth.uid()::TEXT 
  AND c.deleted_at IS NULL 
  AND o.deleted_at IS NULL;