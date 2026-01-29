-- Fix: Drop the overly permissive policy that allows any authenticated user to view all profiles
-- This policy exposes email addresses and other PII to all authenticated users
DROP POLICY IF EXISTS "Only authenticated users can view profiles" ON public.profiles;