import fs from 'fs';

const content = 'VITE_GEMINI_API_KEY=AIzaSyDXYwSKBW_mT5M3zp7-DaiWkEiS5UkIsec\nVITE_GH_API_KEY=49334d57-bbc8-4e2e-8d8b-c0fe730fae43\nEMAIL_USER=sumasumahv@gmail.com\nEMAIL_PASS=zmlbvynxetmprhxm\n';
try {
    fs.writeFileSync('.env', content);
    console.log('Successfully wrote .env');
} catch (err) {
    console.error('Error writing .env:', err);
}
