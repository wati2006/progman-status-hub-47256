-- Create storage bucket for part files
INSERT INTO storage.buckets (id, name, public)
VALUES ('part-files', 'part-files', false);

-- Add file columns to parts table
ALTER TABLE public.parts 
ADD COLUMN cad_model_url text,
ADD COLUMN technical_drawing_url text,
ADD COLUMN documentation_url text;

-- Add file columns to parts_history table
ALTER TABLE public.parts_history
ADD COLUMN cad_model_url text,
ADD COLUMN technical_drawing_url text,
ADD COLUMN documentation_url text;

-- Update save_part_history function to include file URLs
CREATE OR REPLACE FUNCTION public.save_part_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.parts_history (
    part_id, part_number, department, name, description,
    manufactured_purchased, manufacturing_type, material,
    responsible_person, responsible_company, approver, designer,
    status, system, assembly, sub_assembly, quantity,
    cost_per_part, cost_sum, emissions_per_part, emissions_sum,
    version, changed_by, cad_model_url, technical_drawing_url, documentation_url
  ) VALUES (
    NEW.id, NEW.part_number, NEW.department, NEW.name, NEW.description,
    NEW.manufactured_purchased, NEW.manufacturing_type, NEW.material,
    NEW.responsible_person, NEW.responsible_company, NEW.approver, NEW.designer,
    NEW.status, NEW.system, NEW.assembly, NEW.sub_assembly, NEW.quantity,
    NEW.cost_per_part, NEW.cost_sum, NEW.emissions_per_part, NEW.emissions_sum,
    NEW.version, auth.uid(), NEW.cad_model_url, NEW.technical_drawing_url, NEW.documentation_url
  );
  RETURN NEW;
END;
$$;

-- RLS policies for storage
CREATE POLICY "Users can view part files"
ON storage.objects FOR SELECT
USING (bucket_id = 'part-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can upload part files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'part-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update part files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'part-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete part files"
ON storage.objects FOR DELETE
USING (bucket_id = 'part-files' AND auth.role() = 'authenticated');