import { supabase } from './supabase';

document.addEventListener('DOMContentLoaded', async () => {
    const categoriesContainer = document.getElementById('all-categories-container');
    const WHATSAPP_PHONE = "5493512139046";


    const loadCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('categorias')
                .select('id, nombre')
                .order('nombre');

            if (error) throw error;

            if (data && categoriesContainer) {
                if (data.length > 0) {
                    // Deduplicate data by category name
                    const uniqueNames = new Set<string>();
                    const uniqueCategories = data.filter(cat => {
                        if (!cat.nombre) return false;
                        const lowerName = cat.nombre.trim().toLowerCase();
                        if (uniqueNames.has(lowerName)) return false;
                        uniqueNames.add(lowerName);
                        return true;
                    });

                    // Clear loading state
                    categoriesContainer.innerHTML = '';

                    uniqueCategories.forEach(cat => {
                        const card = document.createElement('div');
                        card.className = 'card-premium text-center';
                        card.style.padding = '30px 20px';

                        // Icon mapping logic (replicated for consistency)
                        let icon = 'bi-star';
                        const c = cat.nombre.toLowerCase();
                        if (c.includes('limp') || c.includes('doméstico')) icon = 'bi-house-heart';
                        else if (c.includes('plom')) icon = 'bi-tools';
                        else if (c.includes('elec')) icon = 'bi-plug-fill';
                        else if (c.includes('gas')) icon = 'bi-fire';
                        else if (c.includes('pint')) icon = 'bi-droplet-fill';
                        else if (c.includes('jard')) icon = 'bi-tree-fill';
                        else if (c.includes('alba')) icon = 'bi-bricks';
                        else if (c.includes('mantenimiento')) icon = 'bi-wrench-adjustable';
                        else if (c.includes('refrigeración')) icon = 'bi-snow';

                        card.innerHTML = `
                            <div style="font-size: 2.5rem; color: var(--toori-purple); margin-bottom: 1rem;"><i class="bi ${icon}"></i></div>
                            <h4>${cat.nombre}</h4>
                            <p class="text-muted mb-3" style="font-size: 0.85rem;">Servicio Gestionado</p>
                            <button class="btn btn-primary dynamic-whatsapp-btn" data-category="${cat.nombre}"
                                style="padding: 10px 20px; font-size: 0.9rem;">Iniciar gestión</button>
                        `;
                        categoriesContainer.appendChild(card);
                    });

                    // Add click events
                    setupWhatsAppEvents();
                } else {
                    categoriesContainer.innerHTML = '<p class="text-center w-100" style="color: #666;">No hay categorías disponibles en este momento.</p>';
                }
            }
        } catch (err: any) {
            console.error("Error loading categories:", err);
            if (categoriesContainer) {
                categoriesContainer.innerHTML = `<p class="text-center w-100" style="color: red;">Ocurrió un error al cargar las categorías. Detalle: ${err.message || JSON.stringify(err)}</p>`;
            }
        }
    };

    const trackClick = async (category: string, origin: string) => {
        try {
            await supabase.from('clics_categorias').insert([{ categoria: category, origen: origin }]);
        } catch (e) {
            console.error('Tracking error:', e);
        }
    };

    let userLocationLink = '';

    // Ask for location on page load
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                    const data = await res.json();
                    let city = data.address?.city || data.address?.town || data.address?.village || data.address?.state_district || 'Ubicación Desconocida';
                    userLocationLink = `${city} (https://maps.google.com/?q=${lat},${lon})`;
                } catch (e) {
                    console.log('Error reverse geocoding', e);
                    userLocationLink = `https://maps.google.com/?q=${lat},${lon}`;
                }
            },
            (error) => {
                console.log('Geolocalización denegada o no disponible', error);
            }
        );
    }

    const setupWhatsAppEvents = () => {
        const btns = document.querySelectorAll('.dynamic-whatsapp-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();

                // Prevent multiple clicks
                const htmlBtn = btn as HTMLButtonElement;
                const originalText = htmlBtn.innerHTML;
                htmlBtn.disabled = true;
                htmlBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

                const category = htmlBtn.dataset.category || 'Servicio General';

                try {
                    // Track the click before opening WA
                    if (category) {
                        await trackClick(category, 'categorias_page');
                    }

                    // Get city from intent if exists
                    let city = '';
                    try {
                        const intent = localStorage.getItem('sy_intent');
                        if (intent) {
                            const parsed = JSON.parse(intent);
                            city = parsed.loc || '';
                        }
                    } catch (e) { }

                    // Priority 1: User intent / profile city
                    // Priority 2: Geolocation browser link
                    // Priority 3: Empty string
                    let zonaFinal = city;
                    if (!zonaFinal && userLocationLink) {
                        zonaFinal = `Ubicación actual: ${userLocationLink}`;
                    }

                    // 1. Get Auth Session
                    const { data: { session } } = await supabase.auth.getSession();
                    const clienteId = session?.user?.id || null;

                    // 2. Insert Order into sy_pedidos
                    const { data: pedidoData, error: pedidoError } = await supabase
                        .from('sy_pedidos')
                        .insert([{
                            categoria: category,
                            zona: zonaFinal || 'No especificada',
                            descripcion: 'Pedido iniciado desde la página de Categorías.',
                            estado: 'pendiente',
                            cliente_id: clienteId
                        }])
                        .select('id')
                        .single();

                    if (pedidoError) {
                        console.error('Error insertando pedido:', pedidoError);
                        throw pedidoError;
                    }

                    const ticketId = pedidoData.id.split('-')[0].toUpperCase();

                    // 2. Build explicit Message with Ticket ID
                    const msg = `Hola! Quiero contratar un servicio.\n\n🎫 *Ticket #T-${ticketId}*\nServicio: ${category}\nZona: ${zonaFinal}\nDescripción del problema: \n\nVengo desde la web de Toori ServiciosYa.`;
                    const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(msg)}`;

                    htmlBtn.disabled = false;
                    htmlBtn.innerHTML = originalText;
                    window.open(url, '_blank');

                } catch (err) {
                    htmlBtn.disabled = false;
                    htmlBtn.innerHTML = originalText;
                    alert('Ocurrió un error al procesar tu solicitud.');
                }
            });
        });
    };

    // Load categories immediately
    await loadCategories();
});
