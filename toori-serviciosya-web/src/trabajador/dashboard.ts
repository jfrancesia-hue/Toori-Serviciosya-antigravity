import { supabase } from '../supabase';

document.addEventListener('DOMContentLoaded', async () => {
    const loader = document.getElementById('page-loader');
    const header = document.getElementById('app-header');
    const content = document.getElementById('main-content');
    const bottomNav = document.getElementById('bottom-nav');

    const spanNombre = document.getElementById('span-nombre');
    const labelViewTitle = document.getElementById('label-view-title');
    const btnLogout = document.getElementById('btn-logout');
    const btnRefresh = document.getElementById('btn-refresh');
    const jobsContainer = document.getElementById('jobs-container');
    const emptyState = document.getElementById('empty-state');
    const emptyMessage = document.getElementById('empty-message');

    // Nav Items
    const navTrabajos = document.getElementById('nav-trabajos');
    const navOfertas = document.getElementById('nav-ofertas');
    const navHistorial = document.getElementById('nav-historial');

    let currentTab = 'trabajos'; // trabajos, ofertas, historial

    // 1. Verify Auth & Role
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (!session || authError) {
        window.location.href = '/login.html';
        return;
    }

    const { data: perfil, error: roleError } = await supabase
        .from('sy_perfiles')
        .select('rol, nombre, foto_url, oficios')
        .eq('id', session.user.id)
        .single();

    const rawRole = (perfil?.rol || '').toLowerCase();
    const isPrestador = rawRole === 'prestador' || rawRole === 'worker' || rawRole === 'trabajador';

    if (roleError || (!isPrestador && rawRole !== 'admin')) {
        alert("Acceso denegado: este panel es exclusivo para trabajadores.");
        window.location.href = '/perfil.html';
        return;
    }

    let hasOficios = false;
    if (perfil?.oficios) {
        if (Array.isArray(perfil.oficios)) {
            hasOficios = perfil.oficios.length > 0;
        } else if (typeof perfil.oficios === 'string' && perfil.oficios.trim() !== '') {
            hasOficios = true;
        }
    }

    if (isPrestador && !hasOficios) {
        alert("Configuración incompleta: Por favor completa tu postulacion de servicios para acceder a este panel de trabajador.");
        window.location.href = '/registro-verifi.html';
        return;
    }

    // UI Setup
    if (loader) loader.classList.add('d-none');
    if (header) header.classList.remove('d-none');
    if (content) content.classList.remove('d-none');
    if (bottomNav) bottomNav.classList.remove('d-none');

    const meta = session.user.user_metadata;
    const fallbackName = meta?.full_name || meta?.nombre || meta?.name || session.user.email?.split('@')[0] || 'Trabajador';
    const nombreCompleto = perfil?.nombre || fallbackName;
    const nombre = nombreCompleto.split(' ')[0];
    if (spanNombre) spanNombre.textContent = nombre;

    // Load Avatar
    let rawFotoUrl = perfil?.foto_url;
    if (rawFotoUrl && !rawFotoUrl.startsWith('http') && !rawFotoUrl.startsWith('data:')) {
        const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(rawFotoUrl);
        rawFotoUrl = publicUrlData?.publicUrl || rawFotoUrl;
    }
    const fotoUrl = rawFotoUrl || meta?.avatar_url || meta?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=3b82f6&color=fff`;
    const workerAvatar = document.getElementById('worker-avatar') as HTMLImageElement;
    if (workerAvatar) {
        workerAvatar.src = fotoUrl;
        workerAvatar.style.display = 'block';
    }

    // 2. Fetch & Render Engine
    async function renderView() {
        if (!jobsContainer || !emptyState || !labelViewTitle) return;

        // Reset UI
        const existingCards = jobsContainer.querySelectorAll('.job-card');
        existingCards.forEach(c => c.remove());
        emptyState.classList.add('d-none');
        jobsContainer.innerHTML += `<div id="loading-spinner" class="text-center py-5"><div class="spinner-border text-info" role="status"></div></div>`;

        try {
            let query = supabase.from('sy_pedidos').select(`
                id, categoria, zona, descripcion, estado, created_at,
                cliente_id,
                sy_perfiles!cliente_id(nombre, telefono)
            `);

            if (currentTab === 'trabajos') {
                labelViewTitle.textContent = "Mis Trabajos Activos";
                if (emptyMessage) emptyMessage.textContent = "No tienes trabajos asignados actualmente.";
                query = query.eq('prestador_id', session!.user.id).eq('estado', 'en_proceso');
            } else if (currentTab === 'historial') {
                labelViewTitle.textContent = "Historial de Servicios";
                if (emptyMessage) emptyMessage.textContent = "Aún no has completado servicios en Toori.";
                query = query.eq('prestador_id', session!.user.id).eq('estado', 'completado');
            } else if (currentTab === 'ofertas') {
                labelViewTitle.textContent = "Explorar Ofertas";
                if (emptyMessage) emptyMessage.textContent = "No hay nuevas solicitudes en tu zona por ahora.";
                query = query.is('prestador_id', null).eq('estado', 'pendiente');
            }

            const { data: pedidos, error } = await query.order('created_at', { ascending: false });
            document.getElementById('loading-spinner')?.remove();

            if (error) throw error;

            if (!pedidos || pedidos.length === 0) {
                emptyState.classList.remove('d-none');

                // Extra hint: If Trabajos is empty, check if there are pending offers to suggest clicking "Explorar"
                if (currentTab === 'trabajos') {
                    const { count } = await supabase.from('sy_pedidos').select('*', { count: 'exact', head: true }).is('prestador_id', null).eq('estado', 'pendiente');
                    if (count && count > 0) {
                        if (emptyMessage) emptyMessage.innerHTML = `No tienes trabajos asignados, pero hay <strong>${count} solicitudes nuevas</strong> esperando en la pestaña <span class="text-info fw-bold">Explorar</span>.`;
                    }
                }
                return;
            }

            pedidos.forEach(pedido => {
                const clienteProfile = Array.isArray(pedido.sy_perfiles) ? pedido.sy_perfiles[0] : pedido.sy_perfiles;
                const shortId = pedido.id.split('-')[0].toUpperCase();

                const card = document.createElement('div');
                card.className = 'job-card';

                let actionsHtml = '';
                if (currentTab === 'trabajos') {
                    actionsHtml = `
                        <button class="btn btn-success w-100 fw-bold btn-terminar mt-3" data-id="${pedido.id}" style="padding: 12px; border-radius: 12px;">
                            <i class="bi bi-check-circle me-2"></i> Marcar como Terminado
                        </button>
                    `;
                } else if (currentTab === 'ofertas') {
                    actionsHtml = `
                        <button class="btn btn-info text-white w-100 fw-bold btn-tomar mt-3" data-id="${pedido.id}" style="padding: 12px; border-radius: 12px;">
                            <i class="bi bi-hand-thumbs-up me-2"></i> Tomar este Pedido
                        </button>
                    `;
                }

                card.innerHTML = `
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
                            <span class="text-muted">${clienteProfile?.nombre || 'Solicitud Web'}</span>
                        </div>
                    </div>

                    ${pedido.descripcion ? `
                    <div class="p-3 w-100 rounded bg-light border text-muted small mt-2">
                        <strong>Descripción:</strong><br>${pedido.descripcion}
                    </div>` : ''}

                    ${actionsHtml}
                `;

                // Events
                const btnTerminar = card.querySelector('.btn-terminar');
                if (btnTerminar) {
                    btnTerminar.addEventListener('click', async () => {
                        if (confirm('¿Confirmas que terminaste este trabajo?')) {
                            const { error: updErr } = await supabase.from('sy_pedidos').update({ estado: 'completado' }).eq('id', pedido.id);
                            if (updErr) alert("Error: " + updErr.message);
                            else {
                                if (clienteProfile?.telefono) {
                                    const msg = `Hola ${clienteProfile.nombre}, ¡ya terminé el servicio de ${pedido.categoria}! ✅ \n\n¿Podrías calificarme? 👉 ${window.location.origin}/cliente/index.html`;
                                    window.open(`https://wa.me/${clienteProfile.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                                }
                                renderView();
                            }
                        }
                    });
                }

                const btnTomar = card.querySelector('.btn-tomar');
                if (btnTomar) {
                    btnTomar.addEventListener('click', async () => {
                        if (confirm('¿Quieres tomar este pedido? Se te asignará como el profesional a cargo.')) {
                            const { error: updErr } = await supabase.from('sy_pedidos')
                                .update({ prestador_id: session!.user.id, estado: 'en_proceso' })
                                .eq('id', pedido.id);

                            if (updErr) alert("Error: " + updErr.message);
                            else {
                                alert("¡Pedido asignado! Ahora aparece en tu lista de 'Trabajos'.");
                                currentTab = 'trabajos';
                                updateNavState();
                                renderView();
                            }
                        }
                    });
                }

                jobsContainer.appendChild(card);
            });

        } catch (e: any) {
            console.error(e);
            alert("Error: " + e.message);
        }
    }

    function updateNavState() {
        [navTrabajos, navOfertas, navHistorial].forEach(nav => nav?.classList.remove('active'));
        if (currentTab === 'trabajos') navTrabajos?.classList.add('active');
        if (currentTab === 'ofertas') navOfertas?.classList.add('active');
        if (currentTab === 'historial') navHistorial?.classList.add('active');
    }

    // 3. Listeners
    navTrabajos?.addEventListener('click', (e) => { e.preventDefault(); currentTab = 'trabajos'; updateNavState(); renderView(); });
    navOfertas?.addEventListener('click', (e) => { e.preventDefault(); currentTab = 'ofertas'; updateNavState(); renderView(); });
    navHistorial?.addEventListener('click', (e) => { e.preventDefault(); currentTab = 'historial'; updateNavState(); renderView(); });

    btnRefresh?.addEventListener('click', () => {
        const icon = btnRefresh.querySelector('i');
        if (icon) icon.classList.add('btn-refresh-spin');
        renderView().finally(() => {
            if (icon) icon.classList.remove('btn-refresh-spin');
        });
    });

    btnLogout?.addEventListener('click', async (e) => {
        e.preventDefault();
        await supabase.auth.signOut();
        window.location.href = '/login.html';
    });

    // Handle Navbar "Mi Panel" link
    const navBtnPanel = document.getElementById('nav-btn-panel');
    if (navBtnPanel) {
        navBtnPanel.style.display = 'block';
        navBtnPanel.setAttribute('href', '#');
        navBtnPanel.textContent = 'Dashboard';
        navBtnPanel.classList.add('active');
    }

    // Init
    renderView();
});
