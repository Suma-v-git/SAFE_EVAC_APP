
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.VITE_GEMINI_API_KEY_NEW || process.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
    model: "gemini-flash-lite-latest",
    systemInstruction: {
        role: 'system',
        parts: [{ text: "You are a helpful assistant." }]
    }
});

async function testHistory() {
    console.log("Testing Chat with History starting with MODEL...");

    // Simulating ChatBot structure: history starts with a model greeting
    const history = [
        {
            role: 'model',
            parts: [{ text: 'Hello, I am your SafeEvac Assistant.' }]
        }
    ];

    try {
        const chat = model.startChat({
            history: history
        });

        const msg = "Hi, are you working?";
        console.log(`User: ${msg}`);
        const result = await chat.sendMessage(msg);
        console.log(`Assistant: ${result.response.text()}`);
    } catch (e) {
        console.error("Test Failed:", e.message);
    }
}

testHistory();
