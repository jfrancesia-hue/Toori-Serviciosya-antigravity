import { supabase } from './supabase';

document.addEventListener('DOMContentLoaded', async () => {
    const loader = document.getElementById('page-loader');
    const content = document.getElementById('main-content');
    const form = document.getElementById('solicitar-form') as HTMLFormElement;
    const btnSubmit = document.getElementById('btn-submit-req') as HTMLButtonElement;
    const alertBox = document.getElementById('reg-alert');

    // Inputs
    const inputNombre = document.getElementById('reg-nombre') as HTMLInputElement;
    const inputTelefono = document.getElementById('reg-telefono') as HTMLInputElement;
    const inputProfesion = document.getElementById('search-profesion') as HTMLInputElement;
    const inputProfesionHidden = document.getElementById('reg-profesion') as HTMLInputElement;
    const inputCiudad = document.getElementById('reg-ciudad') as HTMLInputElement;
    const inputLat = document.getElementById('reg-lat') as HTMLInputElement;
    const inputLon = document.getElementById('reg-lon') as HTMLInputElement;
    const inputDescripcion = document.getElementById('reg-descripcion') as HTMLTextAreaElement;
    const btnGps = document.getElementById('btn-gps');
    const catSuggestions = document.getElementById('category-suggestions');
    const locSuggestions = document.getElementById('loc-suggestions');

    const WHATSAPP_PHONE = "5493512139046";

    // 1. Check Auth & Load Initial Data
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (!session || authError) {
        window.location.href = '/login.html';
        return;
    }

    async function loadUserData() {
        try {
            const { data: perfil } = await supabase
                .from('sy_perfiles')
                .select('*')
                .eq('id', session!.user.id)
                .single();

            const meta = session!.user.user_metadata;

            if (perfil) {
                if (perfil.nombre) inputNombre.value = perfil.nombre;
                if (perfil.telefono) inputTelefono.value = perfil.telefono;
                if (perfil.zona_frecuente) inputCiudad.value = perfil.zona_frecuente;
            } else {
                const fallbackName = meta?.full_name || meta?.nombre || meta?.name || '';
                inputNombre.value = fallbackName;
                inputTelefono.value = meta?.telefono || '';
            }

            // Reveal content
            if (loader) loader.classList.add('d-none');
            if (content) content.classList.remove('d-none');

        } catch (err) {
            console.error('Error loading data:', err);
            if (loader) loader.classList.add('d-none');
            if (content) content.classList.remove('d-none');
        }
    }

    await loadUserData();

    // 2. Category Search Logic (Reused from registro.ts)
    const popularCategories = ['Limpieza', 'Plomería', 'Electricidad', 'Gas', 'Pintura', 'Jardinería', 'Albañilería'];
    let categoriesList: string[] = [];
    let isCatsLoaded = false;
    let catTimer: any = null;

    async function fetchCategories() {
        if (isCatsLoaded && categoriesList.length > popularCategories.length) return categoriesList;
        try {
            const { data, error } = await supabase.from('servicios').select('nombre').order('nombre');
            if (error) throw error;
            const fetched = data.map((d: any) => d.nombre.trim()).filter((n: string) => n.toLowerCase() !== 'niñera');
            categoriesList = Array.from(new Set([...popularCategories, ...fetched])).sort();
            isCatsLoaded = true;
            return categoriesList;
        } catch (e) {
            return popularCategories;
        }
    }

    function renderCategorySuggestions(cats: string[]) {
        if (!catSuggestions) return;
        catSuggestions.innerHTML = cats.map(c => `<div class="cat-item" data-value="${c}">${c}</div>`).join('');
        catSuggestions.style.display = cats.length > 0 ? 'block' : 'none';

        catSuggestions.querySelectorAll('.cat-item').forEach(el => {
            el.addEventListener('click', () => {
                const val = el.getAttribute('data-value') || '';
                inputProfesion.value = val;
                inputProfesionHidden.value = val;
                catSuggestions.style.display = 'none';
            });
        });
    }

    inputProfesion?.addEventListener('input', () => {
        const query = inputProfesion.value.trim().toLowerCase();
        inputProfesionHidden.value = inputProfesion.value.trim();
        if (catTimer) clearTimeout(catTimer);
        if (!query) {
            catSuggestions!.style.display = 'none';
            return;
        }
        catTimer = setTimeout(async () => {
            const all = await fetchCategories();
            const filtered = all.filter(c => c.toLowerCase().includes(query)).slice(0, 10);
            renderCategorySuggestions(filtered);
        }, 300);
    });

    inputProfesion?.addEventListener('focus', () => {
        if (!inputProfesion.value.trim()) {
            renderCategorySuggestions(popularCategories);
        }
    });

    // 3. Location Logic (Reused from registro.ts)
    let locTimer: any = null;
    inputCiudad?.addEventListener('input', () => {
        const query = inputCiudad.value.trim();
        if (locTimer) clearTimeout(locTimer);
        if (query.length < 3) {
            locSuggestions!.style.display = 'none';
            return;
        }
        locTimer = setTimeout(async () => {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=ar&limit=5&addressdetails=1&q=${encodeURIComponent(query)}`);
                const data = await res.json();
                if (locSuggestions) {
                    locSuggestions.innerHTML = data.map((item: any) => {
                        const city = item.address.city || item.address.town || item.address.village || item.address.municipality || item.display_name;
                        const state = item.address.state || '';
                        const label = state ? `${city}, ${state}` : city;
                        return `<div class="loc-item" data-lat="${item.lat}" data-lon="${item.lon}" data-label="${label}">${label}</div>`;
                    }).join('');
                    locSuggestions.style.display = 'block';
                    locSuggestions.querySelectorAll('.loc-item').forEach(el => {
                        el.addEventListener('click', () => {
                            inputCiudad.value = el.getAttribute('data-label') || '';
                            inputLat.value = el.getAttribute('data-lat') || '';
                            inputLon.value = el.getAttribute('data-lon') || '';
                            locSuggestions.style.display = 'none';
                        });
                    });
                }
            } catch (err) { }
        }, 300);
    });

    btnGps?.addEventListener('click', () => {
        if (!navigator.geolocation) return alert('GPS no disponible.');
        btnGps.innerHTML = '<i class="bi bi-arrow-repeat spin"></i>';
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude: lat, longitude: lon } = pos.coords;
            inputLat.value = lat.toString();
            inputLon.value = lon.toString();
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
                const data = await res.json();
                inputCiudad.value = data.address.city || data.address.town || data.display_name;
            } catch (e) { }
            btnGps.innerHTML = '<i class="bi bi-crosshairs"></i>';
        }, () => {
            btnGps.innerHTML = '<i class="bi bi-crosshairs"></i>';
            alert('No se pudo obtener el GPS.');
        });
    });

    // 4. Submit logic
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!alertBox) return;

        const category = inputProfesionHidden.value.trim();
        if (!category) {
            alert('Por favor elegí una categoría de la lista.');
            return;
        }

        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Procesando...';

        try {
            const { data: pedido, error } = await supabase
                .from('sy_pedidos')
                .insert([{
                    categoria: category,
                    zona: inputCiudad.value.trim(),
                    descripcion: inputDescripcion.value.trim(),
                    estado: 'pendiente',
                    cliente_id: session!.user.id
                }])
                .select('id')
                .single();

            if (error) throw error;

            const ticketId = pedido.id.split('-')[0].toUpperCase();
            const msg = `Hola! Solicité un servicio.\n\n🎫 *Ticket #T-${ticketId}*\nServicio: ${category}\nZona: ${inputCiudad.value}\nDescripción: ${inputDescripcion.value}\n\nContacto: ${inputNombre.value} (${inputTelefono.value})`;
            const waUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(msg)}`;

            alertBox.className = 'alert alert-success mt-3';
            alertBox.innerHTML = '¡Pedido creado con éxito! Abrí WhatsApp para finalizar la gestión.';
            alertBox.classList.remove('d-none');

            // Open whatsapp
            window.open(waUrl, '_blank');
            form.reset();

        } catch (err: any) {
            console.error(err);
            alertBox.className = 'alert alert-danger mt-3';
            alertBox.innerHTML = 'Error: ' + (err.message || 'Error de conexión');
            alertBox.classList.remove('d-none');
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '<i class="bi bi-whatsapp me-2"></i> Solicitar y Contactar por WhatsApp';
        }
    });

    // Global click listener to close suggestions
    document.addEventListener('click', (e) => {
        if (!inputProfesion.contains(e.target as Node)) catSuggestions!.style.display = 'none';
        if (!inputCiudad.contains(e.target as Node)) locSuggestions!.style.display = 'none';
    });
});
