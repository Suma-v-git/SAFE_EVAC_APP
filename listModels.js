
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.VITE_GEMINI_API_KEY_NEW || process.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    console.error("No API key found!");
    process.exit(1);
}

console.log("Using API Key:", apiKey.slice(-4));

async function listModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        if (!response.ok) {
            console.error(`API Error: ${response.status} ${response.statusText}`);
            const txt = await response.text();
            console.error(txt);
            return;
        }

        const data = await response.json();

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => {
                console.log(`- ${m.name}`);
            });
        } else {
            console.log("No models found or different structure:", data);
        }
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
