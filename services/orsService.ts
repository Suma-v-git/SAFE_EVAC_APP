
const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY || '';

interface RouteResponse {
    routes: {
        geometry: string; // ORS returns a long encoded string
        summary: {
            duration: number;
            distance: number;
        };
    }[];
}

// Simple decoding function for ORS encoded polylines
const decodePolyline = (str: string, precision?: number) => {
    var index = 0,
        lat = 0,
        lng = 0,
        coordinates = [],
        shift = 0,
        result = 0,
        byte = null,
        latitude_change,
        longitude_change,
        factor = Math.pow(10, precision || 5);

    while (index < str.length) {
        byte = null;
        shift = 0;
        result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        shift = result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        lat += latitude_change;
        lng += longitude_change;

        coordinates.push([lat / factor, lng / factor]);
    }

    return coordinates;
};

export type TransportMode = 'car' | 'bike' | 'walk';

export interface RouteData {
    coordinates: Number[][];
    summary: {
        distance: number; // meters
        duration: number; // seconds
    };
}

export const getDirections = async (
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
    mode: TransportMode = 'car'
): Promise<RouteData | null> => {
    try {
        console.log(`Fetching route from ORS (${mode})...`);
        const orsProfile = mode === 'car' ? 'driving-car' : mode === 'bike' ? 'cycling-regular' : 'foot-walking';

        const response = await fetch(`https://api.openrouteservice.org/v2/directions/${orsProfile}?api_key=${ORS_API_KEY}&start=${startLng},${startLat}&end=${endLng},${endLat}`);

        if (!response.ok) {
            throw new Error(`ORS API failed: ${response.statusText}`);
        }

        const data: any = await response.json();

        // Handle GeoJSON response (features)
        if (data.features && data.features.length > 0) {
            const feature = data.features[0];
            return {
                coordinates: feature.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]), // Flip [lng, lat] to [lat, lng]
                summary: feature.properties.summary || { distance: feature.properties.summary?.distance || 0, duration: feature.properties.summary?.duration || 0 }
            };
        }

        // Handle JSON response (routes)
        if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            let coords: Number[][] = [];

            if (typeof route.geometry === 'string') {
                coords = decodePolyline(route.geometry);
            } else if (route.geometry && route.geometry.coordinates) {
                // GeoJSON inside routes
                coords = route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
            }

            return {
                coordinates: coords,
                summary: route.summary
            };
        }
        throw new Error("No routes found from ORS");
    } catch (orsError) {
        console.warn('Primary (ORS) routing failed, trying OSRM fallback...', orsError);

        try {
            // Fallback 1: OSRM Public API
            const osrmProfile = mode === 'car' ? 'driving' : mode === 'bike' ? 'bike' : 'foot';
            const response = await fetch(`https://router.project-osrm.org/route/v1/${osrmProfile}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`);
            if (!response.ok) throw new Error("OSRM API failed");

            const data = await response.json();
            if (data.routes && data.routes.length > 0) {
                // OSRM returns GeoJSON [lon, lat]
                return {
                    coordinates: data.routes[0].geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]),
                    summary: {
                        distance: data.routes[0].distance,
                        duration: data.routes[0].duration
                    }
                };
            }
        } catch (osrmError) {
            console.warn('Secondary (OSRM) routing failed.', osrmError);
        }

        // Final Fallback: Straight line
        console.warn('All routing services failed. Using straight line.');
        return {
            coordinates: [[startLat, startLng], [endLat, endLng]],
            summary: { distance: 0, duration: 0 }
        };
    }
};

export const findNearbySheltersORS = async (lat: number, lng: number): Promise<any[]> => {
    console.log(`[ORS POI] Searching for shelters near: ${lat}, ${lng}`);
    try {
        const response = await fetch('https://api.openrouteservice.org/pois', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': ORS_API_KEY
            },
            body: JSON.stringify({
                request: 'pois',
                geometry: {
                    bbox: [
                        [lng - 0.05, lat - 0.05], // ~5km bounding box (rough estimate)
                        [lng + 0.05, lat + 0.05]
                    ],
                    geojson: {
                        type: "Point",
                        coordinates: [lng, lat]
                    },
                    buffer: 10000 // 10km radius
                },
                filters: {
                    category_group_ids: [150, 200, 360] // Education, Health, Public Places
                },
                limit: 10
            })
        });

        if (!response.ok) {
            console.warn('[ORS POI] Fetch failed:', response.status, response.statusText);
            return [];
        }

        const data = await response.json();
        console.log(`[ORS POI] Found ${data.features?.length || 0} shelters`);
        return data.features || [];
    } catch (error) {
        console.error('Error fetching ORS POIs:', error);
        return [];
    }
};
