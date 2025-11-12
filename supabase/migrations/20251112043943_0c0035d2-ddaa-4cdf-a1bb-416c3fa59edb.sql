-- Create a function to delete part files from storage when a part is deleted
CREATE OR REPLACE FUNCTION public.delete_part_files()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  -- Delete all files associated with this part from storage
  DELETE FROM storage.objects 
  WHERE bucket_id = 'part-files' 
  AND name LIKE OLD.id || '/%';
  
  RETURN OLD;
END;
$$;

-- Create trigger to automatically delete files when a part is deleted
DROP TRIGGER IF EXISTS delete_part_files_trigger ON public.parts;
CREATE TRIGGER delete_part_files_trigger
  BEFORE DELETE ON public.parts
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_part_files();