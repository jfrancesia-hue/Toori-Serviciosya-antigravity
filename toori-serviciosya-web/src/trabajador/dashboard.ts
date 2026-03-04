import { supabase } from '../supabase';

document.addEventListener('DOMContentLoaded', async () => {
    const loader = document.getElementById('page-loader');
    const header = document.getElementById('app-header');
    const content = document.getElementById('main-content');
    const bottomNav = document.getElementById('bottom-nav');

    const spanNombre = document.getElementById('span-nombre');
    const btnLogout = document.getElementById('btn-logout');
    const btnRefresh = document.getElementById('btn-refresh');
    const jobsContainer = document.getElementById('jobs-container');
    const emptyState = document.getElementById('empty-state');

    // 1. Verify Auth & Role
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (!session || authError) {
        window.location.href = '/login.html';
        return;
    }

    const { data: perfil, error: roleError } = await supabase
        .from('sy_perfiles')
        .select('rol, nombre')
        .eq('id', session.user.id)
        .single();

    if (roleError || (perfil?.rol !== 'prestador' && perfil?.rol !== 'admin')) {
        alert("Configuración incompleta: Por favor completa tu perfil primero para acceder al panel de trabajador.");
        window.location.href = '/perfil.html';
        return;
    }

    // Success login
    if (loader) loader.classList.add('d-none');
    if (header) header.classList.remove('d-none');
    if (content) content.classList.remove('d-none');
    if (bottomNav) bottomNav.classList.remove('d-none');

    if (spanNombre) spanNombre.textContent = perfil?.nombre?.split(' ')[0] || 'Trabajador';

    // 2. Fetch Assigned Jobs
    async function fetchJobs() {
        if (!jobsContainer || !emptyState) return;

        // Show loading state by removing all cards (except empty state which we hide temporarily)
        const existingCards = jobsContainer.querySelectorAll('.job-card');
        existingCards.forEach(c => c.remove());
        emptyState.classList.add('d-none');
        jobsContainer.innerHTML += `<div id="loading-spinner" class="text-center py-4"><div class="spinner-border text-info" role="status"></div></div>`;

        try {
            const { data: pedidos, error } = await supabase
                .from('sy_pedidos')
                .select(`
                    id, categoria, zona, descripcion, estado, created_at,
                    sy_perfiles!cliente_id(nombre, telefono)
                `)
                .eq('prestador_id', session!.user.id)
                .in('estado', ['en_proceso']) // Only show active assigned tasks
                .order('created_at', { ascending: false });

            // Remove spinner
            document.getElementById('loading-spinner')?.remove();

            if (error) throw error;

            if (!pedidos || pedidos.length === 0) {
                emptyState.classList.remove('d-none');
                return;
            }

            // Render Jobs
            const cardsHtml = pedidos.map(pedido => {
                const clienteProfile = Array.isArray(pedido.sy_perfiles) ? pedido.sy_perfiles[0] : pedido.sy_perfiles;
                const clienteTel = clienteProfile?.telefono ? `<a href="https://wa.me/${clienteProfile.telefono.replace(/[^0-9]/g, '')}" class="text-decoration-none" target="_blank">${clienteProfile.telefono}</a>` : 'Sin teléfono provisto.';

                const shortId = pedido.id.split('-')[0].toUpperCase();

                return `
                    <div class="job-card">
                        <div class="job-card-header">
                            <div>
                                <h6 class="fw-bold m-0 text-dark">${pedido.categoria}</h6>
                                <small class="text-muted">Ticket #T-${shortId}</small>
                            </div>
                            <span class="badge-estado bg-${pedido.estado}">${pedido.estado.replace('_', ' ')}</span>
                        </div>
                        
                        <div class="job-detail-item">
                            <i class="bi bi-geo-alt-fill"></i>
                            <div>
                                <strong class="d-block text-dark">Zona / Dirección</strong>
                                <span class="text-muted">${pedido.zona}</span>
                            </div>
                        </div>

                        <div class="job-detail-item">
                            <i class="bi bi-person-fill"></i>
                            <div>
                                <strong class="d-block text-dark">Cliente</strong>
                                <span class="text-muted">${clienteProfile?.nombre || 'Web (Anónimo)'}</span>
                            </div>
                        </div>

                        <div class="job-detail-item">
                            <i class="bi bi-telephone-fill"></i>
                            <div>
                                <strong class="d-block text-dark">Contacto</strong>
                                <span class="text-muted">${clienteTel}</span>
                            </div>
                        </div>

                        ${pedido.descripcion ? `
                        <div class="job-detail-item mt-3">
                            <div class="p-3 w-100 rounded bg-light border text-muted small">
                                <strong>Problema reportado:</strong><br>
                                ${pedido.descripcion}
                            </div>
                        </div>` : ''}

                        <hr class="text-muted opacity-25">
                        
                        <button class="btn btn-success w-100 fw-bold btn-terminar" data-id="${pedido.id}" style="padding: 12px; border-radius: 10px;">
                            <i class="bi bi-check-circle me-2"></i> Marcar como Terminado
                        </button>
                    </div>
                `;
            }).join('');

            jobsContainer.innerHTML += cardsHtml;

            // Bind completing event
            document.querySelectorAll('.btn-terminar').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const button = e.currentTarget as HTMLButtonElement;
                    const id = button.dataset.id;
                    if (confirm('¿Estás seguro de que completaste este trabajo? El cliente será notificado.')) {

                        button.disabled = true;
                        button.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div> Enviando...';

                        const { error: updError } = await supabase
                            .from('sy_pedidos')
                            .update({ estado: 'completado' })
                            .eq('id', id);

                        if (updError) {
                            alert('Error al actualizar el registro en la base de datos.');
                            button.disabled = false;
                        } else {
                            // Fetch client data for WhatsApp request
                            const pedido = pedidos.find(p => p.id === id);
                            const clienteProfile = Array.isArray(pedido?.sy_perfiles) ? pedido.sy_perfiles[0] : pedido?.sy_perfiles;

                            if (clienteProfile?.telefono) {
                                const msg = `Hola ${clienteProfile.nombre}, ¡ya terminé el servicio de ${pedido?.categoria}! ✅ \n\n¿Podrías calificar mi trabajo ingresando a tu panel de Toori? \n👉 ${window.location.origin}/cliente/index.html \n\n¡Gracias!`;
                                const waUrl = `https://wa.me/${clienteProfile.telefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;

                                if (confirm('Trabajo finalizado. ¿Querés enviarle un mensaje al cliente para que te califique por WhatsApp?')) {
                                    window.open(waUrl, '_blank');
                                }
                            }

                            fetchJobs(); // reload list
                        }
                    }
                });
            });

        } catch (e: any) {
            console.error(e);
            alert("Error cargando trabajos: " + e.message);
        }
    }

    // 3. Init
    await fetchJobs();

    // Event Listeners
    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            const icon = btnRefresh.querySelector('i');
            if (icon) icon.classList.add('bi-spin');
            fetchJobs().finally(() => icon?.classList.remove('bi-spin'));
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', async (e) => {
            e.preventDefault();
            await supabase.auth.signOut();
            window.location.href = '/login.html';
        });
    }
});
