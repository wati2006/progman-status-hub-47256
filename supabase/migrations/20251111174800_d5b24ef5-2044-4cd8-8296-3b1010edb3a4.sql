-- Engedélyezzük az UUID generálást
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Státusz típus definiálása
CREATE TYPE task_status AS ENUM ('terv', 'folyamatban', 'kesz', 'elvetve');

-- Feladatok tábla létrehozása
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  modul TEXT NOT NULL,
  feladat TEXT NOT NULL,
  leiras TEXT,
  statusz task_status NOT NULL DEFAULT 'terv',
  felelos TEXT,
  workshop_teams BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Feladat történet tábla verziózáshoz
CREATE TABLE public.task_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  modul TEXT NOT NULL,
  feladat TEXT NOT NULL,
  leiras TEXT,
  statusz task_status NOT NULL,
  felelos TEXT,
  workshop_teams BOOLEAN,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS engedélyezése
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;

-- RLS szabályok - minden bejelentkezett felhasználó láthatja és szerkesztheti
CREATE POLICY "Felhasználók láthatják a feladatokat"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Felhasználók létrehozhatnak feladatokat"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Felhasználók frissíthetik a feladatokat"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Felhasználók törölhetik a feladatokat"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (true);

-- Történet táblára RLS
CREATE POLICY "Felhasználók láthatják a történetet"
  ON public.task_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Felhasználók létrehozhatnak történet bejegyzéseket"
  ON public.task_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Trigger függvény az updated_at automatikus frissítésére
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger a feladatok frissítésére
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger függvény a történet mentésére
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
$$ LANGUAGE plpgsql;

-- Trigger a történet automatikus mentésére
CREATE TRIGGER save_task_history_on_update
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION save_task_history();