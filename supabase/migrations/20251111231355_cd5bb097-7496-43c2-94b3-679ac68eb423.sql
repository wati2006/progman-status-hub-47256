-- Drop the old foreign key constraint
ALTER TABLE public.parts
DROP CONSTRAINT IF EXISTS parts_created_by_fkey;

-- Add new foreign key constraint from parts.created_by to profiles.id
ALTER TABLE public.parts
ADD CONSTRAINT parts_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;