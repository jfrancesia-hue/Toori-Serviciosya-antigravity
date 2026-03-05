import { supabase } from '../supabase';

document.addEventListener('DOMContentLoaded', async () => {
    const loader = document.getElementById('page-loader');
    const header = document.getElementById('app-header');
    const content = document.getElementById('main-content');
    const bottomNav = document.getElementById('bottom-nav');

    const spanNombre = document.getElementById('span-nombre');
    const btnLogout = document.getElementById('btn-logout');
    const btnRefresh = document.getElementById('btn-refresh');
    const pedidosList = document.getElementById('pedidos-list');
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

    if (roleError || (perfil?.rol !== 'cliente' && perfil?.rol !== 'admin')) {
        alert("Configuración incompleta: Por favor completa tu perfil primero.");
        window.location.href = '/perfil.html';
        return;
    }

    // Success login
    if (loader) loader.classList.add('d-none');
    if (header) header.classList.remove('d-none');
    if (content) content.classList.remove('d-none');
    if (bottomNav) bottomNav.classList.remove('d-none');

    // Fallback strategy for Name:
    const meta = session.user.user_metadata;
    const fallbackName = meta?.full_name || meta?.nombre || meta?.name || session.user.email?.split('@')[0] || 'Cliente';
    const nombreCompleto = perfil?.nombre || fallbackName;
    const nombre = nombreCompleto.split(' ')[0];

    if (spanNombre) spanNombre.textContent = nombre;

    // 2. Fetch Client Pedidos
    async function fetchPedidos() {
        if (!pedidosList || !emptyState) return;

        pedidosList.innerHTML = `<div id="loading-spinner" class="text-center py-4"><div class="spinner-border text-info" role="status"></div></div>`;
        emptyState.classList.add('d-none');

        try {
            const { data: pedidos, error } = await supabase
                .from('sy_pedidos')
                .select(`
                    id, categoria, descripcion, estado, created_at, prestador_id,
                    sy_perfiles!prestador_id(nombre, foto_url)
                `)
                .eq('cliente_id', session!.user.id)
                .order('created_at', { ascending: false });

            document.getElementById('loading-spinner')?.remove();

            if (error) throw error;

            if (!pedidos || pedidos.length === 0) {
                emptyState.classList.remove('d-none');
                return;
            }

            // Optionally fetch reviews in a separate request to avoid schema cache crash
            let reviewedPedidoIds = new Set();
            try {
                const pIds = pedidos.map((p: any) => p.id);
                const { data: resenas } = await supabase.from('sy_resenas').select('pedido_id').in('pedido_id', pIds);
                if (resenas) {
                    resenas.forEach((r: any) => reviewedPedidoIds.add(r.pedido_id));
                }
            } catch (e) { console.warn('Podes ignorar si falla traer reseñas: ', e); }

            // Render Pedidos
            const html = pedidos.map(pedido => {
                const prestador = Array.isArray(pedido.sy_perfiles) ? pedido.sy_perfiles[0] : pedido.sy_perfiles;
                const date = new Date(pedido.created_at).toLocaleDateString();

                const hasReview = reviewedPedidoIds.has(pedido.id);

                let actionBtn = '';
                if (pedido.estado === 'completado' && !hasReview) {
                    actionBtn = `<button class="btn btn-warning btn-sm w-100 fw-bold mt-2 rounded-pill btn-calificar" data-pedido-id="${pedido.id}">
                        <i class="bi bi-star-fill me-1"></i> Calificar Servicio
                    </button>`;
                } else if (hasReview) {
                    actionBtn = `<div class="text-success small fw-bold mt-2 text-center">
                        <i class="bi bi-check-circle-fill me-1"></i> Servicio Calificado
                    </div>`;
                }

                return `
                    <div class="pedido-card">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <h6 class="fw-bold m-0">${pedido.categoria}</h6>
                                <small class="text-muted">${date}</small>
                            </div>
                            <span class="badge-estado bg-${pedido.estado}">${pedido.estado.replace('_', ' ')}</span>
                        </div>
                        
                        <div class="p-2 bg-light rounded mb-3 small border">
                            <strong>Tu pedido:</strong> ${pedido.descripcion || 'Sin descripción.'}
                        </div>

                        ${prestador ? `
                        <div class="d-flex align-items-center gap-2 mb-2 p-2 border-top">
                            <a href="/perfil-trabajador.html?id=${pedido.prestador_id}" class="text-decoration-none d-flex align-items-center gap-2">
                                <img src="${prestador.foto_url || `https://ui-avatars.com/api/?name=${prestador.nombre}`}" style="width:30px; height:30px; border-radius:50%; object-fit:cover;">
                                <div class="small">
                                    <span class="text-muted">Trabajador:</span> <strong class="text-primary">${prestador.nombre}</strong>
                                </div>
                            </a>
                        </div>` : ''}

                        ${actionBtn}
                    </div>
                `;
            }).join('');

            pedidosList.innerHTML = html;

            // Bind calificar
            const modalEl = document.getElementById('modalCalificar');
            const modal = new (window as any).bootstrap.Modal(modalEl);
            const inputPedidoId = document.getElementById('input-pedido-id') as HTMLInputElement;
            const inputRating = document.getElementById('input-rating') as HTMLInputElement;
            const starSelector = document.getElementById('star-selector');
            const ratingStars = document.querySelectorAll('.rating-star');
            const formCalificar = document.getElementById('form-calificar') as HTMLFormElement;
            const ratingError = document.getElementById('rating-error');

            // Star selection logic
            ratingStars.forEach(star => {
                star.addEventListener('click', () => {
                    const val = star.getAttribute('data-value');
                    inputRating.value = val || '';

                    ratingStars.forEach(s => {
                        const sVal = s.getAttribute('data-value');
                        if (parseInt(sVal!) <= parseInt(val!)) {
                            s.classList.replace('bi-star', 'bi-star-fill');
                        } else {
                            s.classList.replace('bi-star-fill', 'bi-star');
                        }
                    });
                });
            });

            document.querySelectorAll('.btn-calificar').forEach(btn => {
                btn.addEventListener('click', () => {
                    const pedidoId = (btn as HTMLElement).dataset.pedidoId;
                    if (inputPedidoId) inputPedidoId.value = pedidoId || '';

                    // Reset modal
                    if (formCalificar) formCalificar.reset();
                    ratingStars.forEach(s => s.classList.replace('bi-star-fill', 'bi-star'));
                    if (ratingError) ratingError.classList.add('d-none');

                    modal.show();
                });
            });

            // Form submission logic
            if (formCalificar) {
                formCalificar.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    if (!inputRating.value) {
                        if (ratingError) {
                            ratingError.textContent = "Por favor seleccioná una puntuación.";
                            ratingError.classList.remove('d-none');
                        }
                        return;
                    }

                    const submitBtn = document.getElementById('btn-submit-rating') as HTMLButtonElement;
                    const originalBtnText = submitBtn.innerHTML;
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Enviando...';

                    try {
                        const { data, error } = await supabase.rpc('fn_crear_resena_verificada', {
                            p_pedido_id: inputPedidoId.value,
                            p_rating: parseInt(inputRating.value),
                            p_comentario: (document.getElementById('comment-text') as HTMLTextAreaElement).value,
                            p_canal: 'web'
                        });

                        if (error) throw error;

                        if (data && !data.success) {
                            throw new Error(data.message);
                        }

                        modal.hide();
                        alert("¡Gracias por tu calificación!");
                        fetchPedidos(); // Reload list to update UI or hide button if we implement it
                    } catch (err: any) {
                        if (ratingError) {
                            ratingError.textContent = err.message || "Error al enviar la calificación.";
                            ratingError.classList.remove('d-none');
                        }
                    } finally {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalBtnText;
                    }
                });
            }

        } catch (e: any) {
            console.error(e);
            alert("Error cargando tus pedidos: " + e.message);
        }
    }

    // 3. Init
    await fetchPedidos();

    // Event Listeners
    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            fetchPedidos();
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.href = '/login.html';
        });
    }
});
