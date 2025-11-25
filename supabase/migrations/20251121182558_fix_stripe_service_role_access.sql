/*
  # Fix Stripe Service Role Access
  
  1. Changes
    - Add policies to allow service role to manage Stripe customer and subscription data
    - Service role needs full access to create customers and subscriptions during checkout
  
  2. Security
    - Service role policies allow backend operations
    - User policies remain restrictive for client access
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can manage customers" ON stripe_customers;
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON stripe_subscriptions;
DROP POLICY IF EXISTS "Service role can manage orders" ON stripe_orders;

-- Allow service role to insert and update stripe_customers
CREATE POLICY "Service role can manage customers"
  ON stripe_customers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow service role to insert and update stripe_subscriptions
CREATE POLICY "Service role can manage subscriptions"
  ON stripe_subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow service role to insert and update stripe_orders
CREATE POLICY "Service role can manage orders"
  ON stripe_orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);