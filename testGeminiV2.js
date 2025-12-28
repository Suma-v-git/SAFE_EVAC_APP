import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY_NEW;

console.log("Testing V2 with API Key ending in:", apiKey ? apiKey.slice(-4) : "NONE");

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function test() {
    try {
        const result = await model.generateContent("Hello, are you working?");
        console.log("Success:", result.response.text());
    } catch (error) {
        console.error("Error:", error);
    }
}

test();
