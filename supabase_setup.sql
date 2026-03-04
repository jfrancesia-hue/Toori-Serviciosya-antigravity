-- 1. Create enums specific to ServiciosYa to avoid clashes with other Apps
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sy_user_role') THEN
        CREATE TYPE sy_user_role AS ENUM ('cliente', 'prestador', 'admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sy_pedido_estado') THEN
        CREATE TYPE sy_pedido_estado AS ENUM ('pendiente', 'en_proceso', 'completado', 'cancelado');
    END IF;
END
$$;

-- 2. Create SY Perfiles (Profiles specific to ServiciosYa)
CREATE TABLE IF NOT EXISTS public.sy_perfiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    nombre TEXT NOT NULL,
    telefono TEXT,
    rol sy_user_role DEFAULT 'cliente'::sy_user_role NOT NULL,
    zona_frecuente TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Safely add columns if the table already existed and was missing them
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sy_perfiles' AND column_name='rol') THEN
        ALTER TABLE public.sy_perfiles ADD COLUMN rol sy_user_role DEFAULT 'cliente'::sy_user_role NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sy_perfiles' AND column_name='nombre') THEN
        ALTER TABLE public.sy_perfiles ADD COLUMN nombre TEXT DEFAULT 'Usuario' NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sy_perfiles' AND column_name='telefono') THEN
        ALTER TABLE public.sy_perfiles ADD COLUMN telefono TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sy_perfiles' AND column_name='zona_frecuente') THEN
        ALTER TABLE public.sy_perfiles ADD COLUMN zona_frecuente TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sy_perfiles' AND column_name='dni') THEN
        ALTER TABLE public.sy_perfiles ADD COLUMN dni TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sy_perfiles' AND column_name='oficios') THEN
        ALTER TABLE public.sy_perfiles ADD COLUMN oficios JSONB;
    END IF;

    -- Agregando Columnas específicas usadas en el formulario nativo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sy_perfiles' AND column_name='edad') THEN
        ALTER TABLE public.sy_perfiles ADD COLUMN edad INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sy_perfiles' AND column_name='antiguedad') THEN
        ALTER TABLE public.sy_perfiles ADD COLUMN antiguedad NUMERIC;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sy_perfiles' AND column_name='antecedentes') THEN
        ALTER TABLE public.sy_perfiles ADD COLUMN antecedentes TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sy_perfiles' AND column_name='latitud') THEN
        ALTER TABLE public.sy_perfiles ADD COLUMN latitud NUMERIC;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sy_perfiles' AND column_name='longitud') THEN
        ALTER TABLE public.sy_perfiles ADD COLUMN longitud NUMERIC;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sy_perfiles' AND column_name='foto_url') THEN
        ALTER TABLE public.sy_perfiles ADD COLUMN foto_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sy_perfiles' AND column_name='antecedentes_url') THEN
        ALTER TABLE public.sy_perfiles ADD COLUMN antecedentes_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sy_perfiles' AND column_name='matricula_url') THEN
        ALTER TABLE public.sy_perfiles ADD COLUMN matricula_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sy_perfiles' AND column_name='verificado') THEN
        ALTER TABLE public.sy_perfiles ADD COLUMN verificado BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Turn on Row Level Security for sy_perfiles
ALTER TABLE public.sy_perfiles ENABLE ROW LEVEL SECURITY;

-- Allow public read access (or restrict to authenticated)
DROP POLICY IF EXISTS "Perfiles are visible to everyone" ON public.sy_perfiles;
CREATE POLICY "Perfiles are visible to everyone" ON public.sy_perfiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.sy_perfiles;
CREATE POLICY "Users can insert their own profile" ON public.sy_perfiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.sy_perfiles;
CREATE POLICY "Users can update own profile" ON public.sy_perfiles FOR UPDATE USING (auth.uid() = id);


-- 3. Create SY Pedidos (Orders specific to ServiciosYa)
CREATE TABLE IF NOT EXISTS public.sy_pedidos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    categoria TEXT NOT NULL,
    zona TEXT NOT NULL,
    descripcion TEXT,
    cliente_id UUID REFERENCES public.sy_perfiles(id) ON DELETE SET NULL,
    prestador_id UUID REFERENCES public.sy_perfiles(id) ON DELETE SET NULL,
    estado sy_pedido_estado DEFAULT 'pendiente'::sy_pedido_estado NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.sy_pedidos ENABLE ROW LEVEL SECURITY;

-- Pedidos policies
DROP POLICY IF EXISTS "Admins can view all pedidos" ON public.sy_pedidos;
CREATE POLICY "Admins can view all pedidos" ON public.sy_pedidos FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.sy_perfiles WHERE id = auth.uid() AND rol = 'admin')
);

DROP POLICY IF EXISTS "Clientes can view their own pedidos" ON public.sy_pedidos;
CREATE POLICY "Clientes can view their own pedidos" ON public.sy_pedidos FOR SELECT USING (auth.uid() = cliente_id);

DROP POLICY IF EXISTS "Prestadores can view assigned pedidos" ON public.sy_pedidos;
CREATE POLICY "Prestadores can view assigned pedidos" ON public.sy_pedidos FOR SELECT USING (auth.uid() = prestador_id);

DROP POLICY IF EXISTS "Anyone can insert a pedido" ON public.sy_pedidos;
CREATE POLICY "Anyone can insert a pedido" ON public.sy_pedidos FOR INSERT WITH CHECK (true);
