import { GoogleGenerativeAI } from "@google/generative-ai";

// Simulate browser environment
const apiKey = import.meta.env.VITE_GEMINI_API_KEY_NEW || import.meta.env.VITE_GEMINI_API_KEY || '';

console.log("=== Browser Environment Test ===");
console.log("API Key available:", !!apiKey);
console.log("API Key last 4 chars:", apiKey ? apiKey.slice(-4) : "NONE");
console.log("import.meta.env.VITE_GEMINI_API_KEY:", import.meta.env.VITE_GEMINI_API_KEY ? "SET" : "NOT SET");

if (!apiKey) {
    console.error("CRITICAL: No API key found in browser environment!");
    console.log("Available env vars:", Object.keys(import.meta.env));
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });

async function testChat() {
    try {
        console.log("Attempting to send test message...");
        const chat = model.startChat({
            systemInstruction: {
                role: 'system',
                parts: [{ text: 'You are a helpful assistant.' }]
            }
        });

        const result = await chat.sendMessage("Say hello");
        const response = await result.response;
        console.log("SUCCESS! Response:", response.text());
    } catch (error) {
        console.error("FAILED! Error:", error);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
    }
}

testChat();
