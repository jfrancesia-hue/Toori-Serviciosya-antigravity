import { supabase } from './supabase';

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('ofertas-container');
    const loader = document.getElementById('loading-ofertas');

    if (!container || !loader) return;

    try {
        const { data, error } = await supabase
            .from('nuevaOferta')
            .select('*')
            .eq('estado', 'pendiente')
            .order('id', { ascending: false });

        if (error) throw error;

        loader.style.display = 'none';

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center mt-5">
                    <h4>No hay ofertas pendientes en este momento.</h4>
                    <p class="text-muted">Vuelve más tarde para ver nuevas oportunidades.</p>
                </div>
            `;
            return;
        }

        let html = '';
        data.forEach(oferta => {
            html += `
                <div class="card-premium" style="display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                            <span style="background: var(--toori-blue); color: white; padding: 4px 12px; border-radius: 50px; font-size: 0.75rem;">En gestión</span>
                            <span style="font-size: 0.8rem; color: var(--text-muted);">#${oferta.id}</span>
                        </div>
                        <h3 style="font-size: 1.25rem; margin-bottom: 8px; font-family: var(--font-body); font-weight: 600;">
                            ${oferta.descripcion || "Sin descripción"}
                        </h3>
                        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 20px;">
                            <i class="bi bi-geo-alt"></i> Zona de servicio • <i class="bi bi-phone ms-2"></i> ${oferta.cliente_telefono || "Gestión activa"}
                        </p>
                    </div>
                    <a href="oferta.html?id=${oferta.id}" class="btn btn-primary w-100" style="padding: 10px; font-size: 0.9rem;">
                        Gestionar pedido
                    </a>
                </div>
            `;
        });

        container.innerHTML = html;

    } catch (err: any) {
        console.error("Error cargando ofertas:", err);
        loader.style.display = 'none';
        container.innerHTML = `
            <div class="col-12 text-center mt-5">
                <div class="alert alert-danger" role="alert">
                    Error al cargar las ofertas: ${err.message}
                </div>
            </div>
        `;
    }
});
