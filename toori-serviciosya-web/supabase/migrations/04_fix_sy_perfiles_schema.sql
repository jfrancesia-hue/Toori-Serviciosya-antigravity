-- Migration 04: Fix sy_perfiles Schema (Full Update)
-- Purpose: Ensure the consolidated profiles table has ALL necessary columns and force schema reload.
-- Date: 2026-03-05

-- 1. Ensure sy_perfiles exists with basic structure
CREATE TABLE IF NOT EXISTS public.sy_perfiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now()
);

-- 2. Add ALL missing columns one by one to avoid errors if some already exist
ALTER TABLE public.sy_perfiles ADD COLUMN IF NOT EXISTS nombre text;
ALTER TABLE public.sy_perfiles ADD COLUMN IF NOT EXISTS telefono text;
ALTER TABLE public.sy_perfiles ADD COLUMN IF NOT EXISTS rol text DEFAULT 'cliente';
ALTER TABLE public.sy_perfiles ADD COLUMN IF NOT EXISTS dni text;
ALTER TABLE public.sy_perfiles ADD COLUMN IF NOT EXISTS oficios jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.sy_perfiles ADD COLUMN IF NOT EXISTS zona_frecuente text;
ALTER TABLE public.sy_perfiles ADD COLUMN IF NOT EXISTS edad integer;
ALTER TABLE public.sy_perfiles ADD COLUMN IF NOT EXISTS antiguedad numeric;
ALTER TABLE public.sy_perfiles ADD COLUMN IF NOT EXISTS antecedentes text;
ALTER TABLE public.sy_perfiles ADD COLUMN IF NOT EXISTS latitud double precision;
ALTER TABLE public.sy_perfiles ADD COLUMN IF NOT EXISTS longitud double precision;
ALTER TABLE public.sy_perfiles ADD COLUMN IF NOT EXISTS foto_url text;
ALTER TABLE public.sy_perfiles ADD COLUMN IF NOT EXISTS antecedentes_url text;
ALTER TABLE public.sy_perfiles ADD COLUMN IF NOT EXISTS matricula_url text;
ALTER TABLE public.sy_perfiles ADD COLUMN IF NOT EXISTS verificado boolean DEFAULT false;

-- 3. Enable RLS
ALTER TABLE public.sy_perfiles ENABLE ROW LEVEL SECURITY;

-- 4. Policies (Safely created)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public profiles are viewable by everyone' AND tablename = 'sy_perfiles') THEN
        CREATE POLICY "Public profiles are viewable by everyone" ON public.sy_perfiles FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert/update their own profile' AND tablename = 'sy_perfiles') THEN
        CREATE POLICY "Users can insert/update their own profile" ON public.sy_perfiles FOR ALL USING (auth.uid() = id);
    END IF;
END $$;

-- 5. CRITICAL: Force Supabase to reload the schema cache immediately
NOTIFY pgrst, 'reload schema';
