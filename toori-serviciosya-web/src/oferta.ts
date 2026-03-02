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
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <span>$${p.monto} - ${p.descripcion || 'Sin nota'} 
                    ${p.matriculado ? '<span class="badge bg-info ms-2">Matriculado</span>' : ''}
                </span>
                <span class="badge ${p.estado === 'seleccionado' ? 'bg-success' : 'bg-secondary'} rounded-pill">${p.estado}</span>
            </li>
        `).join('');

        container.innerHTML = `
            <div class="card shadow" style="border-radius: 12px; border:none;">
                <div class="card-body p-5">
                    <h2 class="mb-4">Detalle de la Oferta #${oferta.id}</h2>
                    <div class="mb-4">
                        <span class="badge bg-warning text-dark mb-2">${oferta.estado}</span>
                        <p class="lead">${oferta.descripcion || "Sin descripción detallada."}</p>
                        <p class="text-muted"><i class="bi bi-telephone"></i> Teléfono cliente: ${oferta.cliente_telefono}</p>
                    </div>

                    <hr class="my-4">

                    <div class="row">
                        <div class="col-md-6">
                            <h4 class="mb-3">Enviar Presupuesto</h4>
                            <form id="presupuesto-form">
                                <div class="mb-3">
                                    <label class="form-label">Monto ($)</label>
                                    <input type="number" id="form-monto" class="form-control" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Mensaje / Descripción</label>
                                    <textarea id="form-desc" class="form-control" rows="3" required></textarea>
                                </div>
                                <button type="submit" id="btn-enviar" class="btn btn-primary w-100" style="background-color: #00bfa6; border:none;">
                                    Enviar Presupuesto
                                </button>
                                <div id="form-alert" class="mt-3 d-none alert" role="alert"></div>
                            </form>
                        </div>
                        <div class="col-md-6 mt-4 mt-md-0">
                            <h4 class="mb-3">Presupuestos Enviados <span class="badge bg-secondary">${presupuestos?.length || 0}</span></h4>
                            <ul class="list-group mb-3">
                                ${presupuestosListHTML || '<li class="list-group-item text-muted">Aún no hay presupuestos. Sé el primero.</li>'}
                            </ul>
                            
                            <!-- ADMIN TOP 3 Selection Button -->
                            <button id="btn-top3" class="btn btn-outline-dark btn-sm w-100 mt-2">
                                <i class="bi bi-magic"></i> Seleccionar TOP 3 Automáticamente (Modo Admin)
                            </button>
                        </div>
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
