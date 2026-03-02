-- Migration 02: Registro de Documentos y Geocodificación
-- Fecha: 2026-03-02

-- 1. Agregar columnas a usuarios
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS antecedentes_url text;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS matricula_url text;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS latitud double precision;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS longitud double precision;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS verificado boolean NOT NULL DEFAULT false;

-- 2. Asegurar que ciudad y barrio existen en usuarios
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS ciudad text;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS barrio text;

-- Nota: Si existe la tabla workers, nos aseguramos de que tenga estructura básica
-- La tabla workers suele tener una relación 1:1 con usuarios
-- ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE REFERENCES public.usuarios(id);
-- ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS status text DEFAULT 'OFFLINE';
-- ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS last_seen_at timestamptz DEFAULT now();

-- 3. Habilitar PostGIS si no está (opcional, para el punto ST_SetSRID)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 4. Agregar columna geography si no existe
-- ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS location geography(POINT, 4326);
