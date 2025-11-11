--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: task_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.task_status AS ENUM (
    'terv',
    'folyamatban',
    'kesz',
    'elvetve'
);


--
-- Name: save_task_history(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.save_task_history() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: task_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_history (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    task_id uuid,
    modul text NOT NULL,
    feladat text NOT NULL,
    leiras text,
    statusz public.task_status NOT NULL,
    felelos text,
    workshop_teams boolean,
    changed_by uuid,
    changed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    modul text NOT NULL,
    feladat text NOT NULL,
    leiras text,
    statusz public.task_status DEFAULT 'terv'::public.task_status NOT NULL,
    felelos text,
    workshop_teams boolean DEFAULT false,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: task_history task_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_history
    ADD CONSTRAINT task_history_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: tasks save_task_history_on_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER save_task_history_on_update AFTER INSERT OR UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.save_task_history();


--
-- Name: tasks update_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: task_history task_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_history
    ADD CONSTRAINT task_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES auth.users(id);


--
-- Name: task_history task_history_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_history
    ADD CONSTRAINT task_history_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: tasks Felhasználók frissíthetik a feladatokat; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Felhasználók frissíthetik a feladatokat" ON public.tasks FOR UPDATE TO authenticated USING (true);


--
-- Name: tasks Felhasználók láthatják a feladatokat; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Felhasználók láthatják a feladatokat" ON public.tasks FOR SELECT TO authenticated USING (true);


--
-- Name: task_history Felhasználók láthatják a történetet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Felhasználók láthatják a történetet" ON public.task_history FOR SELECT TO authenticated USING (true);


--
-- Name: tasks Felhasználók létrehozhatnak feladatokat; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Felhasználók létrehozhatnak feladatokat" ON public.tasks FOR INSERT TO authenticated WITH CHECK ((auth.uid() = created_by));


--
-- Name: task_history Felhasználók létrehozhatnak történet bejegyzéseket; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Felhasználók létrehozhatnak történet bejegyzéseket" ON public.task_history FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: tasks Felhasználók törölhetik a feladatokat; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Felhasználók törölhetik a feladatokat" ON public.tasks FOR DELETE TO authenticated USING (true);


--
-- Name: task_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;

--
-- Name: tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


