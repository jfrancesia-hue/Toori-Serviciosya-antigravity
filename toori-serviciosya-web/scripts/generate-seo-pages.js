import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Faltan credenciales de Supabase en el .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 1. Configuraciones Base
const SITE_URL = 'https://tooriservicios.com';
const DIST_DIR = path.resolve(__dirname, '../dist/servicios');
const OTHERS_DIR = path.resolve(__dirname, '../dist'); // Para sitemap

const CATEGORIAS = [
    'limpieza', 'plomeria', 'electricidad', 'gas',
    'pintura', 'jardineria', 'albanileria', 'ninera', 'fletes'
];

// Nombres para mostrar en los Textos (Mayúsculas)
const capitalize = (s) => {
    if (typeof s !== 'string') return '';
    return s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ');
};

const slugify = (text) => {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Reemplazar espacios por guiones
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar acentos locales
        .replace(/[^\w\-]+/g, '')       // Quitar caracteres no válidos
        .replace(/\-\-+/g, '-')         // Quitar guiones duplicados
        .replace(/^-+/, '')             // Quitar guiones del principio
        .replace(/-+$/, '');            // Quitar guiones del final
};

// 2. Molde HTML Generico para SEO
const generateHtmlTemplate = (categoria, ciudad, slugCat, slugCity) => {
    const title = `${capitalize(categoria)} en ${capitalize(ciudad)} | Urgencias 24hs | Toori ServiciosYa`;
    const description = `Contactá al instante con un ${capitalize(categoria)} verificado en ${capitalize(ciudad)}. Presupuestos por WhatsApp. Atención rápida y segura garantizada por Toori.`;
    const url = `${SITE_URL}/servicios/${slugCat}-${slugCity}/`;

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${description}">
    <link rel="canonical" href="${url}" />
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${url}">

    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "serviceType": "${capitalize(categoria)}",
      "provider": {
        "@type": "LocalBusiness",
        "name": "Toori ServiciosYa",
        "description": "Plataforma de conexión con profesionales verificados",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "${capitalize(ciudad)}",
          "addressCountry": "AR"
        }
      },
      "areaServed": {
        "@type": "City",
        "name": "${capitalize(ciudad)}"
      },
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Servicios de ${capitalize(categoria)}"
      }
    }
    </script>
    <meta http-equiv="refresh" content="0; url=/?utm_source=seo&servicio=${slugCat}&zona=${slugCity}" />
    <style>body { font-family: sans-serif; text-align: center; padding: 50px; }</style>
</head>
<body>
    <h1>${title}</h1>
    <p>${description}</p>
    <p>Redirigiendo a la plataforma oficial...</p>
    <a href="/?utm_source=seo&servicio=${slugCat}&zona=${slugCity}">Hacer clic aquí si no redirige automáticamente</a>
</body>
</html>`;
};

// 3. Script Principal
async function generateSeoPages() {
    console.log('🚀 Extrayendo datos en vivo desde Supabase...');

    // Fetch live workers data
    const { data: prestadores, error } = await supabase
        .from('sy_perfiles')
        .select('zona_frecuente')
        .eq('rol', 'prestador');

    if (error || !prestadores) {
        console.error('❌ Error obteniendo prestadores:', error);
        return;
    }

    // Extract unique active cities
    const activeCitiesRaw = prestadores.map(p => p.zona_frecuente).filter(z => z && z.trim() !== '');
    const activeCities = [...new Set(activeCitiesRaw)];

    // We use the static categories as they are exhaustive to the app capability
    const activeCategories = CATEGORIAS;

    console.log(`📡 Bases encontradas en Database: ${activeCities.length} Ciudades Activas y ${activeCategories.length} Categorías estáticas.`);

    // Asegurarse de que el directorio /dist existe (debería existir si esto se corre DESPUES de vite build)
    if (!fs.existsSync(DIST_DIR)) {
        fs.mkdirSync(DIST_DIR, { recursive: true });
    }

    const sitemapLinks = [];
    let count = 0;

    // Generar combinaciones reales
    for (const cat of activeCategories) {
        for (const city of activeCities) {
            const slugCat = slugify(cat);
            const slugCity = slugify(city);

            const folderName = `${slugCat}-${slugCity}`;
            const targetPath = path.join(DIST_DIR, folderName);

            // Crear carpeta para la ruta física
            if (!fs.existsSync(targetPath)) {
                fs.mkdirSync(targetPath, { recursive: true });
            }

            // Guardar index.html
            const htmlContent = generateHtmlTemplate(cat, city, slugCat, slugCity);
            fs.writeFileSync(path.join(targetPath, 'index.html'), htmlContent);

            // Agregar a la lista para sitemap
            sitemapLinks.push(`${SITE_URL}/servicios/${folderName}/`);
            count++;
        }
    }

    // 4. Generar sitemap.xml
    console.log('🗺️ Generando Sitemap.xml dinámico...');
    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${SITE_URL}/</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>${SITE_URL}/registro.html</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    ${sitemapLinks.map(link => `
    <url>
        <loc>${link}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
    </url>`).join('')}
</urlset>`;

    fs.writeFileSync(path.join(OTHERS_DIR, 'sitemap.xml'), sitemapContent);
    fs.writeFileSync(path.join(OTHERS_DIR, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml`);

    console.log(`✅ ¡Éxito! Se generaron ${count} páginas SEO 100% orgánicas basadas en datos reales y el Sitemap.`);
}

generateSeoPages();
