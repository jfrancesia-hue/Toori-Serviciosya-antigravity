import { supabase } from '../supabase';

document.addEventListener('DOMContentLoaded', async () => {
    const loader = document.getElementById('page-loader');
    const content = document.getElementById('dashboard-content');
    const userInfo = document.getElementById('admin-user-info');
    const btnLogout = document.getElementById('btn-logout');
    const btnRefresh = document.getElementById('btn-refresh');
    const tableBody = document.getElementById('pedidos-table-body');

    // 1. Verify Authentication & Authorization
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (!session || authError) {
        window.location.href = '/login.html';
        return;
    }

    // Verify Admin Role
    const { data: perfil, error: roleError } = await supabase
        .from('sy_perfiles')
        .select('rol, nombre')
        .eq('id', session.user.id)
        .single();

    if (roleError || perfil?.rol !== 'admin') {
        alert("Acceso denegado: No tienes privilegios de administrador.");
        window.location.href = '/';
        return;
    }

    // Auth Granted
    if (userInfo) userInfo.innerHTML = `<i class="bi bi-person-circle"></i> ${perfil.nombre}<br><small>${session.user.email}</small>`;
    if (loader && content) {
        loader.classList.add('d-none');
        content.classList.remove('d-none');
    }

    // 2. Fetch Data logic
    async function fetchDashboardData() {
        if (!tableBody) return;
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted"><div class="spinner-border spinner-border-sm me-2" role="status"></div> Actualizando...</td></tr>`;

        try {
            // Fetch recent orders
            const { data: pedidos, error } = await supabase
                .from('sy_pedidos')
                .select(`
                    id, 
                    categoria, 
                    zona, 
                    estado, 
                    created_at,
                    sy_perfiles!cliente_id(nombre)
                `)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            // Update KPIs (Basic implementation)
            const countNuevos = pedidos?.filter(p => p.estado === 'pendiente').length || 0;
            const countProceso = pedidos?.filter(p => p.estado === 'en_proceso').length || 0;
            const countCompletados = pedidos?.filter(p => p.estado === 'completado').length || 0;

            document.getElementById('kpi-nuevos')!.textContent = countNuevos.toString();
            document.getElementById('kpi-proceso')!.textContent = countProceso.toString();
            document.getElementById('kpi-completados')!.textContent = countCompletados.toString();

            // Render Table
            if (!pedidos || pedidos.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No hay pedidos registrados aún en el sistema de Toori ServiciosYa.</td></tr>`;
                return;
            }

            tableBody.innerHTML = pedidos.map(pedido => {
                const date = new Date(pedido.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
                const clienteProfile = Array.isArray(pedido.sy_perfiles) ? pedido.sy_perfiles[0] : pedido.sy_perfiles;
                const clienteNombre = clienteProfile?.nombre || 'Web (Anónimo)';
                const shortId = pedido.id.split('-')[0].toUpperCase();

                return `
                    <tr>
                        <td class="fw-bold text-muted">#${shortId}</td>
                        <td>${date}</td>
                        <td><span class="fw-semibold">${pedido.categoria}</span></td>
                        <td><i class="bi bi-geo-alt-fill text-danger small"></i> ${pedido.zona}</td>
                        <td>${clienteNombre}</td>
                        <td><span class="badge-estado bg-${pedido.estado}">${pedido.estado.replace('_', ' ').toUpperCase()}</span></td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary" title="Ver / Asignar Detalles" data-id="${pedido.id}"><i class="bi bi-eye"></i></button>
                        </td>
                    </tr>
                `;
            }).join('');

        } catch (e: any) {
            console.error(e);
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger"><i class="bi bi-exclamation-triangle"></i> Error al cargar datos: ${e.message}</td></tr>`;
        }
    }

    // 3. Fetch Audit Data (Prestadores NO verificados)
    async function fetchAuditData() {
        const auditTableBody = document.getElementById('audit-table-body');
        const btnRefreshAudit = document.getElementById('btn-refresh-audit');
        if (!auditTableBody) return;

        if (btnRefreshAudit) {
            const icon = btnRefreshAudit.querySelector('i');
            if (icon) icon.classList.add('bi-spin');
        }

        auditTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted"><div class="spinner-border spinner-border-sm me-2" role="status"></div> Buscando prestadores...</td></tr>`;

        try {
            const { data: prestadores, error } = await supabase
                .from('sy_perfiles')
                .select(`id, nombre, dni, oficios, zona_frecuente, matricula_url, antecedentes_url, verificado`)
                .eq('rol', 'prestador')
                .eq('verificado', false)
                .order('nombre', { ascending: true });

            if (error) throw error;

            if (btnRefreshAudit) {
                const icon = btnRefreshAudit.querySelector('i');
                if (icon) icon.classList.remove('bi-spin');
            }

            if (!prestadores || prestadores.length === 0) {
                auditTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No hay prestadores pendientes de auditoría. ¡Todo al día! 🎉</td></tr>`;
                return;
            }

            auditTableBody.innerHTML = prestadores.map(p => {
                const docsLinks = [];
                if (p.antecedentes_url) docsLinks.push(`<a href="${p.antecedentes_url}" target="_blank" class="badge bg-secondary text-decoration-none me-1"><i class="bi bi-file-earmark-pdf"></i> Anteced.</a>`);
                if (p.matricula_url) docsLinks.push(`<a href="${p.matricula_url}" target="_blank" class="badge bg-secondary text-decoration-none"><i class="bi bi-file-earmark-pdf"></i> Matrícula</a>`);

                const docsHtml = docsLinks.length > 0 ? docsLinks.join('') : '<span class="text-muted small">Sin archivos</span>';
                const oficiosLabel = Array.isArray(p.oficios) ? p.oficios.join(', ') : 'No especificado';

                return `
                    <tr>
                        <td class="fw-bold"><i class="bi bi-person-fill text-muted me-1"></i> ${p.nombre}</td>
                        <td class="text-muted">${p.dni || '---'}</td>
                        <td><span class="badge bg-light text-dark border">${oficiosLabel}</span></td>
                        <td>${p.zona_frecuente || '---'}</td>
                        <td>${docsHtml}</td>
                        <td>
                            <button class="btn btn-sm btn-success btn-verify" data-id="${p.id}" title="Aprobar y Verificar">
                                <i class="bi bi-check-circle"></i> Aprobar
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');

            // Bind Verify Buttons
            document.querySelectorAll('.btn-verify').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const button = e.currentTarget as HTMLButtonElement;
                    const id = button.dataset.id;
                    if (confirm('¿Estás seguro que revisaste los documentos y querés otorgarle la insignia de Verificado a este trabajador?')) {
                        button.disabled = true;
                        button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';

                        const { error: updError } = await supabase
                            .from('sy_perfiles')
                            .update({ verificado: true })
                            .eq('id', id);

                        if (updError) {
                            alert('Error al verificar: ' + updError.message);
                            button.disabled = false;
                        } else {
                            fetchAuditData(); // Recargar tabla
                        }
                    }
                });
            });

        } catch (e: any) {
            console.error(e);
            auditTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-danger"><i class="bi bi-exclamation-triangle"></i> Error al cargar auditoría: ${e.message}</td></tr>`;
        }
    }

    // 4. Modal & Assignment Logic
    let currentPedidoId: string | null = null;
    const assignModal = new (window as any).bootstrap.Modal(document.getElementById('assignModal'));
    const btnSaveAssignment = document.getElementById('btn-save-assignment');
    const selectPrestador = document.getElementById('select-prestador') as HTMLSelectElement;

    // Load Prestadores list for the select dropdown
    async function loadPrestadores() {
        const { data: prestadores, error } = await supabase
            .from('sy_perfiles')
            .select('id, nombre')
            .eq('rol', 'prestador');

        if (!error && prestadores && selectPrestador) {
            selectPrestador.innerHTML = '<option value="">Seleccione un prestador...</option>' +
                prestadores.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
        }
    }

    // Open Modal and load specific Pedido details
    async function openAssignModal(pedidoId: string) {
        currentPedidoId = pedidoId;
        const shortId = pedidoId.split('-')[0].toUpperCase();

        document.getElementById('modal-ticket-id')!.textContent = `#T-${shortId}`;
        document.getElementById('modal-cliente-info')!.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div> Cargando...';

        assignModal.show();

        const { data: pedido, error } = await supabase
            .from('sy_pedidos')
            .select(`
                id, categoria, zona, descripcion, prestador_id,
                sy_perfiles!cliente_id(nombre, telefono)
            `)
            .eq('id', pedidoId)
            .single();

        if (error || !pedido) {
            alert("Error al cargar detalles del pedido");
            assignModal.hide();
            return;
        }

        const cliente = Array.isArray(pedido.sy_perfiles)
            ? pedido.sy_perfiles[0]
            : pedido.sy_perfiles;

        document.getElementById('modal-cliente-info')!.innerHTML = `<i class="bi bi-person"></i> ${cliente?.nombre || 'Web (Anónimo)'} <br> <i class="bi bi-telephone"></i> ${cliente?.telefono || 'Sin teléfono'}`;
        document.getElementById('modal-zona')!.textContent = pedido.zona;
        document.getElementById('modal-categoria')!.textContent = pedido.categoria;
        document.getElementById('modal-descripcion')!.textContent = pedido.descripcion || 'Sin descripción adicional.';

        if (selectPrestador) {
            selectPrestador.value = pedido.prestador_id || '';
        }
    }

    // Save Assignment
    if (btnSaveAssignment) {
        btnSaveAssignment.addEventListener('click', async () => {
            if (!currentPedidoId) return;

            const prestadorId = selectPrestador.value;
            if (!prestadorId) {
                alert("Por favor seleccione un prestador.");
                return;
            }

            const originalText = btnSaveAssignment.innerHTML;
            btnSaveAssignment.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Guardando...';
            (btnSaveAssignment as HTMLButtonElement).disabled = true;

            const { error } = await supabase
                .from('sy_pedidos')
                .update({
                    prestador_id: prestadorId,
                    estado: 'en_proceso'
                })
                .eq('id', currentPedidoId);

            btnSaveAssignment.innerHTML = originalText;
            (btnSaveAssignment as HTMLButtonElement).disabled = false;

            if (error) {
                alert("Error al asignar prestador: " + error.message);
            } else {
                assignModal.hide();
                fetchDashboardData(); // Refresh table
            }
        });
    }

    // Table Clicks Delegate
    if (tableBody) {
        tableBody.addEventListener('click', (e) => {
            const btn = (e.target as HTMLElement).closest('.btn-outline-primary');
            if (btn) {
                const pedidoId = (btn as HTMLElement).dataset.id;
                if (pedidoId) openAssignModal(pedidoId);
            }
        });
    }

    // Initialize Dashboard
    await fetchDashboardData();
    await fetchAuditData();
    await loadPrestadores();

    // Event Listeners
    const btnRefreshPedidos = document.getElementById('btn-refresh-pedidos');
    if (btnRefreshPedidos) {
        btnRefreshPedidos.addEventListener('click', fetchDashboardData);
    }

    const btnRefreshAuditObj = document.getElementById('btn-refresh-audit');
    if (btnRefreshAuditObj) {
        btnRefreshAuditObj.addEventListener('click', fetchAuditData);
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.href = '/login.html';
        });
    }
});
