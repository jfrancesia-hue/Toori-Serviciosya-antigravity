-- FASE 2: MIGRACIÓN SQL "SAFE" (Solo lo que falta)

-- A) public.usuarios: agregar columnas nuevas si no existen
-- No tocamos las columnas existentes (nombre, edad, dni, etc.)
ALTER TABLE public.usuarios 
  ADD COLUMN IF NOT EXISTS antecedentes text NULL,
  ADD COLUMN IF NOT EXISTS matricula boolean NULL,
  ADD COLUMN IF NOT EXISTS antiguedad numeric NULL,
  ADD COLUMN IF NOT EXISTS ranking jsonb DEFAULT '[{"estrellas":0,"puntualidad":0}]'::jsonb,
  ADD COLUMN IF NOT EXISTS comentarios jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS foto_url text NULL;

-- Backfill defaults for existing rows if they are null
UPDATE public.usuarios 
SET ranking = '[{"estrellas":0,"puntualidad":0}]'::jsonb 
WHERE ranking IS NULL;

UPDATE public.usuarios 
SET comentarios = '[]'::jsonb 
WHERE comentarios IS NULL;

-- Soft constraint for antiguedad
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_antiguedad_nonnegative'
    ) THEN
        ALTER TABLE public.usuarios 
        ADD CONSTRAINT chk_antiguedad_nonnegative CHECK (antiguedad IS NULL OR antiguedad >= 0);
    END IF;
END $$;

-- B) public.presupuestos: asegurar estructura base y vínculo con nuevaOferta
ALTER TABLE public.presupuestos
  ADD COLUMN IF NOT EXISTS oferta_id int8 NULL,
  ADD COLUMN IF NOT EXISTS worker_user_id uuid NULL,
  ADD COLUMN IF NOT EXISTS monto numeric NULL,
  ADD COLUMN IF NOT EXISTS descripcion text NULL,
  ADD COLUMN IF NOT EXISTS antecedentes text NULL,
  ADD COLUMN IF NOT EXISTS matriculado boolean NULL,
  ADD COLUMN IF NOT EXISTS perfil_link text NULL,
  ADD COLUMN IF NOT EXISTS estado text DEFAULT 'enviado',
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Note: In a real scenario, you'd want to add a Foreign Key constraint from oferta_id to nuevaOferta(id)
-- However, since we are doing this "SAFE" and don't know the exact current state of nuevaOferta,
-- we simply ensure the column exists. If you want the FK:
-- ALTER TABLE public.presupuestos ADD CONSTRAINT fk_oferta FOREIGN KEY (oferta_id) REFERENCES public."nuevaOferta"(id);

-- C) Enable Row Level Security (RLS) if not already enabled (Optional but recommended)
-- ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.presupuestos ENABLE ROW LEVEL SECURITY;
-- Note: You should configure policies accordingly in the Supabase Dashboard.
