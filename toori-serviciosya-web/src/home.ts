import { supabase } from './supabase';
import { buildWhatsAppUrl } from './utils/whatsapp';

document.addEventListener('DOMContentLoaded', async () => {
    const categoriesContainer = document.getElementById('categories-container');
    const WHATSAPP_PHONE = "5493834035427"; // From contratar.html

    // 1. Fetch Dynamic Categories
    const loadCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('servicios')
                .select('categoria')
                .eq('estado', 'activo');

            if (error) throw error;

            if (data && categoriesContainer) {
                const blacklist = ['niñera', 'ninera'];
                const uniqueCategories = [...new Set(data
                    .map(s => s.categoria?.trim())
                    .filter(c => c && !blacklist.includes(c.toLowerCase()))
                )].sort();

                if (uniqueCategories.length > 0) {
                    // Clear current placeholders
                    categoriesContainer.innerHTML = '';

                    uniqueCategories.forEach(cat => {
                        const card = document.createElement('div');
                        card.className = 'card-premium text-center';
                        card.style.padding = '30px 20px';

                        // Icon mapping (simple)
                        let icon = 'bi-star';
                        const c = cat.toLowerCase();
                        if (c.includes('limp')) icon = 'bi-house-heart';
                        else if (c.includes('plom')) icon = 'bi-tools';
                        else if (c.includes('elec')) icon = 'bi-plug-fill';
                        else if (c.includes('gas')) icon = 'bi-fire';
                        else if (c.includes('pint')) icon = 'bi-droplet-fill';
                        else if (c.includes('jard')) icon = 'bi-tree-fill';
                        else if (c.includes('alba')) icon = 'bi-bricks';

                        card.innerHTML = `
                            <div style="font-size: 2.5rem; color: var(--toori-blue); margin-bottom: 1rem;"><i class="bi ${icon}"></i></div>
                            <h4>${cat}</h4>
                            <p class="text-muted mb-3" style="font-size: 0.85rem;">Servicio Gestionado</p>
                            <button class="btn btn-primary dynamic-whatsapp-btn" data-category="${cat}"
                                style="padding: 10px 20px; font-size: 0.9rem;">Iniciar gestión</button>
                        `;
                        categoriesContainer.appendChild(card);
                    });

                    // Add events to new buttons
                    setupWhatsAppEvents();
                }
            }
        } catch (err) {
            console.error("Error loading categories:", err);
        }
    };

    const setupWhatsAppEvents = () => {
        const btns = document.querySelectorAll('.dynamic-whatsapp-btn, .whatsapp-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const category = (btn as HTMLElement).dataset.category;

                // Get city from intent if exists
                let city = '';
                try {
                    const intent = localStorage.getItem('sy_intent');
                    if (intent) {
                        const parsed = JSON.parse(intent);
                        city = parsed.loc || '';
                    }
                } catch (e) { }

                const msg = `Hola! Quiero iniciar una gestión.\nServicio: ${category}\nCiudad/Zona: ${city || 'No indicado'}\nDescripción: `;
                const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(msg)}`;
                window.open(url, '_blank');
            });
        });
    };

    // 2. Initial load
    await loadCategories();

    // 3. Demo logic for "Ingresá"
    const btnIngresar = document.getElementById('btn-ingresar');
    btnIngresar?.addEventListener('click', (e) => {
        e.preventDefault();
        alert('El sistema de login está en desarrollo. ¡Estamos trabajando para conectarte mejor!');
    });

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
