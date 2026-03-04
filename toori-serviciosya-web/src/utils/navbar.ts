import { supabase } from '../supabase';

document.addEventListener('DOMContentLoaded', async () => {
    const navMenu = document.querySelector('.nav-menu');
    if (!navMenu) return;

    // Check for existing "Ingresá" link and mark it for replacement
    const loginLink = Array.from(navMenu.querySelectorAll('.nav-link')).find(el => el.textContent?.trim() === 'Ingresá');

    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        // Remove login link if it exists
        if (loginLink) loginLink.remove();

        try {
            const { data: perfil } = await supabase
                .from('sy_perfiles')
                .select('nombre, foto_url, rol')
                .eq('id', session.user.id)
                .single();

            // Fallback strategy for Name:
            // 1. Database perfil.nombre
            // 2. Auth user_metadata (full_name, name, or email)
            // 3. Static fallback
            const meta = session.user.user_metadata;
            const fallbackName = meta?.full_name || meta?.nombre || meta?.name || session.user.email?.split('@')[0] || 'Mi Perfil';
            const nombreCompleto = perfil?.nombre || fallbackName;
            const nombre = nombreCompleto.split(' ')[0];

            const foto = perfil?.foto_url || meta?.avatar_url || `https://ui-avatars.com/api/?name=${nombre}&background=3ba8e0&color=fff`;

            // Define panel link based on role
            // Fallback for role: 1. sy_perfiles, 2. user_metadata, 3. /perfil.html if missing
            const role = perfil?.rol || meta?.role || (perfil ? 'cliente' : 'none');

            let panelLink = '/';
            if (role === 'admin') panelLink = '/admin/index.html';
            else if (role === 'prestador') panelLink = '/trabajador/index.html';
            else if (role === 'cliente') panelLink = '/cliente/index.html';
            else panelLink = '/perfil.html';

            const profileHtml = `
                <div class="nav-profile" id="profile-trigger">
                    <img src="${foto}" alt="${nombre}">
                    <span class="user-name d-none d-md-inline">${nombre}</span>
                    <i class="bi bi-chevron-down small"></i>
                    
                    <div class="profile-dropdown" id="profile-dropdown">
                        <div class="px-3 py-2 border-bottom mb-2 d-md-none">
                            <small class="text-muted d-block">Conectado como</small>
                            <span class="fw-bold">${nombre}</span>
                        </div>
                        <a href="${panelLink}" class="dropdown-item">
                            <i class="bi ${role === 'none' ? 'bi-person-plus-fill' : 'bi-grid-fill'}"></i> 
                            ${role === 'none' ? 'Completar Registro' : 'Mi Panel'}
                        </a>
                        <a href="/perfil.html" class="dropdown-item">
                            <i class="bi bi-gear-fill"></i> Mi Configuración
                        </a>
                        <div class="dropdown-divider"></div>
                        <a href="#" class="dropdown-item logout" id="btn-navbar-logout">
                            <i class="bi bi-box-arrow-right"></i> Cerrar Sesión
                        </a>
                    </div>
                </div>
            `;

            navMenu.insertAdjacentHTML('beforeend', profileHtml);

            // Toggle Dropdown
            const trigger = document.getElementById('profile-trigger');
            const dropdown = document.getElementById('profile-dropdown');

            trigger?.addEventListener('click', (e) => {
                // If the click was on a link inside the dropdown, don't stop propagation
                // and don't toggle (let the browser navigate)
                if ((e.target as HTMLElement).closest('.dropdown-item')) return;

                e.stopPropagation();
                dropdown?.classList.toggle('show');
            });

            document.addEventListener('click', () => {
                dropdown?.classList.remove('show');
            });

            // Logout Logic
            document.getElementById('btn-navbar-logout')?.addEventListener('click', async (e) => {
                e.preventDefault();
                await supabase.auth.signOut();
                window.location.href = '/';
            });

        } catch (err) {
            console.error('Error loading navbar profile:', err);
        }
    }
});
