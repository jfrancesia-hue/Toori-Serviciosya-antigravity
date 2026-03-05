import { supabase } from './supabase';

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            redirectBasedOnRole(session.user.id);
        }
    });

    const loginForm = document.getElementById('login-form') as HTMLFormElement;
    const loginError = document.getElementById('login-error');
    const loginBtn = document.getElementById('login-btn') as HTMLButtonElement;

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (loginError) loginError.classList.add('d-none');
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Ingresando...';

            const email = (document.getElementById('login-email') as HTMLInputElement).value;
            const password = (document.getElementById('login-password') as HTMLInputElement).value;

            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;

                if (data.session) {
                    await redirectBasedOnRole(data.user.id);
                }
            } catch (err: any) {
                if (loginError) {
                    loginError.textContent = err.message || 'Error al iniciar sesión. Revisa tus credenciales.';
                    loginError.classList.remove('d-none');
                }
            } finally {
                loginBtn.disabled = false;
                loginBtn.textContent = 'Ingresar a mi cuenta';
            }
        });
    }

    async function redirectBasedOnRole(userId: string) {
        // En base a la última instrucción del negocio, todos los logueos 
        // conducen al Inicio. Luego el usuario decidirá si entrar a su panel usando el Navbar.
        window.location.href = '/index.html';
    }
});
