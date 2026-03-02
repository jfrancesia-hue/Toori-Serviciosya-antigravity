import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
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
                registro: resolve(__dirname, 'registro.html')
            }
        }
    }
});
