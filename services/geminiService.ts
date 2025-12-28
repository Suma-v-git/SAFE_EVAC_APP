
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { DisasterType, Shelter } from "../types";

// Initialize Gemini
// Note: In a real app, ensure process.env.API_KEY is available.
const apiKey = import.meta.env.VITE_GEMINI_API_KEY_NEW || import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });
console.log("Gemini Service Initialized. Key available:", !!apiKey, "Masked:", apiKey ? apiKey.slice(-4) : "NONE");

// Fallback data for offline usage
const OFFLINE_INSTRUCTIONS: Record<string, string> = {
  [DisasterType.Earthquake]: "1. DROP to your hands and knees. 2. COVER your head and neck with your arms. 3. HOLD ON to sturdy furniture until shaking stops. 4. Stay away from glass, windows, and heavy objects. 5. Do not use elevators. Emergency: 911 / 112",
  [DisasterType.Flood]: "1. Move to higher ground immediately. 2. Do not walk, swim, or drive through floodwaters. 3. Turn around, don't drown. 4. Evacuate if told to do so. 5. Disconnect electrical appliances if safe. Emergency: 911 / 112",
  [DisasterType.Fire]: "1. Get out immediately and stay out. 2. Crawl low under smoke to exit. 3. Feel door handles; if hot, do not open. 4. Call emergency services from outside. 5. Do not gather personal items. Emergency: 911 / 112",
  [DisasterType.Tsunami]: "1. Move to high ground or inland immediately. 2. Do not wait for an official warning if you feel a strong quake. 3. Stay away from the beach. 4. Listen to emergency alerts. 5. Return only when officials say it is safe. Emergency: 911 / 112",
  [DisasterType.Hurricane]: "1. Evacuate if ordered. 2. Stay indoors away from windows and glass. 3. Seek shelter in a small, windowless interior room. 4. Have a battery-powered radio ready. 5. Beware of the eye of the storm. Emergency: 911 / 112",
  [DisasterType.General]: "1. Stay calm and assess the situation. 2. Call emergency services (911) if needed. 3. Follow instructions from local authorities. 4. Check for injuries. 5. Move to a safe location. Emergency: 911 / 112"
};

export const getDisasterInstructions = async (type: DisasterType): Promise<string> => {
  // 1. Check offline status immediately


  try {
    const prompt = `Provide immediate, concise, step-by-step survival instructions for a ${type} scenario. Output strictly as a numbered list (1., 2., 3.). Do not use any markdown formatting (no bolding, no italics, no asterisks). Do not include a title. Keep it under 150 words. Focus on immediate safety. Include emergency numbers (911 / 112) at the end.`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return text.replace(/\*/g, '').trim();
  } catch (error) {
    console.error("Gemini Error:", error);
    // Fallback if API fails
    return OFFLINE_INSTRUCTIONS[type] || OFFLINE_INSTRUCTIONS[DisasterType.General];
  }
};

export const findNearbyShelters = async (lat: number, lng: number): Promise<Shelter[]> => {


  try {
    const schema = {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          name: { type: SchemaType.STRING },
          address: { type: SchemaType.STRING },
          distance: { type: SchemaType.STRING, description: "Distance in km or miles" },
          status: { type: SchemaType.STRING, enum: ["Open", "Full", "Closed"] },
          capacity: { type: SchemaType.STRING, description: "e.g., '85% full' or '200/500'" },
          location: {
            type: SchemaType.OBJECT,
            properties: {
              lat: { type: SchemaType.NUMBER },
              lng: { type: SchemaType.NUMBER }
            }
          },
          notes: { type: SchemaType.STRING, description: "Short safety note about the route or shelter" }
        }
      }
    } as any;

    const prompt = `You are helping find emergency shelters for someone at EXACTLY these coordinates: Latitude ${lat}, Longitude ${lng}.

CRITICAL: Generate shelters that would realistically exist NEAR THESE EXACT COORDINATES. Do NOT use generic or foreign locations.

Based on the coordinates provided, identify the likely city/region and suggest 5 realistic emergency shelters (schools, community centers, hospitals, stadiums, fire stations) that would exist in that specific geographic area.

Each shelter should have coordinates very close to ${lat}, ${lng} (within 0.05 degrees).

Return the data in JSON format with realistic local names and addresses.`;

    const modelWithSchema = genAI.getGenerativeModel({
      model: "gemini-flash-lite-latest",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const result = await modelWithSchema.generateContent(prompt);
    const jsonStr = result.response.text();

    if (!jsonStr) return [];
    return JSON.parse(jsonStr) as Shelter[];
  } catch (error) {
    console.error("Gemini Shelter Error:", error);
    return [];
  }
};

export const chatWithAssistant = async (
  history: { role: string, parts: { text: string }[] }[],
  message: string,
  context?: string
) => {


  try {
    const systemPrompt = `You are SafeEvac AI, a helpful crisis management assistant. 
        
        RULES:
        1. FORMAT: Always use numbered lists (1., 2., 3.) for instructions. 
        2. NO MARKDOWN: Do not use bold (**), italics (*), or any other markdown symbols. Plain text only.
        3. CONTENT: Focus on immediate, actionable steps (e.g., "Move to high ground", "Call 911").
        
        CONTEXT DATA:
        ${context || 'No specific location context provided.'}
        
        CAPABILITIES:
        - If asked for SHELTERS: Use the provided User Location in the context to generate 3 realistic nearby shelter suggestions (e.g., School, Community Center) with estimated distances. List them clearly.
        - If asked for CONTACTS: Refer to the Emergency Contacts listed in the context.
        - If asked for ACTIONS: Provide a numbered list of immediate survival steps.
        `;

    const modelWithSystemPrompt = genAI.getGenerativeModel({
      model: "gemini-flash-lite-latest",
      systemInstruction: {
        role: 'system',
        parts: [{ text: systemPrompt }]
      }
    });

    // Convert history to Gemini format (user/model roles)
    // Gemini SDK expects 'user' and 'model' roles.
    const chat = modelWithSystemPrompt.startChat({
      history: history.map(h => ({
        role: h.role,
        parts: h.parts.map(p => ({ text: p.text }))
      }))
    });

    const result = await chat.sendMessageStream(message);
    return result.stream;

  } catch (error) {
    // Improve error mapping
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("404") || errorMessage.includes("not found")) {
      console.error("Gemini Model Error: Invalid model name or version.");
    }
    throw error;
  }
}
