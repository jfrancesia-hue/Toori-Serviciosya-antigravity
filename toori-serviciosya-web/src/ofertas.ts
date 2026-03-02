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
            // Mask phone slightly if needed, but per requirement it's just text
            html += `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card h-100 shadow-sm" style="border-radius: 12px; border: 1px solid #e0e0e0;">
                        <div class="card-body d-flex flex-column">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="badge bg-success">Nueva Oferta</span>
                                <span class="text-muted small">ID: #${oferta.id}</span>
                            </div>
                            <h5 class="card-title mt-2 mb-3 text-truncate" style="max-height: 48px; overflow: hidden;">
                                ${oferta.descripcion || "Sin descripción"}
                            </h5>
                            <p class="card-text text-muted mb-4">
                                <i class="bi bi-telephone"></i> ${oferta.cliente_telefono || "No provisto"}
                            </p>
                            <div class="mt-auto">
                                <a href="oferta.html?id=${oferta.id}" class="btn btn-outline-primary w-100" style="border-color: #00bfa6; color: #00bfa6;">
                                    Ver Detalles y Enviar Presupuesto
                                </a>
                            </div>
                        </div>
                    </div>
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
