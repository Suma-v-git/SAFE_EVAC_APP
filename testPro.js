
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.VITE_GH_API_KEY;

if (!API_KEY) {
    console.error("No API key found!");
    process.exit(1);
}

console.log("Testing GraphHopper Routing with key:", API_KEY.slice(0, 8) + "...");

async function testRoute() {
    // San Francisco coordinates roughly
    const start = "37.7749,-122.4194";
    const end = "37.7750,-122.4180";

    const url = `https://graphhopper.com/api/1/route?point=37.7749,-122.4194&point=37.7833,-122.4167&vehicle=car&locale=en&key=${API_KEY}&points_encoded=false`;

    try {
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            if (data.paths && data.paths.length > 0) {
                console.log("Success! Route found.");
                console.log("Distance:", data.paths[0].distance, "meters");
            } else {
                console.log("API returned OK but no paths found.");
            }
        } else {
            console.error("API Error:", response.status, response.statusText);
            const txt = await response.text();
            console.log(txt);
        }
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

testRoute();
