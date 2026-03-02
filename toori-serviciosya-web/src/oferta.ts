import { supabase } from './supabase';

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('oferta-detalle-container');
    if (!container) return;

    const urlParams = new URLSearchParams(window.location.search);
    const ofertaId = urlParams.get('id');

    if (!ofertaId) {
        container.innerHTML = `<div class="alert alert-warning">No se especificó un ID de oferta.</div>`;
        return;
    }

    try {
        // Fetch offer
        const { data: oferta, error } = await supabase
            .from('nuevaOferta')
            .select('*')
            .eq('id', ofertaId)
            .single();

        if (error || !oferta) throw error || new Error("Oferta no encontrada");

        // Fetch presupuestos for TOP 3 MVP
        const { data: presupuestos, error: preErr } = await supabase
            .from('presupuestos')
            .select('*')
            .eq('oferta_id', ofertaId)
            .order('monto', { ascending: true });

        const presupuestosListHTML = (presupuestos || []).map(p => `
            <li style="padding: 20px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-weight: 700; font-size: 1.25rem; color: var(--toori-blue); margin-bottom: 4px;">$${p.monto}</div>
                    <div style="font-size: 0.9rem; color: var(--text-main); font-weight: 500;">${p.descripcion || 'Sin nota adicional'}</div>
                    ${p.matriculado ? '<span style="font-size: 0.7rem; background: #e3f2fd; color: #1976d2; padding: 2px 8px; border-radius: 4px; margin-top: 8px; display: inline-block;">Matriculado</span>' : ''}
                </div>
                <span style="background: ${p.estado === 'seleccionado' ? 'var(--toori-green)' : 'var(--toori-gray)'}; color: white; padding: 4px 12px; border-radius: 50px; font-size: 0.75rem;">${p.estado}</span>
            </li>
        `).join('');

        container.innerHTML = `
            <div class="detail-grid">
                <!-- Left: Offer Detail -->
                <div>
                    <div class="card-premium" style="margin-bottom: 32px; padding: 40px;">
                        <span style="background: var(--toori-blue); color: white; padding: 4px 12px; border-radius: 50px; font-size: 0.75rem; margin-bottom: 1rem; display: inline-block;">Gestión Activa</span>
                        <h2 style="margin-bottom: 1.5rem; font-size: 2rem;">Pedido #${oferta.id}</h2>
                        <p style="font-size: 1.25rem; margin-bottom: 2rem; color: var(--text-main); line-height: 1.6;">${oferta.descripcion || "Detalle del requerimiento en análisis."}</p>
                        <div style="padding-top: 2rem; border-top: 1px solid #eee;">
                            <p class="text-muted" style="font-size: 0.9rem;"><i class="bi bi-shield-check"></i> Gestión con Respaldo Toori • ID: <span style="font-weight: 600; color: var(--toori-dark);">${oferta.id}</span></p>
                        </div>
                    </div>

                    <div class="card-premium" style="padding: 40px;">
                        <h4 style="margin-bottom: 2rem; font-family: var(--font-body); font-weight: 700;">Propuestas de Profesionales (${presupuestos?.length || 0})</h4>
                        <ul style="list-style: none; padding: 0;">
                            ${presupuestosListHTML || '<li class="text-muted">Aún no hay presupuestos. ¡Sé el primero!</li>'}
                        </ul>
                        
                        <button id="btn-top3" class="btn btn-secondary w-100 mt-4" style="font-size: 0.9rem; padding: 12px;">
                            <i class="bi bi-magic"></i> Seleccionar TOP 3 Automáticamente
                        </button>
                    </div>
                </div>

                <!-- Right: Sticky Form -->
                <div style="position: sticky; top: 120px; align-self: start;">
                    <div class="card-premium" style="padding: 40px; background: white;">
                        <h4 style="margin-bottom: 1.5rem; font-family: var(--font-body); font-weight: 700;">Postularme a este pedido</h4>
                        <p class="text-muted mb-4" style="font-size: 0.9rem;">Tu propuesta será analizada por nuestro equipo de gestión antes de ser presentada al cliente.</p>
                        <form id="presupuesto-form">
                            <div class="form-group">
                                <label for="form-monto">Tu presupuesto estimado ($)</label>
                                <input type="number" id="form-monto" class="form-control" placeholder="Ej: 5000" required>
                                <p style="font-size: 0.75rem; color: var(--text-muted); mt-1">Sujeto a validación técnica.</p>
                            </div>
                            <div class="form-group">
                                <label for="form-desc">Nota para el seleccionador</label>
                                <textarea id="form-desc" class="form-control" rows="5" placeholder="Detallá tu experiencia y por qué sos ideal para este trabajo..." required></textarea>
                            </div>
                            <button type="submit" id="btn-enviar" class="btn btn-primary w-100" style="padding: 16px;">
                                Enviar para revisión
                            </button>
                            <div id="form-alert" class="mt-4" style="display: none; padding: 16px; border-radius: 12px; font-size: 0.9rem; text-align: center;"></div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // Handle Enviar Presupuesto
        const form = document.getElementById('presupuesto-form');
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-enviar') as HTMLButtonElement;
            const alertBox = document.getElementById('form-alert');
            if (!alertBox) return;

            btn.disabled = true;
            btn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...`;

            try {
                const monto = (document.getElementById('form-monto') as HTMLInputElement).value;
                const desc = (document.getElementById('form-desc') as HTMLTextAreaElement).value;

                // FASE 4: MODO DEMO TEMPORAL (Find a worker uuid)
                const { data: workerData } = await supabase.from('workers').select('user_id').limit(1);
                const workerId = workerData && workerData.length > 0 ? workerData[0].user_id : null;

                const { error: insertErr } = await supabase.from('presupuestos').insert([{
                    oferta_id: parseInt(ofertaId),
                    worker_user_id: workerId, // May be null if no workers table exists, but MVP allows it
                    monto: parseFloat(monto),
                    descripcion: desc,
                    estado: 'enviado'
                }]);

                if (insertErr) throw insertErr;

                alertBox.className = "mt-3 alert alert-success";
                alertBox.innerText = "¡Presupuesto enviado exitosamente!";

                setTimeout(() => window.location.reload(), 1500);

            } catch (err: any) {
                console.error(err);
                alertBox.className = "mt-3 alert alert-danger";
                alertBox.innerText = "Error: " + err.message;
                btn.disabled = false;
                btn.innerHTML = "Enviar Presupuesto";
            }
        });

        // Handle TOP 3 Selection
        const btnTop3 = document.getElementById('btn-top3');
        btnTop3?.addEventListener('click', async () => {
            try {
                // Fetch again to get the latest
                const { data: latestPresupuestos } = await supabase
                    .from('presupuestos')
                    .select('id, monto, matriculado')
                    .eq('oferta_id', ofertaId);

                if (!latestPresupuestos || latestPresupuestos.length === 0) return;

                // Logic: lower price first, matriculado first
                const sorted = latestPresupuestos.sort((a, b) => {
                    if (a.matriculado && !b.matriculado) return -1;
                    if (!a.matriculado && b.matriculado) return 1;
                    return (a.monto || 0) - (b.monto || 0);
                });

                const top3Ids = sorted.slice(0, 3).map(p => p.id);

                // Update them to seleccionado
                if (top3Ids.length > 0) {
                    await supabase.from('presupuestos')
                        .update({ estado: 'seleccionado' })
                        .in('id', top3Ids);
                    alert("¡Top 3 seleccionado!");
                    window.location.reload();
                }

            } catch (err) {
                console.error("Error top 3:", err);
                alert("Error seleccionando Top 3");
            }
        });

    } catch (err: any) {
        console.error("Error cargando detalle:", err);
        container.innerHTML = `
            <div class="alert alert-danger" role="alert">
                Error al cargar el detalle: ${err.message}
            </div>
        `;
    }
});
