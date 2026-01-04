-- 1. Drop the overly permissive profile SELECT policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- 2. Create a more restrictive policy - users can only view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- 3. Create a view for donations that masks donor_id for anonymous donations
CREATE OR REPLACE VIEW public.donations_public AS
SELECT 
  id,
  project_id,
  amount,
  status,
  message,
  is_anonymous,
  created_at,
  transaction_id,
  CASE 
    WHEN is_anonymous = true THEN NULL 
    ELSE donor_id 
  END as donor_id
FROM public.donations;