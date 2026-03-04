import { supabase } from './supabase';
import { buildWhatsAppUrl } from './utils/whatsapp';

document.addEventListener('DOMContentLoaded', async () => {
    const categoriesContainer = document.getElementById('categories-container');
    const WHATSAPP_PHONE = "5493512139046";

    // 1. Static Top Categories
    const loadCategories = async () => {
        try {
            const staticCategories = [
                "Jardinería",
                "Servicio doméstico temporario",
                "Limpieza corporativa",
                "Refrigeración",
                "Plomería / Gasista",
                "Mantenimiento general",
                "Electricidad"
            ];

            if (categoriesContainer) {
                // Clear current placeholders
                categoriesContainer.innerHTML = '';

                staticCategories.forEach(cat => {
                    const card = document.createElement('div');
                    card.className = 'card-premium text-center';
                    card.style.padding = '30px 20px';

                    // Icon mapping (simple)
                    let icon = 'bi-star';
                    const c = cat.toLowerCase();
                    if (c.includes('limp') || c.includes('doméstico')) icon = 'bi-house-heart';
                    else if (c.includes('plom')) icon = 'bi-tools';
                    else if (c.includes('elec')) icon = 'bi-plug-fill';
                    else if (c.includes('gas')) icon = 'bi-fire';
                    else if (c.includes('refrigeración')) icon = 'bi-snow';
                    else if (c.includes('jard')) icon = 'bi-tree-fill';
                    else if (c.includes('mantenimiento')) icon = 'bi-wrench-adjustable';

                    card.innerHTML = `
                        <div style="font-size: 2.5rem; color: var(--toori-purple); margin-bottom: 1rem;"><i class="bi ${icon}"></i></div>
                        <h4>${cat}</h4>
                        <p class="text-muted mb-3" style="font-size: 0.85rem;">Servicio Gestionado</p>
                        <button class="btn btn-primary dynamic-whatsapp-btn" data-category="${cat}"
                            style="padding: 10px 20px; font-size: 0.9rem;">Iniciar gestión</button>
                    `;
                    categoriesContainer.appendChild(card);
                });

                // Add "Ver todas" button
                const verTodasCard = document.createElement('div');
                verTodasCard.className = 'card-premium text-center';
                verTodasCard.style.padding = '30px 20px';
                verTodasCard.innerHTML = `
                    <div style="font-size: 2.5rem; color: var(--toori-purple); margin-bottom: 1rem;"><i class="bi bi-grid-fill"></i></div>
                    <h4>Ver todas</h4>
                    <p class="text-muted mb-3" style="font-size: 0.85rem;">Explorar más servicios</p>
                    <a href="/categorias.html" class="btn btn-secondary w-100"
                        style="padding: 10px 20px; font-size: 0.9rem;">Catálogo completo</a>
                `;
                categoriesContainer.appendChild(verTodasCard);

                // Add events to new buttons
                setupWhatsAppEvents();
            }
        } catch (err) {
            console.error("Error loading categories:", err);
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
        const btns = document.querySelectorAll('.dynamic-whatsapp-btn, .whatsapp-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();

                // Prevent multiple clicks by disabling button
                const htmlBtn = btn as HTMLButtonElement;
                const originalText = htmlBtn.innerHTML;
                htmlBtn.disabled = true;
                htmlBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Procesando...';

                const category = htmlBtn.dataset.category || 'Servicio General';

                try {
                    if (category) {
                        await trackClick(category, 'home_page');
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
                            descripcion: 'Pedido iniciado desde la web frontal.',
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

                    // Restore button and open WA
                    htmlBtn.disabled = false;
                    htmlBtn.innerHTML = originalText;
                    window.open(url, '_blank');

                } catch (err) {
                    htmlBtn.disabled = false;
                    htmlBtn.innerHTML = originalText;
                    alert('Ocurrió un error al procesar tu solicitud. Por favor intenta de nuevo.');
                }
            });
        });
    };

    // 2. Initial load
    await loadCategories();


    // 4. Demo logic for "Agendar una demo"
    const demoButtons = document.querySelectorAll('a[href="#"], .btn-secondary');
    demoButtons.forEach(btn => {
        if (btn.textContent?.includes('Agendar una demo')) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const msg = '¡Hola! Me gustaría agendar una demo de Toori ServiciosYa.';
                const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(msg)}`;
                window.open(url, '_blank');
            });
        }
    });
});
