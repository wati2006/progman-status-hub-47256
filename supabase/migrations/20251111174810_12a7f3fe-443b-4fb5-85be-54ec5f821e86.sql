-- Frissítjük a függvényeket biztonságos search_path beállítással

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION save_task_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.task_history (
    task_id, modul, feladat, leiras, statusz, 
    felelos, workshop_teams, changed_by
  ) VALUES (
    NEW.id, NEW.modul, NEW.feladat, NEW.leiras, 
    NEW.statusz, NEW.felelos, NEW.workshop_teams, auth.uid()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;