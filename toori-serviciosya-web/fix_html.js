import fs from 'fs';
import path from 'path';

const dir = '.';
const files = fs.readdirSync(dir);

files.forEach(file => {
    if (file.endsWith('.html')) {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Find <noscript> inside <head> and just remove it to satisfy Vite parser
        content = content.replace(/<head>([\s\S]*?)<\/head>/gi, (match, headContent) => {
            return '<head>' + headContent.replace(/<noscript>[\s\S]*?<\/noscript>/gi, '') + '</head>';
        });
        
        fs.writeFileSync(filePath, content, 'utf8');
    }
});
console.log('Fixed noscript tags');
