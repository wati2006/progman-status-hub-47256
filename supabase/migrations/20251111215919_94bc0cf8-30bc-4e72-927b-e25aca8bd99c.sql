-- Drop old tables and types
DROP TABLE IF EXISTS public.task_history CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TYPE IF EXISTS public.task_status CASCADE;

-- Create new enums
CREATE TYPE public.part_status AS ENUM ('terv', 'gyartas_alatt', 'kesz', 'jovahagyasra_var', 'elutasitva');
CREATE TYPE public.manufactured_purchased AS ENUM ('gyartott', 'vasarolt');

-- Create parts table
CREATE TABLE public.parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_number TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  manufactured_purchased manufactured_purchased NOT NULL DEFAULT 'gyartott',
  manufacturing_type TEXT,
  material TEXT,
  responsible_person TEXT,
  responsible_company TEXT,
  approver TEXT,
  designer TEXT,
  status part_status NOT NULL DEFAULT 'terv',
  system TEXT,
  assembly TEXT,
  sub_assembly TEXT,
  quantity INTEGER DEFAULT 1,
  cost_per_part DECIMAL(10,2),
  cost_sum DECIMAL(10,2),
  emissions_per_part DECIMAL(10,2),
  emissions_sum DECIMAL(10,2),
  version TEXT NOT NULL DEFAULT '1.0.0',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create parts history table
CREATE TABLE public.parts_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id UUID REFERENCES public.parts(id) ON DELETE CASCADE,
  part_number TEXT NOT NULL,
  department TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  manufactured_purchased manufactured_purchased NOT NULL,
  manufacturing_type TEXT,
  material TEXT,
  responsible_person TEXT,
  responsible_company TEXT,
  approver TEXT,
  designer TEXT,
  status part_status NOT NULL,
  system TEXT,
  assembly TEXT,
  sub_assembly TEXT,
  quantity INTEGER,
  cost_per_part DECIMAL(10,2),
  cost_sum DECIMAL(10,2),
  emissions_per_part DECIMAL(10,2),
  emissions_sum DECIMAL(10,2),
  version TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for parts
CREATE POLICY "Felhasználók láthatják az alkatrészeket"
  ON public.parts FOR SELECT
  USING (true);

CREATE POLICY "Felhasználók létrehozhatnak alkatrészeket"
  ON public.parts FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Felhasználók frissíthetik az alkatrészeket"
  ON public.parts FOR UPDATE
  USING (true);

CREATE POLICY "Felhasználók törölhetik az alkatrészeket"
  ON public.parts FOR DELETE
  USING (true);

-- RLS Policies for parts_history
CREATE POLICY "Felhasználók láthatják a történetet"
  ON public.parts_history FOR SELECT
  USING (true);

CREATE POLICY "Felhasználók létrehozhatnak történet bejegyzéseket"
  ON public.parts_history FOR INSERT
  WITH CHECK (true);

-- Function to generate part numbers
CREATE OR REPLACE FUNCTION public.generate_part_number(dept TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prefix TEXT;
  next_num INTEGER;
  new_part_number TEXT;
BEGIN
  -- Map department to prefix
  prefix := CASE 
    WHEN dept ILIKE '%elektro%' OR dept ILIKE '%elec%' THEN 'ELEC'
    WHEN dept ILIKE '%futómű%' OR dept ILIKE '%chassis%' THEN 'CHAS'
    WHEN dept ILIKE '%karossz%' OR dept ILIKE '%body%' THEN 'BODY'
    WHEN dept ILIKE '%motor%' OR dept ILIKE '%engine%' THEN 'ENG'
    WHEN dept ILIKE '%aero%' THEN 'AERO'
    WHEN dept ILIKE '%kormány%' OR dept ILIKE '%steering%' THEN 'STER'
    ELSE 'GEN'
  END;
  
  -- Get next number for this prefix
  SELECT COALESCE(MAX(CAST(SUBSTRING(part_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.parts
  WHERE part_number LIKE prefix || '-%';
  
  -- Format: PREFIX-001
  new_part_number := prefix || '-' || LPAD(next_num::TEXT, 3, '0');
  
  RETURN new_part_number;
END;
$$;

-- Trigger to auto-generate part number if not provided
CREATE OR REPLACE FUNCTION public.auto_generate_part_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.part_number IS NULL OR NEW.part_number = '' THEN
    NEW.part_number := generate_part_number(NEW.department);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_generate_part_number_trigger
  BEFORE INSERT ON public.parts
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_part_number();

-- Trigger to save history
CREATE OR REPLACE FUNCTION public.save_part_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.parts_history (
    part_id, part_number, department, name, description,
    manufactured_purchased, manufacturing_type, material,
    responsible_person, responsible_company, approver, designer,
    status, system, assembly, sub_assembly, quantity,
    cost_per_part, cost_sum, emissions_per_part, emissions_sum,
    version, changed_by
  ) VALUES (
    NEW.id, NEW.part_number, NEW.department, NEW.name, NEW.description,
    NEW.manufactured_purchased, NEW.manufacturing_type, NEW.material,
    NEW.responsible_person, NEW.responsible_company, NEW.approver, NEW.designer,
    NEW.status, NEW.system, NEW.assembly, NEW.sub_assembly, NEW.quantity,
    NEW.cost_per_part, NEW.cost_sum, NEW.emissions_per_part, NEW.emissions_sum,
    NEW.version, auth.uid()
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER save_part_history_trigger
  AFTER INSERT OR UPDATE ON public.parts
  FOR EACH ROW
  EXECUTE FUNCTION save_part_history();

-- Trigger to update updated_at
CREATE TRIGGER update_parts_updated_at
  BEFORE UPDATE ON public.parts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();