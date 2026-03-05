import { supabase } from './supabase';

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const workerId = urlParams.get('id');

    if (!workerId) {
        window.location.href = '/';
        return;
    }

    const loader = document.getElementById('page-loader');
    const content = document.getElementById('main-content');

    const workerNombre = document.getElementById('worker-nombre');
    const workerFoto = document.getElementById('worker-foto') as HTMLImageElement;
    const workerRatingDisplay = document.getElementById('worker-rating-display');
    const workerTotalReviews = document.getElementById('worker-total-reviews');
    const workerZona = document.getElementById('worker-zona');
    const workerVerificado = document.getElementById('worker-verificado');
    const workerBadges = document.getElementById('worker-badges');
    const reviewsList = document.getElementById('reviews-list');
    const emptyReviews = document.getElementById('empty-reviews');
    const btnContratar = document.getElementById('btn-contratar');

    try {
        // 1. Fetch Worker Profile
        const { data: worker, error: workerError } = await supabase
            .from('sy_perfiles')
            .select('*')
            .eq('id', workerId)
            .single();

        if (workerError || !worker) throw new Error("Trabajador no encontrado");

        // 2. Fetch Reputation Aggregates
        const { data: reputacion } = await supabase
            .from('vw_reputacion_prestadores')
            .select('*')
            .eq('trabajador_id', workerId)
            .single();

        // 3. Fetch Reviews
        const { data: reviews, error: reviewsError } = await supabase
            .from('sy_resenas')
            .select(`
                rating, comentario, created_at,
                sy_perfiles!cliente_id(nombre, foto_url)
            `)
            .eq('trabajador_id', workerId)
            .order('created_at', { ascending: false });

        // Render Data
        if (workerNombre) workerNombre.textContent = worker.nombre;
        if (workerFoto) workerFoto.src = worker.foto_url || `https://ui-avatars.com/api/?name=${worker.nombre}&background=3ba8e0&color=fff`;
        if (workerZona) workerZona.textContent = worker.zona_frecuente || worker.ciudad || 'No especificada';
        if (workerVerificado) {
            workerVerificado.textContent = worker.verificado ? 'Trabajador Verificado' : 'En proceso de verificación';
            workerVerificado.parentElement?.querySelector('.bg-success-subtle')?.classList.toggle('bg-warning-subtle', !worker.verificado);
            workerVerificado.parentElement?.querySelector('.text-success')?.classList.toggle('text-warning', !worker.verificado);
        }

        // Render Badges (Oficios)
        if (workerBadges && worker.oficios) {
            const oficios = Array.isArray(worker.oficios) ? worker.oficios : [worker.oficios];
            workerBadges.innerHTML = oficios.map((o: string) => `<span class="badge badge-oficio px-3 py-2 rounded-pill shadow-sm">${o}</span>`).join('');
        }

        // Render Stars
        if (workerRatingDisplay) {
            const stars = reputacion?.promedio_estrellas || 0;
            let starsHtml = '';
            for (let i = 1; i <= 5; i++) {
                if (i <= stars) starsHtml += '<i class="bi bi-star-fill text-warning"></i> ';
                else starsHtml += '<i class="bi bi-star text-muted opacity-50"></i> ';
            }
            workerRatingDisplay.innerHTML = starsHtml;
        }
        if (workerTotalReviews) workerTotalReviews.textContent = `(${reputacion?.total_resenas || 0} reseñas)`;

        // Render Reviews
        if (reviewsList && emptyReviews) {
            if (!reviews || reviews.length === 0) {
                emptyReviews.classList.remove('d-none');
            } else {
                reviewsList.innerHTML = reviews.map(r => {
                    const cliente = Array.isArray(r.sy_perfiles) ? r.sy_perfiles[0] : r.sy_perfiles;
                    const date = new Date(r.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });

                    let starsHtml = '';
                    for (let i = 1; i <= 5; i++) {
                        starsHtml += i <= r.rating ? '<i class="bi bi-star-fill text-warning small"></i>' : '<i class="bi bi-star text-muted opacity-50 small"></i>';
                    }

                    return `
                        <div class="review-card shadow-sm">
                            <div class="d-flex justify-content-between align-items-start mb-3">
                                <div class="d-flex align-items-center gap-3">
                                    <img src="${cliente?.foto_url || `https://ui-avatars.com/api/?name=${cliente?.nombre || 'C'}`}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">
                                    <div>
                                        <strong class="d-block text-dark small">${cliente?.nombre || 'Cliente Toori'}</strong>
                                        <div class="star-rating" style="font-size: 0.7rem;">${starsHtml}</div>
                                    </div>
                                </div>
                                <small class="text-muted" style="font-size: 0.75rem;">${date}</small>
                            </div>
                            <p class="mb-0 text-muted small" style="line-height: 1.6; font-style: italic;">
                                "${r.comentario || 'El cliente no dejó comentarios, pero calificó el servicio satisfactoriamente.'}"
                            </p>
                        </div>
                    `;
                }).join('');
            }
        }

        // UI Reveal
        if (loader) loader.classList.add('d-none');
        if (content) content.classList.remove('d-none');

        // Contratar flow (Centralizado en Toori Bot)
        if (btnContratar) {
            btnContratar.addEventListener('click', () => {
                const centerNumber = '5493512139046'; // Número central de Toori
                const msg = `¡Hola Toori! 👋 Me interesa contratar a ${worker.nombre} (ID: ${worker.id}). ¿Me ayudan a coordinar el servicio?`;
                window.open(`https://wa.me/${centerNumber}?text=${encodeURIComponent(msg)}`, '_blank');
            });
        }

    } catch (err: any) {
        console.error(err);
        alert("Error: " + err.message);
        window.location.href = '/';
    }
});
