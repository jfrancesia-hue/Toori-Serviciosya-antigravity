import { supabase } from './supabase';

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const form = document.getElementById('registro-form') as HTMLFormElement;
    const btnSubmit = document.getElementById('btn-submit-reg') as HTMLButtonElement;
    const alertBox = document.getElementById('reg-alert');

    // Location Elements
    const cityInput = document.getElementById('reg-ciudad') as HTMLInputElement;
    const locSuggestions = document.getElementById('loc-suggestions');
    const latInput = document.getElementById('reg-lat') as HTMLInputElement;
    const lonInput = document.getElementById('reg-lon') as HTMLInputElement;
    const btnGps = document.getElementById('btn-gps');

    // File Preview
    const fotoInput = document.getElementById('foto-input') as HTMLInputElement;
    const fotoPreview = document.getElementById('foto-preview') as HTMLImageElement;

    // Category Elements
    const searchProfesion = document.getElementById('search-profesion') as HTMLInputElement;
    const btnVerTodas = document.getElementById('btn-ver-todas') as HTMLButtonElement;
    const catSuggestions = document.getElementById('category-suggestions');
    const inputProfesionHidden = document.getElementById('reg-profesion') as HTMLInputElement;

    let selectedFoto: File | null = null;
    let selectedAntecedentes: File | null = null;
    let selectedMatricula: File | null = null;

    // 1. Image Preview Logic
    fotoInput?.addEventListener('change', (e: any) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size < 50 * 1024) {
                alert('La foto es muy pequeña (mínimo 50kb recomendados).');
            }
            selectedFoto = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target && typeof e.target.result === 'string') {
                    fotoPreview.src = e.target.result;
                }
            };
            reader.readAsDataURL(file);
        }
    });

    // Capture other documents
    document.getElementById('doc-antecedentes')?.addEventListener('change', (e: any) => {
        selectedAntecedentes = e.target.files[0];
    });
    document.getElementById('doc-matricula')?.addEventListener('change', (e: any) => {
        selectedMatricula = e.target.files[0];
    });

    // -- Category Typeahead Logic --
    const popularCategories = ['Limpieza', 'Plomería', 'Electricidad', 'Gas', 'Pintura', 'Jardinería', 'Albañilería'];
    let categoriesList: string[] = [];
    let isCategoriesLoaded = false;
    let catTimer: any = null;

    async function fetchCategories() {
        if (isCategoriesLoaded && categoriesList.length > popularCategories.length) return categoriesList;
        try {
            const { data, error } = await supabase.from('servicios').select('nombre').order('nombre');
            if (error) throw error;

            // Filtrar categorías prohibidas legalmente y limpiar nombres
            const fetched = data
                .map((d: any) => d.nombre.trim())
                .filter((name: string) => name.toLowerCase() !== 'niñera');

            // Unión de populares y traídas de DB para no perder consistencia
            const combined = Array.from(new Set([...popularCategories, ...fetched]));
            categoriesList = combined.sort();

            isCategoriesLoaded = true;
            return categoriesList;
        } catch (e) {
            console.error('Error loading categories', e);
            return popularCategories;
        }
    }

    function renderCategorySuggestions(cats: string[], title: string = '') {
        if (!catSuggestions) return;

        let html = '';
        if (title) {
            html += `<div class="p-2 px-3 text-muted fw-bold border-bottom bg-light" style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">${title}</div>`;
        }

        if (cats.length === 0) {
            html += '<div class="p-3 text-center text-muted small">No se encontraron categorías.</div>';
        } else {
            html += cats.map(c => `<div class="loc-item cat-item" data-value="${c}">${c}</div>`).join('');
        }

        catSuggestions.innerHTML = html;

        catSuggestions.querySelectorAll('.cat-item').forEach(el => {
            el.addEventListener('click', () => {
                const val = el.getAttribute('data-value') || '';
                if (searchProfesion) searchProfesion.value = val;
                if (inputProfesionHidden) inputProfesionHidden.value = val;
                catSuggestions.style.display = 'none';
            });
        });

        catSuggestions.style.display = 'block';
    }

    searchProfesion?.addEventListener('input', () => {
        const query = searchProfesion.value.trim().toLowerCase();
        inputProfesionHidden.value = searchProfesion.value.trim();

        if (catTimer) clearTimeout(catTimer);

        if (query.length === 0) {
            if (catSuggestions) catSuggestions.style.display = 'none';
            return;
        }

        catTimer = setTimeout(async () => {
            if (catSuggestions) catSuggestions.innerHTML = '<div class="p-3 text-center text-muted small"><div class="spinner-border spinner-border-sm mb-1" role="status"></div></div>';
            catSuggestions!.style.display = 'block';

            const allCats = await fetchCategories();
            const filtered = allCats.filter(c => c.toLowerCase().includes(query)).slice(0, 10);
            renderCategorySuggestions(filtered);
        }, 300);
    });

    searchProfesion?.addEventListener('focus', () => {
        if (!searchProfesion.value.trim()) {
            renderCategorySuggestions(popularCategories, 'Categorías sugeridas');
        }
    });

    btnVerTodas?.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (catSuggestions?.style.display === 'block') {
            catSuggestions.style.display = 'none';
            return;
        }
        if (catSuggestions) catSuggestions.innerHTML = '<div class="p-3 text-center text-muted small"><div class="spinner-border spinner-border-sm mb-1" role="status"></div><br>Cargando...</div>';
        catSuggestions!.style.display = 'block';
        const allCats = await fetchCategories();
        renderCategorySuggestions(allCats, 'Todas las categorías');
    });

    // 2. Nominatim Location Logic
    let locTimer: any = null;
    cityInput?.addEventListener('input', () => {
        const query = cityInput.value.trim();
        if (locTimer) clearTimeout(locTimer);
        if (query.length < 3) {
            if (locSuggestions) locSuggestions.style.display = 'none';
            return;
        }

        locTimer = setTimeout(async () => {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=ar&limit=6&addressdetails=1&q=${encodeURIComponent(query)}`);
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
                            const label = el.getAttribute('data-label') || '';
                            const lat = el.getAttribute('data-lat') || '';
                            const lon = el.getAttribute('data-lon') || '';
                            cityInput.value = label;
                            latInput.value = lat;
                            lonInput.value = lon;
                            locSuggestions.style.display = 'none';
                        });
                    });
                }
            } catch (err) {
                console.error("Nominatim error:", err);
            }
        }, 300);
    });

    // GPS Logic
    btnGps?.addEventListener('click', () => {
        if (!navigator.geolocation) return alert('Geolocalización no soportada.');
        btnGps.innerHTML = '<i class="bi bi-arrow-repeat spin"></i>';
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
                const data = await res.json();
                const city = data.address.city || data.address.town || data.address.village || "Ubicación detectada";
                cityInput.value = city;
                latInput.value = pos.coords.latitude.toString();
                lonInput.value = pos.coords.longitude.toString();
            } finally {
                btnGps.innerHTML = '<i class="bi bi-crosshairs"></i>';
            }
        }, () => {
            btnGps.innerHTML = '<i class="bi bi-crosshairs"></i>';
            alert('No se pudo obtener el GPS.');
        });
    });

    // 3. Storage Helper
    const uploadFile = async (bucket: string, folder: string, file: File, dni: string, prefix: string = '') => {
        const ext = file.name.split('.').pop();
        const timestamp = Date.now();
        const fileName = `${prefix}${timestamp}.${ext}`;
        const filePath = `${dni}/${fileName}`;

        const { error, data } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, { upsert: true });

        if (error) throw error;

        const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return publicUrl.publicUrl;
    };

    // 4. Form Submit
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!alertBox) return;

        // Validations
        const dni = (document.getElementById('reg-dni') as HTMLInputElement).value.trim().replace(/\./g, '');
        if (!selectedFoto) {
            alertBox.className = 'alert alert-danger mt-3';
            alertBox.innerHTML = '¡La foto de perfil es obligatoria!';
            alertBox.style.display = 'block';
            return;
        }

        const profession = inputProfesionHidden.value.trim();
        if (!profession) {
            alertBox.className = 'alert alert-danger mt-3';
            alertBox.innerHTML = '¡Por favor seleccioná un servicio u oficio de la lista!';
            alertBox.style.display = 'block';
            return;
        }

        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<i class="bi bi-arrow-repeat spin"></i> Procesando...`;
        alertBox.style.display = 'none';

        try {
            const nombreCompleto = (document.getElementById('reg-nombre') as HTMLInputElement).value.trim();
            const parts = nombreCompleto.split(' ');
            const nombre = parts[0];
            const apellido = parts.slice(1).join(' ');

            // Upload Files
            let fotoUrl = await uploadFile('avatars', '', selectedFoto, dni);
            let docAntecedentesUrl = null;
            let docMatriculaUrl = null;

            if (selectedAntecedentes) {
                docAntecedentesUrl = await uploadFile('verificaciones', '', selectedAntecedentes, dni, 'antecedentes_');
            }
            if (selectedMatricula) {
                docMatriculaUrl = await uploadFile('verificaciones', '', selectedMatricula, dni, 'matricula_');
            }

            const lat = parseFloat(latInput.value);
            const lon = parseFloat(lonInput.value);

            // Fetch User Auth
            const email = (document.getElementById('reg-email') as HTMLInputElement).value.trim();
            const password = (document.getElementById('reg-password') as HTMLInputElement).value;

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password
            });

            if (authError) throw authError;

            const userId = authData?.user?.id;
            if (!userId) throw new Error("No se pudo obtener el ID de registro. Verifica los permisos de Supabase Auth.");

            let telefonoCrudo = (document.getElementById('reg-telefono') as HTMLInputElement).value.trim().replace(/\D/g, '');
            // Formatear a estándar WhatsApp Argentina (549 + área + número sin 15)
            // Asumimos que la gente puso el número puro ej 1123456789 (10 dígitos en Arg)
            if (!telefonoCrudo.startsWith('54') && !telefonoCrudo.startsWith('549')) {
                // Si alguien puso el 0 inicial del área, se lo sacamos
                if (telefonoCrudo.startsWith('0')) telefonoCrudo = telefonoCrudo.substring(1);
                telefonoCrudo = '549' + telefonoCrudo;
            }

            const userData = {
                id: userId,
                rol: 'prestador',
                dni,
                nombre: nombreCompleto, // Saving full name to match other components
                telefono: telefonoCrudo,
                oficios: [profession], // Keeping it as JSON array for future-proofing
                zona_frecuente: cityInput.value,
                // Additional specific fields:
                edad: parseInt((document.getElementById('reg-edad') as HTMLInputElement).value),
                antiguedad: parseFloat((document.getElementById('reg-antiguedad') as HTMLInputElement).value),
                antecedentes: (document.getElementById('reg-antecedentes') as HTMLTextAreaElement).value,
                latitud: lat,
                longitud: lon,
                foto_url: fotoUrl,
                antecedentes_url: docAntecedentesUrl,
                matricula_url: docMatriculaUrl,
                verificado: false // REQUERIMIENTO: La verificación ahora es un proceso de auditoría manual del Admin.
            };

            // 1. Upsert into isolated specific sy_perfiles table
            const { error: profileError } = await supabase
                .from('sy_perfiles')
                .upsert(userData)
                .select();

            if (profileError) throw profileError;

            // Success and Redirect Flow
            alertBox.className = 'alert alert-success mt-3 shadow-sm py-4';
            alertBox.innerHTML = `
                <div class="text-center">
                    <i class="bi bi-check-circle-fill h2 d-block mb-3"></i>
                    <h5 class="fw-bold">¡Tu servicio se ha publicado correctamente!</h5>
                    <p class="mb-0 small opacity-75">Tu perfil está siendo procesado. Serás redirigido al inicio en unos segundos...</p>
                </div>
            `;
            alertBox.style.display = 'block';

            // Wait 3 seconds before redirecting to Home
            setTimeout(() => {
                window.location.href = '/';
            }, 3000);

        } catch (err: any) {
            console.error("Critical error in registration:", err);
            alertBox.className = 'alert alert-danger mt-3';
            alertBox.innerHTML = `Hubo un error: ${err.message || 'Inténtalo más tarde.'}`;
            alertBox.style.display = 'block';
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = 'Enviar mi postulación';
        }
    });

    // Close suggestions on click outside
    document.addEventListener('click', (e) => {
        if (!cityInput?.contains(e.target as Node) && !locSuggestions?.contains(e.target as Node)) {
            if (locSuggestions) locSuggestions.style.display = 'none';
        }
        if (!searchProfesion?.contains(e.target as Node) && !btnVerTodas?.contains(e.target as Node) && !catSuggestions?.contains(e.target as Node)) {
            if (catSuggestions) catSuggestions.style.display = 'none';
        }
    });
});
