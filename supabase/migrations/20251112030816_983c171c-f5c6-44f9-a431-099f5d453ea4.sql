-- Create part_files table for versioned file management
CREATE TABLE public.part_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  part_id UUID NOT NULL REFERENCES public.parts(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('cad_model', 'technical_drawing', 'documentation')),
  file_url TEXT NOT NULL,
  version TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(part_id, category, version)
);

-- Enable RLS
ALTER TABLE public.part_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view part files"
ON public.part_files
FOR SELECT
USING (true);

CREATE POLICY "Users can insert part files"
ON public.part_files
FOR INSERT
WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete part files"
ON public.part_files
FOR DELETE
USING (true);

-- Create index for faster queries
CREATE INDEX idx_part_files_part_id ON public.part_files(part_id);
CREATE INDEX idx_part_files_category ON public.part_files(part_id, category);