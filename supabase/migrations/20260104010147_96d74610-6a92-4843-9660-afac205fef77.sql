-- Drop and recreate the view with SECURITY INVOKER (default, explicit for clarity)
DROP VIEW IF EXISTS public.donations_public;

CREATE VIEW public.donations_public 
WITH (security_invoker = true) AS
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