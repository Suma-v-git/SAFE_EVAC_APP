import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.VITE_GEMINI_API_KEY_NEW || process.env.VITE_GEMINI_API_KEY;

console.log("Testing with API Key ending in:", apiKey ? apiKey.slice(-4) : "NONE");

const ai = new GoogleGenAI({ apiKey: apiKey });

async function test() {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: [{ role: 'user', parts: [{ text: 'Hello, are you working?' }] }]
        });
        console.log("Success:", response.text);
    } catch (error) {
        console.error("Error:", error);
    }
}

test();
