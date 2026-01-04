-- Enable realtime for donations table
ALTER TABLE public.donations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.donations;

-- Enable realtime for ngos table  
ALTER TABLE public.ngos REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ngos;