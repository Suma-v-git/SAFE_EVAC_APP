
const apiKey = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6Ijg4ZTg2NmMwNTE3NzQ0ZTQ4NTI5OTNmOTc3NGE0NmM4IiwiaCI6Im11cm11cjY0In0=';
const start = '77.6245,12.9352'; // City Center approx
const end = '77.5958,12.9698'; // Kanteerava Stadium

async function testRoute() {
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${start}&end=${end}`;
    console.log(`Fetching: ${url}`);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error(text);
            return;
        }
        const data = await response.json();
        console.log('Response Data:', JSON.stringify(data, null, 2));
        console.log('Route found:', data.routes ? data.routes.length : (data.features ? data.features.length : 0));
        if (data.routes && data.routes[0]) {
            console.log('Geometry length:', data.routes[0].geometry.length);
        }
    } catch (e) {
        console.error('Fetch failed:', e);
    }
}

testRoute();
