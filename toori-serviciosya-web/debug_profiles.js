const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

async function checkProfiles() {
    const url = process.env.VITE_SUPABASE_URL + '/rest/v1/sy_perfiles?select=*&limit=5';
    const key = process.env.VITE_SUPABASE_ANON_KEY;

    try {
        const res = await fetch(url, {
            headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
        });
        const data = await res.json();
        console.log("DATA FROM DB:");
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}
checkProfiles();
