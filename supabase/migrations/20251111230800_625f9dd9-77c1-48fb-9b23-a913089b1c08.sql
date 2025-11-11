-- Delete all existing data
DELETE FROM public.parts_history;
DELETE FROM public.parts;
DELETE FROM auth.users;

-- Add discord_profile column to profiles table
ALTER TABLE public.profiles ADD COLUMN discord_profile text;

-- Update the handle_new_user function to include all new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, department, discord_profile)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'department',
    NEW.raw_user_meta_data->>'discord_profile'
  );
  RETURN NEW;
END;
$$;