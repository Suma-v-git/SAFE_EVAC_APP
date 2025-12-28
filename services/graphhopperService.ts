const GH_API_KEY = import.meta.env.VITE_GH_API_KEY || '';

export type TransportMode = 'car' | 'bike' | 'walk';

export interface RouteData {
    coordinates: Number[][];
    summary: {
        distance: number; // meters
        duration: number; // seconds
    };
}

export const getGHRoute = async (
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
    mode: TransportMode = 'car'
): Promise<RouteData | null> => {
    try {
        const vehicle = mode === 'car' ? 'car' : mode === 'bike' ? 'bike' : 'foot';
        const url = `https://graphhopper.com/api/1/route?point=${startLat},${startLng}&point=${endLat},${endLng}&vehicle=${vehicle}&locale=en&key=${GH_API_KEY}&points_encoded=false`;

        console.log(`[Graphhopper] Fetching route...`);
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`[Graphhopper] Route API Error: ${response.status} ${response.statusText}`);
            return null;
        }

        const data = await response.json();
        if (data.paths && data.paths.length > 0) {
            const path = data.paths[0];
            return {
                // GH returns { type: "LineString", coordinates: [[lng, lat], ...] }
                coordinates: path.points.coordinates.map((c: number[]) => [c[1], c[0]]), // Flip to [lat, lng]
                summary: {
                    distance: path.distance,
                    duration: path.time / 1000 // GH returns ms, we want seconds
                }
            };
        }
        return null;
    } catch (error) {
        console.error("[Graphhopper] Routing Exception:", error);
        return null;
    }
};

export const findGHPlaces = async (lat: number, lng: number): Promise<any[]> => {
    try {
        console.log(`[Graphhopper] Searching for shelters near: ${lat}, ${lng}`);

        // Search for multiple types of emergency shelters
        const queries = [
            'hospital',
            'school',
            'community center',
            'fire station',
            'police station',
            'stadium'
        ];

        let allShelters: any[] = [];

        for (const query of queries) {
            try {
                const url = `https://graphhopper.com/api/1/geocode?q=${encodeURIComponent(query)}&point=${lat},${lng}&limit=5&key=${GH_API_KEY}`;
                console.log(`[Graphhopper] Fetching ${query}...`);

                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    if (data.hits && data.hits.length > 0) {
                        console.log(`[Graphhopper] Found ${data.hits.length} ${query}(s)`);
                        allShelters = [...allShelters, ...data.hits.map((hit: any) => ({
                            ...hit,
                            type: query
                        }))];
                    }
                }
            } catch (err) {
                console.warn(`[Graphhopper] Failed to fetch ${query}:`, err);
            }
        }

        console.log(`[Graphhopper] Total shelters found: ${allShelters.length}`);

        // Calculate distance and format shelters
        const formattedShelters = allShelters.slice(0, 10).map((hit, idx) => {
            const shelterLat = hit.point.lat;
            const shelterLng = hit.point.lng;

            // Calculate distance using Haversine formula
            const R = 6371; // Earth's radius in km
            const dLat = (shelterLat - lat) * Math.PI / 180;
            const dLon = (shelterLng - lng) * Math.PI / 180;
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat * Math.PI / 180) * Math.cos(shelterLat * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;

            // Determine capacity and resources based on type
            let capacity = 'Unknown';
            let resources = 'Basic emergency supplies';

            if (hit.type === 'hospital') {
                capacity = 'Medical care available';
                resources = 'Medical staff, emergency care, beds';
            } else if (hit.type === 'school') {
                capacity = 'Large capacity (200-500)';
                resources = 'Shelter space, restrooms, water';
            } else if (hit.type === 'stadium') {
                capacity = 'Very large (1000+)';
                resources = 'Mass shelter, food distribution';
            } else if (hit.type === 'community center') {
                capacity = 'Medium (100-300)';
                resources = 'Shelter, food, water, supplies';
            } else if (hit.type === 'fire station' || hit.type === 'police station') {
                capacity = 'Limited (50-100)';
                resources = 'Emergency services, first aid';
            }

            return {
                id: `gh-${idx}-${hit.osm_id || idx}`,
                name: hit.name || `${hit.type.charAt(0).toUpperCase() + hit.type.slice(1)} Shelter`,
                address: [hit.housenumber, hit.street, hit.city, hit.country]
                    .filter(Boolean)
                    .join(', ') || 'Address not available',
                location: {
                    lat: shelterLat,
                    lng: shelterLng
                },
                type: hit.type,
                distance: `${distance.toFixed(1)} km`,
                distanceValue: distance,
                capacity: capacity,
                resources: resources,
                status: 'Open', // Default status
                notes: `Type: ${hit.type} | Resources: ${resources}`
            };
        });

        // Sort by distance
        formattedShelters.sort((a, b) => a.distanceValue - b.distanceValue);

        console.log(`[Graphhopper] Returning ${formattedShelters.length} formatted shelters`);
        return formattedShelters;

    } catch (error) {
        console.error("[Graphhopper] Exception:", error);
        return [];
    }
};

export const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
        const url = `https://graphhopper.com/api/1/geocode?q=${encodeURIComponent(address)}&limit=1&key=${GH_API_KEY}`;
        console.log(`[Graphhopper] Geocoding address: ${address}`);

        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            if (data.hits && data.hits.length > 0) {
                const hit = data.hits[0];
                console.log(`[Graphhopper] Geocoding successful:`, hit.point);
                return { lat: hit.point.lat, lng: hit.point.lng };
            }
        }
        console.warn("[Graphhopper] No results for geocoding.");
        return null;
    } catch (error) {
        console.error("[Graphhopper] Geocoding error:", error);
        return null;
    }
};
