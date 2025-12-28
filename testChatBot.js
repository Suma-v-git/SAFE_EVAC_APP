
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.VITE_GEMINI_API_KEY_NEW || process.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
// Using the fixed model
const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });

async function testChatWithLocation() {
    console.log("Testing Chat with Location Context...");

    // Simulate system prompt from geminiService.ts
    const systemPrompt = `You are SafeEvac AI, a helpful crisis management assistant. 
        RULES:
        1. FORMAT: Always use numbered lists. 
        2. NO MARKDOWN.
        3. CONTENT: Focus on immediate, actionable steps.
        
        CONTEXT DATA:
        User Location: Lat 37.7749, Lng -122.4194 (San Francisco)
        
        CAPABILITIES:
        - If asked for SHELTERS: Use the provided User Location in the context to generate 3 realistic nearby shelter suggestions.
    `;

    const chat = model.startChat({
        systemInstruction: {
            role: 'system',
            parts: [{ text: systemPrompt }]
        }
    });

    try {
        const msg = "I need a shelter nearby. Share my location.";
        console.log(`User: ${msg}`);
        const result = await chat.sendMessage(msg);
        console.log(`Assistant: ${result.response.text()}`);
    } catch (e) {
        console.error("Test Failed:", e.message);
    }
}

testChatWithLocation();
