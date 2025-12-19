-- Add last_sign_in_at column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN last_sign_in_at timestamp with time zone;