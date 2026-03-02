# Toori ServiciosYa - Consolidación Web (MVP)

Este proyecto unifica la página web estática de base (ServiciosYa) con la lógica backend industrializada de Toori ("codigo-industrializado"), transformando el proyecto en una Modern Multi-Page Application (MPA) configurada con Vite, TypeScript y Supabase.

## Estructura
- **Vite MPA**: Permite utilizar todas las páginas `.html` originales sin reescribirlas a React, proveyendo un entorno de desarrollo moderno y recarga en vivo.
- **Supabase**: Base de datos en tiempo real, autenticación (parcial MVP), y storage de avatares.

## Flujo MVP (Para probar)
1. **WhatsApp IA (Mock)** crea entradas en `public."nuevaOferta"`.
2. Las ofertas en estado `'pendiente'` aparecen en `/ofertas.html`.
3. Un trabajador selecciona una oferta (`/oferta.html?id=...`) y envía un **Presupuesto**.
4. El administrador puede seleccionar el **TOP 3** con un solo click.
5. **Registro Trabajador**: `/registro.html` permite subir la foto de perfil al storage y crear una entrada en `public.usuarios`.

## Pasos para Levantar Localmente

1. **Instalar Dependencias**
   ```bash
   npm install
   ```
2. **Configurar Entorno**
   - Copiar `.env.example` a `.env` (`cp .env.example .env`).
   - Rellenar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con las credenciales de Supabase.
3. **Migración de Base de Datos**
   - Ejecutar el script `supabase/migrations/01_safe_migration.sql` en el SQL Editor de Supabase.
   - Asegurarse de tener el Storage Bucket `avatars` configurado como **público**.
4. **Ejecutar Desarrollo**
   ```bash
   npm run dev
   ```
   Abre la web en `http://localhost:5173/`. 
   
## Scripts Adicionales
- `npm run build`: Genera el bundle optimizado para producción en `/dist`.
- `npm run preview`: Previsualiza la build de `/dist` localmente.

---
**Nota de Rebranding:** Todos los textos, títulos y metadatos han sido cambiados de *"ServiciosYa"* a *"Toori ServiciosYa"*.
