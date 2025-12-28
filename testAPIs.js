// Test script to verify API connectivity
console.log("Testing API Keys and Services...\n");

// Test 1: Check environment variables
console.log("1. Environment Variables:");
console.log("   ORS API Key:", process.env.VITE_ORS_API_KEY ? "✓ Present" : "✗ Missing");
console.log("   Gemini API Key:", process.env.VITE_GEMINI_API_KEY ? "✓ Present" : "✗ Missing");
console.log("   Google Maps Key:", process.env.VITE_GOOGLE_MAPS_API_KEY ? "✓ Present" : "✗ Missing");

// Test 2: Test Gemini API
async function testGemini() {
    console.log("\n2. Testing Gemini API...");
    try {
        const { GoogleGenAI, Type } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY || '' });

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: 'Say "API Working" if you can read this.',
        });

        console.log("   Gemini Response:", response.text || "✓ API Connected");
    } catch (error) {
        console.error("   Gemini Error:", error.message);
    }
}

// Test 3: Test ORS POI API
async function testORS() {
    console.log("\n3. Testing OpenRouteService POI API...");
    const lat = 12.9716; // City Center
    const lng = 77.5946;

    try {
        const response = await fetch('https://api.openrouteservice.org/pois', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': process.env.VITE_ORS_API_KEY || ''
            },
            body: JSON.stringify({
                request: 'pois',
                geometry: {
                    bbox: [
                        [lng - 0.05, lat - 0.05],
                        [lng + 0.05, lat + 0.05]
                    ],
                    buffer: 10000
                },
                filters: {
                    category_ids: [560, 563, 201] // schools, hospitals, public
                },
                limit: 10
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log(`   ORS POI: ✓ Found ${data.features?.length || 0} locations`);
        } else {
            console.error(`   ORS POI Error: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.error("   ORS Error:", error.message);
    }
}

// Run tests
(async () => {
    await testGemini();
    await testORS();
    console.log("\n✓ Tests complete!");
})();
