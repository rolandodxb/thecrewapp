/*
  # Add INSERT policies for Stripe tables
  
  1. New Policies
    - Allow service role to insert into stripe_customers
    - Allow service role to insert into marketplace_payment_intents
  
  2. Security
    - Service role has full access (used by edge functions)
    - Regular users can only view their own data
*/

-- Allow service role to insert customer records (used by edge functions)
CREATE POLICY "Service role can insert customer data"
  ON stripe_customers
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Check if marketplace_payment_intents table exists and add policies
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'marketplace_payment_intents'
  ) THEN
    -- Allow service role to insert payment intents
    EXECUTE 'CREATE POLICY "Service role can insert payment intents"
      ON marketplace_payment_intents
      FOR INSERT
      TO service_role
      WITH CHECK (true)';
    
    -- Allow service role to update payment intents
    EXECUTE 'CREATE POLICY "Service role can update payment intents"
      ON marketplace_payment_intents
      FOR UPDATE
      TO service_role
      USING (true)
      WITH CHECK (true)';
  END IF;
END $$;