-- Migration 05: Security Hardening (RLS & Policies)
-- Purpose: Enable Row Level Security (RLS) on all critical tables and define access policies.
-- Date: 2026-03-05

-- 1. Table: sy_resenas
ALTER TABLE IF EXISTS public.sy_resenas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Policy: Everyone (authenticated) can view reviews (Public reputation)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view all reviews' AND tablename = 'sy_resenas') THEN
        CREATE POLICY "Authenticated users can view all reviews" ON public.sy_resenas FOR SELECT TO authenticated USING (true);
    END IF;

    -- Policy: Users can only manage their own reviews (though they are usually created via RPC)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own reviews' AND tablename = 'sy_resenas') THEN
        CREATE POLICY "Users can manage their own reviews" ON public.sy_resenas FOR ALL TO authenticated USING (auth.uid() = cliente_id);
    END IF;
END $$;

-- 2. Table: sy_pedidos
-- Note: Assuming table exists (based on app logic)
ALTER TABLE IF EXISTS public.sy_pedidos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Policy: Clients can see their own orders
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Clients can see their own orders' AND tablename = 'sy_pedidos') THEN
        CREATE POLICY "Clients can see their own orders" ON public.sy_pedidos FOR SELECT TO authenticated USING (auth.uid() = cliente_id);
    END IF;

    -- Policy: Workers can see their assigned orders
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Workers can see their assigned orders' AND tablename = 'sy_pedidos') THEN
        CREATE POLICY "Workers can see their assigned orders" ON public.sy_pedidos FOR SELECT TO authenticated USING (auth.uid() = prestador_id);
    END IF;

    -- Policy: All workers can see 'pendiente' orders to take them
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Workers can see pending orders' AND tablename = 'sy_pedidos') THEN
        CREATE POLICY "Workers can see pending orders" ON public.sy_pedidos FOR SELECT TO authenticated USING (estado = 'pendiente');
    END IF;

    -- Policy: Clients can insert their own orders
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Clients can insert their own orders' AND tablename = 'sy_pedidos') THEN
        CREATE POLICY "Clients can insert their own orders" ON public.sy_pedidos FOR INSERT TO authenticated WITH CHECK (auth.uid() = cliente_id);
    END IF;

    -- Policy: Workers can update orders assigned to them (to mark as finished)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Workers can update their assigned orders' AND tablename = 'sy_pedidos') THEN
        CREATE POLICY "Workers can update their assigned orders" ON public.sy_pedidos FOR UPDATE TO authenticated USING (auth.uid() = prestador_id);
    END IF;
END $$;

-- 3. Buckets Security (Storage)
-- Ensure buckets are public but uploads are restricted (Configure this in Supabase Dashboard)
-- Usually: 
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id IN ('avatars', 'verificaciones'));
-- CREATE POLICY "Own Uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('avatars', 'verificaciones') AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4. Reload Schema Cache
NOTIFY pgrst, 'reload schema';
