import { supabase } from './supabase';

document.addEventListener('DOMContentLoaded', () => {
    const formCliente = document.getElementById('form-cliente') as HTMLFormElement;
    const alertBox = document.getElementById('reg-cliente-alert');
    const submitBtn = document.getElementById('btn-submit-cli') as HTMLButtonElement;

    if (!formCliente || !alertBox || !submitBtn) return;

    formCliente.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Reset state
        alertBox.className = 'alert d-none';
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Creando tu cuenta...';

        try {
            // Get values
            const nombre = (document.getElementById('cli-nombre') as HTMLInputElement).value.trim();
            const apellido = (document.getElementById('cli-apellido') as HTMLInputElement).value.trim();
            const email = (document.getElementById('cli-email') as HTMLInputElement).value.trim();
            const password = (document.getElementById('cli-password') as HTMLInputElement).value;

            // Format phone (Argentina WhatsApp standard)
            let telefonoCrudo = (document.getElementById('cli-telefono') as HTMLInputElement).value.trim().replace(/\D/g, '');
            if (!telefonoCrudo.startsWith('54') && !telefonoCrudo.startsWith('549')) {
                if (telefonoCrudo.startsWith('0')) telefonoCrudo = telefonoCrudo.substring(1);
                telefonoCrudo = '549' + telefonoCrudo;
            }

            // 1. Create Auth User
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password
            });

            if (authError) throw authError;

            const userId = authData?.user?.id;
            if (!userId) throw new Error("No se pudo obtener el ID de registro. Verifica los permisos de Auth.");

            // 2. Insert into profiles with role 'cliente'
            const userData = {
                id: userId,
                rol: 'cliente',
                nombre: `${nombre} ${apellido}`,
                telefono: telefonoCrudo,
                verificado: false // Clientes don't need verification by default, but keeping schema consistent
            };

            const { error: dbError } = await supabase
                .from('sy_perfiles')
                .insert([userData]);

            if (dbError) throw dbError;

            // Success
            alertBox.className = 'alert alert-success mt-3';
            alertBox.innerHTML = '<i class="bi bi-check-circle-fill"></i> ¡Cuenta creada con éxito! Redirigiendo...';

            // Redirect logic (e.g. to a client dashboard or back to home where they were trying to hire)
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);

        } catch (error: any) {
            console.error('Registration Error:', error);
            alertBox.className = 'alert alert-danger mt-3';
            alertBox.innerHTML = `<i class="bi bi-exclamation-triangle-fill"></i> Error al crear cuenta: ${error.message}`;

            // Reset button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Crear Cuenta y Continuar';
        }
    });
});
