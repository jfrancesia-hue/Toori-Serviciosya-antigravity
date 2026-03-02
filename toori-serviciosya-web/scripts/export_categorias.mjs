import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Environment Setup
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');

const loadEnv = () => {
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split(/\r?\n/).forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                process.env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
            }
        });
    }
};

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be defined in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function exportCategories() {
    console.log("🚀 Iniciando exportación de categorías...");

    try {
        const { data, error } = await supabase
            .from('servicios')
            .select('categoria, aceptado, estado');

        if (error) throw error;

        if (!data || data.length === 0) {
            console.log("⚠️ No se encontraron servicios para exportar.");
            return;
        }

        // Agregación en JS (equivalente a la query recomendada)
        const stats = {};

        data.forEach(item => {
            const cat = item.categoria?.trim() || 'SIN_CATEGORIA';
            if (!stats[cat]) {
                stats[cat] = { categoria: cat, servicios_count: 0, aceptados_count: 0, activos_count: 0 };
            }
            stats[cat].servicios_count++;
            if (item.aceptado === true) stats[cat].aceptados_count++;
            if (item.estado === 'activo') stats[cat].activos_count++;
        });

        // Convertir a array y ordenar
        const results = Object.values(stats).sort((a, b) => b.servicios_count - a.servicios_count);

        // Generar CSV
        const header = "categoria,servicios_count,aceptados_count,activos_count\n";
        const rows = results.map(r => `"${r.categoria}",${r.servicios_count},${r.aceptados_count},${r.activos_count}`).join("\n");
        const csvContent = header + rows;

        const exportDir = path.resolve(__dirname, '../exports');
        if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir);

        const filePath = path.join(exportDir, 'categorias.csv');
        fs.writeFileSync(filePath, csvContent);

        console.log(`✅ Exportación exitosa: ${filePath}`);
        console.table(results.slice(0, 10)); // Mostrar top 10 en consola

    } catch (err) {
        console.error("❌ Error durante la exportación:", err.message);
    }
}

exportCategories();
