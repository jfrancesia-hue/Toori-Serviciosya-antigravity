import { supabase } from './supabase';

document.addEventListener('DOMContentLoaded', async () => {
    const loader = document.getElementById('page-loader');
    const content = document.getElementById('profile-content');
    const form = document.getElementById('form-perfil') as HTMLFormElement;
    const alertMsg = document.getElementById('alert-msg');

    // Inputs
    const inputNombre = document.getElementById('input-nombre') as HTMLInputElement;
    const inputTelefono = document.getElementById('input-telefono') as HTMLInputElement;
    const inputEmail = document.getElementById('input-email') as HTMLInputElement;
    const inputCiudad = document.getElementById('input-ciudad') as HTMLInputElement;
    const imgProfile = document.getElementById('profile-img') as HTMLImageElement;
    const workerFields = document.getElementById('worker-fields');
    const btnSave = document.getElementById('btn-save-profile') as HTMLButtonElement;
    const roleSelection = document.getElementById('role-selection');

    // Worker Stats & Info Elements
    const workerStars = document.getElementById('worker-stars');
    const workerReviewsCount = document.getElementById('worker-reviews-count');
    const workerOficios = document.getElementById('worker-oficios');
    const btnViewPublic = document.getElementById('btn-view-public') as HTMLAnchorElement;

    /**
     * Cleans phone number by removing country prefixes (+54, 54, 549, etc)
     * for a better local UI experience.
     */
    function cleanPhoneForUI(phone: string): string {
        if (!phone) return '';
        let cleaned = phone.toString().replace(/\D/g, ''); // Numbers only
        // Remove prefixes: 549, 54, +549, +54
        if (cleaned.startsWith('549')) cleaned = cleaned.substring(3);
        else if (cleaned.startsWith('54')) cleaned = cleaned.substring(2);
        return cleaned;
    }

    // 1. Verify Authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (!session || authError) {
        window.location.href = '/login.html';
        return;
    }

    // 2. Fetch Profile Data
    async function loadProfile() {
        try {
            const userId = session!.user.id;
            const { data: perfil, error } = await supabase
                .from('sy_perfiles')
                .select('*')
                .eq('id', userId)
                .single();

            const meta = session!.user.user_metadata;
            inputEmail.value = session!.user.email || '';

            // Fallback for Photo (Sync with navbar logic)
            let rawFotoUrl = perfil?.foto_url;

            // Si es un path de storage, construir la URL pública
            if (rawFotoUrl && !rawFotoUrl.startsWith('http') && !rawFotoUrl.startsWith('data:')) {
                const { data: publicUrlData } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(rawFotoUrl);
                rawFotoUrl = publicUrlData?.publicUrl || rawFotoUrl;
            }

            const fotoUrl = rawFotoUrl || meta?.avatar_url || meta?.picture || '';

            // Fallback for Phone
            const authPhone = session!.user.phone || meta?.phone || meta?.telefono || '';
            const dbPhone = perfil?.telefono || authPhone;

            inputTelefono.value = cleanPhoneForUI(dbPhone);

            if (error) {
                // If profile doesn't exist
                const fallbackName = meta?.full_name || meta?.nombre || meta?.name || session!.user.email?.split('@')[0] || 'Nuevo Usuario';
                inputNombre.value = fallbackName;
                imgProfile.src = fotoUrl || `https://ui-avatars.com/api/?name=${fallbackName.split(' ')[0]}&background=3ba8e0&color=fff&size=200`;

                // Show role selection
                roleSelection?.classList.remove('d-none');
            } else {
                // Fill basic info
                inputNombre.value = perfil.nombre || '';

                const nombre = (perfil.nombre || 'User').split(' ')[0];
                imgProfile.src = fotoUrl || `https://ui-avatars.com/api/?name=${nombre}&background=3ba8e0&color=fff&size=200`;

                const rawRole = (perfil.rol || '').toLowerCase();
                const isPrestador = rawRole === 'prestador' || rawRole === 'worker' || rawRole === 'trabajador';

                // Handle Worker fields & Reputation
                if (isPrestador || rawRole === 'admin') {
                    workerFields?.classList.remove('d-none');
                    inputCiudad.value = perfil.zona_frecuente || '';
                    if (btnViewPublic) btnViewPublic.href = `/perfil-trabajador.html?id=${userId}`;

                    // Render Oficios
                    if (workerOficios && perfil.oficios) {
                        const oficios = Array.isArray(perfil.oficios) ? perfil.oficios : [perfil.oficios];
                        workerOficios.innerHTML = oficios.map((o: string) => `<span class="badge bg-light text-primary border">${o}</span>`).join('');
                    } else if (workerOficios) {
                        workerOficios.innerHTML = '<a href="/registro-verifi.html" class="btn btn-sm btn-outline-info w-100 mt-2"><i class="bi bi-card-checklist me-1"></i> Completar Postulación y Oficios</a>';
                    }

                    // Fetch Reputation stats
                    const { data: reputacion } = await supabase
                        .from('vw_reputacion_prestadores')
                        .select('*')
                        .eq('trabajador_id', userId)
                        .single();

                    if (reputacion && workerStars && workerReviewsCount) {
                        workerReviewsCount.textContent = reputacion.total_resenas.toString();
                        const stars = Math.round(reputacion.promedio_estrellas || 0);
                        let starsHtml = '';
                        for (let i = 1; i <= 5; i++) {
                            starsHtml += i <= stars ? '<i class="bi bi-star-fill"></i>' : '<i class="bi bi-star"></i>';
                        }
                        workerStars.innerHTML = starsHtml;
                    }
                }
            }

            // Hide loader
            loader?.classList.add('d-none');
            content?.classList.remove('d-none');

        } catch (err: any) {
            console.error('Error loading profile:', err);
            if (err.code !== 'PGRST116') {
                window.location.href = '/';
            }
        }
    }

    await loadProfile();

    // 3. Save Logic
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Role check for new users
        const selectedRole = (document.querySelector('input[name="user-role"]:checked') as HTMLInputElement)?.value;
        const isNewUser = !roleSelection?.classList.contains('d-none');

        if (isNewUser && !selectedRole) {
            if (alertMsg) {
                alertMsg.textContent = "Por favor selecciona si eres Cliente o Trabajador.";
                alertMsg.classList.add('alert-danger');
                alertMsg.classList.remove('d-none', 'alert-success');
            }
            return;
        }

        // Show loading state
        btnSave.disabled = true;
        const originalBtnHtml = btnSave.innerHTML;
        btnSave.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Guardando...';

        try {
            const rawPhone = inputTelefono.value.replace(/\D/g, '');

            // REMARK: Explicitly removed updated_at, ciudad, barrio, etc.
            const updates: any = {
                id: session.user.id,
                nombre: inputNombre.value,
                telefono: rawPhone
            };

            if (isNewUser && selectedRole) {
                updates.rol = selectedRole;
            }

            // Include worker fields if visible
            const { data: currentProfile } = await supabase.from('sy_perfiles').select('rol, oficios').eq('id', session.user.id).single();
            const currentRole = ((isNewUser ? selectedRole : currentProfile?.rol) || '').toLowerCase();
            const isPrestadorCurrent = currentRole === 'prestador' || currentRole === 'worker' || currentRole === 'trabajador';

            if (isPrestadorCurrent || currentRole === 'admin') {
                updates.zona_frecuente = inputCiudad.value;
            }

            const { error } = await supabase
                .from('sy_perfiles')
                .upsert(updates);

            if (error) throw error;

            // Success feedback
            if (alertMsg) {
                alertMsg.textContent = "¡Perfil actualizado con éxito!";
                alertMsg.classList.add('alert-success');
                alertMsg.classList.remove('d-none', 'alert-danger');
            }

            // Transition Logic
            setTimeout(() => {
                const finalRole = ((isNewUser ? selectedRole : currentProfile?.rol) || '').toLowerCase();
                const isPrestadorFinal = finalRole === 'prestador' || finalRole === 'worker' || finalRole === 'trabajador';

                let hasOficios = false;
                if (currentProfile?.oficios) {
                    if (Array.isArray(currentProfile.oficios)) {
                        hasOficios = currentProfile.oficios.length > 0;
                    } else if (typeof currentProfile.oficios === 'string' && currentProfile.oficios.trim() !== '') {
                        hasOficios = true;
                    }
                }

                // If it's a new worker and doesn't have professions yet, send to the recruitment form
                if (isPrestadorFinal && !hasOficios) {
                    alert("¡Bienvenido! Ahora completa tu postulación para que los clientes puedan encontrarte.");
                    window.location.href = '/registro-verifi.html';
                } else {
                    if (finalRole === 'admin') window.location.href = '/admin/index.html';
                    else if (isPrestadorFinal) window.location.href = '/trabajador/index.html';
                    else window.location.href = '/cliente/index.html';
                }
            }, 1500);

        } catch (err: any) {
            console.error('Error updating profile:', err);
            if (alertMsg) {
                alertMsg.textContent = "Error al actualizar: " + (err.message || 'Error de conexión');
                alertMsg.classList.add('alert-danger');
                alertMsg.classList.remove('d-none', 'alert-success');
            }
            btnSave.disabled = false;
            btnSave.innerHTML = originalBtnHtml;
        }
    });
});
