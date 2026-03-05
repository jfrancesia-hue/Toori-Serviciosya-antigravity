import { supabase } from '../supabase';

document.addEventListener('DOMContentLoaded', async () => {
    const navMenu = document.querySelector('.nav-menu');
    if (!navMenu) return;

    // Check for existing "Ingresá" link and mark it for replacement
    const loginLink = Array.from(navMenu.querySelectorAll('.nav-link')).find(el => el.textContent?.trim() === 'Ingresá');

    // Force session refresh to bypass stubborn localStorage caches
    await supabase.auth.refreshSession();
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        // Remove login link if it exists
        if (loginLink) loginLink.remove();

        try {
            const { data: perfil } = await supabase
                .from('sy_perfiles')
                .select('nombre, foto_url, rol, oficios')
                .eq('id', session.user.id)
                .single();

            // ... (rest of fallback name/photo logic) ...
            const meta = session.user.user_metadata;
            const fallbackName = meta?.full_name || meta?.nombre || meta?.name || session.user.email?.split('@')[0] || 'Mi Perfil';
            const nombreCompleto = perfil?.nombre || fallbackName;
            const nombre = nombreCompleto.split(' ')[0];

            // Avatar Logic Fix: Handle edge cases safely
            let rawFotoUrl = perfil?.foto_url;

            // Check if foto_url is a Supabase Storage path instead of a full URL
            if (rawFotoUrl && !rawFotoUrl.startsWith('http') && !rawFotoUrl.startsWith('data:')) {
                const { data: publicUrlData } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(rawFotoUrl);
                rawFotoUrl = publicUrlData?.publicUrl || rawFotoUrl;
            }

            let foto = rawFotoUrl || meta?.avatar_url || meta?.picture;
            if (!foto || foto.trim() === '') {
                foto = `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=3ba8e0&color=fff`;
            }

            const dbRol = perfil?.rol || meta?.role || (perfil ? 'cliente' : 'none');
            const rawRole = dbRol.toLowerCase();
            let role = rawRole;
            if (rawRole === 'worker' || rawRole === 'trabajador') role = 'prestador';

            // STRICT calculation for "hasOficios"
            // It only has oficios if it's an array with at least length 1. Otherwise it's false.
            let hasOficios = false;
            if (perfil?.oficios) {
                if (Array.isArray(perfil.oficios)) {
                    hasOficios = perfil.oficios.length > 0;
                } else if (typeof perfil.oficios === 'string' && perfil.oficios.trim() !== '') {
                    hasOficios = true;
                }
            }

            // Dynamic depth detection for relative paths
            const isInSubfolder = window.location.pathname.includes('/admin/') ||
                window.location.pathname.includes('/trabajador/') ||
                window.location.pathname.includes('/cliente/');
            const prefix = isInSubfolder ? '../' : './';

            let panelLink = prefix;
            let panelLabel = 'Mi Panel';
            let panelIcon = 'bi-grid-fill';

            if (role === 'admin') {
                panelLink = prefix + 'admin/index.html';
                panelLabel = 'Panel Admin';
            } else if (role === 'prestador') {
                if (hasOficios) {
                    panelLink = prefix + 'trabajador/index.html';
                } else {
                    panelLink = prefix + 'registro-verifi.html';
                    panelLabel = 'Completar Postulación';
                    panelIcon = 'bi-card-checklist';
                }
            } else if (role === 'cliente') {
                panelLink = prefix + 'cliente/index.html';
                panelLabel = 'Mi Panel';
                panelIcon = 'bi-person-badge';
            } else {
                // role === 'none' (New user)
                panelLink = prefix + 'perfil.html';
                panelLabel = 'Completar Perfil';
                panelIcon = 'bi-person-plus-fill';
            }

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
                            <i class="bi ${panelIcon}"></i> ${panelLabel}
                        </a>
                        <a href="${prefix}perfil.html" class="dropdown-item">
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

            // Mobile Menu Toggle
            const mobileMenuBtn = document.getElementById('mobile-menu-btn');
            const navMenuEl = document.getElementById('nav-menu');

            mobileMenuBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                navMenuEl?.classList.toggle('active');
                mobileMenuBtn.querySelector('i')?.classList.toggle('bi-list');
                mobileMenuBtn.querySelector('i')?.classList.toggle('bi-x');
            });

            // Close mobile menu on click outside or on a link
            document.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                if (!navMenuEl?.contains(target) && !mobileMenuBtn?.contains(target)) {
                    navMenuEl?.classList.remove('active');
                    mobileMenuBtn?.querySelector('i')?.classList.add('bi-list');
                    mobileMenuBtn?.querySelector('i')?.classList.remove('bi-x');
                }
            });

            navMenuEl?.querySelectorAll('.nav-link, .dropdown-item').forEach(link => {
                link.addEventListener('click', () => {
                    navMenuEl.classList.remove('active');
                    mobileMenuBtn?.querySelector('i')?.classList.add('bi-list');
                    mobileMenuBtn?.querySelector('i')?.classList.remove('bi-x');
                });
            });

        } catch (err) {
            console.error('Error loading navbar profile:', err);
        }
    }
});
