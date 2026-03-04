-- Migration: Worker Review System
-- Purpose: Allow clients to rate services and show worker reputation.

-- 1. Create the reviews table
CREATE TABLE IF NOT EXISTS public.sy_resenas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comentario text,
    canal text DEFAULT 'web' CHECK (canal IN ('whatsapp', 'web', 'app')),
    
    cliente_id uuid NOT NULL REFERENCES auth.users(id),
    trabajador_id uuid NOT NULL REFERENCES auth.users(id),
    pedido_id uuid NOT NULL UNIQUE REFERENCES public.sy_pedidos(id)
);

-- 2. Add indices for performance
CREATE INDEX IF NOT EXISTS idx_resenas_trabajador ON public.sy_resenas(trabajador_id);
CREATE INDEX IF NOT EXISTS idx_resenas_pedido ON public.sy_resenas(pedido_id);
CREATE INDEX IF NOT EXISTS idx_resenas_created_at ON public.sy_resenas(created_at);

-- 3. Create a view for worker reputation
CREATE OR REPLACE VIEW public.vw_reputacion_prestadores AS
SELECT 
    trabajador_id,
    ROUND(AVG(rating)::numeric, 1) as promedio_estrellas,
    COUNT(id) as total_resenas
FROM 
    public.sy_resenas
GROUP BY 
    trabajador_id;

-- 4. RPC to insert a verified review
-- This ensures: Order is 'completado', user is the client, and no duplicate review exists.
CREATE OR REPLACE FUNCTION public.fn_crear_resena_verificada(
    p_pedido_id uuid,
    p_rating integer,
    p_comentario text,
    p_canal text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_cliente_id uuid;
    v_trabajador_id uuid;
    v_estado text;
BEGIN
    -- Get current authenticated user
    v_cliente_id := auth.uid();
    
    -- 1. Verify petition exists and get data
    SELECT cliente_id, prestador_id, estado INTO v_cliente_id, v_trabajador_id, v_estado
    FROM public.sy_pedidos
    WHERE id = p_pedido_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Pedido no encontrado.');
    END IF;

    -- 2. Check if the user is the actual client
    IF v_cliente_id != auth.uid() THEN
        RETURN json_build_object('success', false, 'message', 'No tienes permiso para calificar este pedido.');
    END IF;

    -- 3. Check if the status is 'completado'
    IF v_estado != 'completado' THEN
        RETURN json_build_object('success', false, 'message', 'Solo puedes calificar pedidos finalizados.');
    END IF;

    -- 4. Check if a review already exists (the 'pedido_id' UNIQUE constraint also handles this)
    IF EXISTS (SELECT 1 FROM public.sy_resenas WHERE pedido_id = p_pedido_id) THEN
        RETURN json_build_object('success', false, 'message', 'Este pedido ya ha sido calificado.');
    END IF;

    -- 5. Insert the review
    INSERT INTO public.sy_resenas (
        rating, 
        comentario, 
        canal, 
        cliente_id, 
        trabajador_id, 
        pedido_id
    ) VALUES (
        p_rating, 
        p_comentario, 
        p_canal, 
        v_cliente_id, 
        v_trabajador_id, 
        p_pedido_id
    );

    RETURN json_build_object('success', true, 'message', 'Reseña creada con éxito.');
END;
$$;
