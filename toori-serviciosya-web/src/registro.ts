import { supabase } from './supabase';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Image Preview
    const fotoInput = document.getElementById('foto-input') as HTMLInputElement;
    const fotoPreview = document.getElementById('foto-preview') as HTMLImageElement;
    let selectedFile: File | null = null;

    fotoInput?.addEventListener('change', (e: any) => {
        const file = e.target.files[0];
        if (file) {
            selectedFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target && typeof e.target.result === 'string') {
                    fotoPreview.src = e.target.result;
                }
            };
            reader.readAsDataURL(file);
        }
    });

    // 2. Form Submission
    const form = document.getElementById('registro-form');
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = document.getElementById('btn-submit-reg') as HTMLButtonElement;
        const alertBox = document.getElementById('reg-alert');
        if (!btn || !alertBox) return;

        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Guardando...`;
        alertBox.className = 'alert mt-3 d-none';

        try {
            // Get form values
            const nombreCompleto = (document.getElementById('reg-nombre') as HTMLInputElement).value;
            const edad = (document.getElementById('reg-edad') as HTMLInputElement).value;
            const telefono = (document.getElementById('reg-telefono') as HTMLInputElement).value;
            const profesion = (document.getElementById('reg-profesion') as HTMLInputElement).value;
            const dni = (document.getElementById('reg-dni') as HTMLInputElement).value;
            const ciudad = (document.getElementById('reg-ciudad') as HTMLInputElement).value;
            const pais = (document.getElementById('reg-pais') as HTMLInputElement).value;
            const antiguedad = (document.getElementById('reg-antiguedad') as HTMLInputElement).value;
            const antecedentes = (document.getElementById('reg-antecedentes') as HTMLTextAreaElement).value;
            const matricula = (document.getElementById('reg-matricula') as HTMLInputElement).checked;
            const terminos = (document.getElementById('reg-terminos') as HTMLInputElement).checked;

            if (!terminos) throw new Error("Debes aceptar los términos y condiciones.");

            // Split full name into nombre and apellido
            const parts = nombreCompleto.trim().split(' ');
            const nombre = parts[0] || '';
            const apellido = parts.slice(1).join(' ') || '';

            let foto_url = null;

            // 3. Upload photo to Supabase Storage 'avatars'
            if (selectedFile) {
                const fileExt = selectedFile.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `verificados/${fileName}`; // Put in a subfolder or root

                const { error: uploadError, data: uploadData } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, selectedFile);

                if (uploadError) {
                    console.error("Error subiendo foto:", uploadError);
                    throw new Error("No se pudo subir la foto de perfil. Verifica que el bucket 'avatars' exista y sea público.");
                }

                // Get public URL
                const { data: publicUrlData } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);

                foto_url = publicUrlData.publicUrl;
            }

            // 4. Insert into public.usuarios
            const { error: insertError } = await supabase.from('usuarios').insert([{
                nombre,
                apellido,
                edad: parseInt(edad),
                telefono,
                dni,
                // Using a JSON field or individual columns if exist. 
                // We're matching user constraints closely:
                // "nombre, apellido, email, edad, dni, etc."

                // Nuevas columnas requeridas:
                antecedentes: antecedentes || null,
                matricula: matricula,
                antiguedad: parseFloat(antiguedad),
                foto_url: foto_url,
                // The DB will use defaults for ranking/comentarios if omitted.
            }]);

            if (insertError) throw insertError;

            // Success
            alertBox.className = 'alert alert-success mt-3';
            alertBox.innerHTML = '¡Registro completado exitosamente! Ya eres parte de Toori ServiciosYa.';
            form.reset();
            fotoPreview.src = 'assets/img/team/team-1.jpg'; // reset preview
            selectedFile = null;

        } catch (err: any) {
            console.error("Error en registro:", err);
            alertBox.className = 'alert alert-danger mt-3';
            alertBox.innerHTML = `Error: ${err.message}`;
        } finally {
            btn.disabled = false;
            btn.innerHTML = 'Finalizar Registro';
        }
    });
});
