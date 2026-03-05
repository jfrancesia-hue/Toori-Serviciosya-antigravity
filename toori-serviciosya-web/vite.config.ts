import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    base: './',
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                contratar: resolve(__dirname, 'contratar.html'),
                invite: resolve(__dirname, 'invite.html'),
                soporte: resolve(__dirname, 'soporte.html'),
                terminos: resolve(__dirname, 'Terminos-y-condiciones.html'),
                politicas: resolve(__dirname, 'politicas-de-privacidad.html'),
                ofertas: resolve(__dirname, 'ofertas.html'),
                oferta: resolve(__dirname, 'oferta.html'),
                registro: resolve(__dirname, 'registro.html'),
                registroverifi: resolve(__dirname, 'registro-verifi.html'),
                login: resolve(__dirname, 'login.html'),
                admin: resolve(__dirname, 'admin/index.html'),
                solicitar: resolve(__dirname, 'solicitar-servicio.html'),
                trabajador: resolve(__dirname, 'trabajador/index.html'),
                cliente: resolve(__dirname, 'cliente/index.html'),
                perfil: resolve(__dirname, 'perfil.html'),
                perfiltrabajador: resolve(__dirname, 'perfil-trabajador.html')
            }
        }
    }
});
