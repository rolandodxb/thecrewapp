/*
  # Change stripe_customers.user_id to text for Firebase compatibility
  
  1. Changes
    - Drop views that depend on user_id column
    - Drop policies that depend on user_id column
    - Change stripe_customers.user_id from uuid to text to support Firebase UIDs
    - Drop the foreign key constraint to auth.users since we're using Firebase auth
    - Recreate policies (excluding user-facing policies since app uses Firebase auth)
  
  2. Notes
    - Firebase UIDs are strings like "L5HXJd5UAEhrj2edwibjznbIrK33", not UUIDs
    - Views are not recreated as they rely on auth.uid() which doesn't work with Firebase
    - User-facing policies are not recreated as the app uses Firebase authentication
    - Service role policies are recreated to allow edge functions to manage Stripe data
*/

-- Drop views that depend on the user_id column
DROP VIEW IF EXISTS stripe_user_subscriptions;
DROP VIEW IF EXISTS stripe_user_orders;

-- Drop all policies on all Stripe tables
DROP POLICY IF EXISTS "Users can view their own customer data" ON stripe_customers;
DROP POLICY IF EXISTS "Users can insert their own customer data" ON stripe_customers;
DROP POLICY IF EXISTS "Service role can manage customers" ON stripe_customers;

DROP POLICY IF EXISTS "Users can view their own subscription data" ON stripe_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscription data" ON stripe_subscriptions;
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON stripe_subscriptions;

DROP POLICY IF EXISTS "Users can view their own order data" ON stripe_orders;
DROP POLICY IF EXISTS "Users can insert their own order data" ON stripe_orders;
DROP POLICY IF EXISTS "Service role can manage orders" ON stripe_orders;

-- Drop the foreign key constraint
ALTER TABLE stripe_customers 
DROP CONSTRAINT IF EXISTS stripe_customers_user_id_fkey;

-- Change user_id from uuid to text
ALTER TABLE stripe_customers 
ALTER COLUMN user_id TYPE text USING user_id::text;

-- Recreate service role policies only (app uses Firebase auth, not Supabase auth)
CREATE POLICY "Service role can manage customers"
  ON stripe_customers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage subscriptions"
  ON stripe_subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage orders"
  ON stripe_orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
