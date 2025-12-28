export interface LocationData {
    lat: number;
    lng: number;
    name?: string;
    source: 'gps' | 'ip';
    error?: string;
}

const GH_API_KEY = import.meta.env.VITE_GH_API_KEY || '';

export const getCurrentLocation = async (): Promise<LocationData> => {
    return new Promise(async (resolve, reject) => {
        // 1. Try GPS first
        if (navigator.geolocation && window.isSecureContext) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    console.log("✅ GPS Success! Coordinates:", { latitude, longitude });
                    console.log("GPS Accuracy:", position.coords.accuracy, "meters");

                    let locationName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

                    // Try reverse geocoding if key exists
                    if (GH_API_KEY) {
                        try {
                            const response = await fetch(`https://graphhopper.com/api/1/geocode?reverse=true&point=${latitude},${longitude}&key=${GH_API_KEY}`);
                            const data = await response.json();
                            if (data.hits && data.hits.length > 0) {
                                const hit = data.hits[0];
                                const specificName = hit.name || hit.street || hit.suburb || hit.district;
                                const cityName = hit.city || hit.state;
                                locationName = specificName
                                    ? (cityName && specificName !== cityName ? `${specificName}, ${cityName}` : specificName)
                                    : (cityName || locationName);
                            }
                        } catch (e) {
                            console.error("Reverse geocoding failed", e);
                        }
                    }

                    console.log("📍 Location name:", locationName);
                    resolve({
                        lat: latitude,
                        lng: longitude,
                        name: locationName,
                        source: 'gps'
                    });
                },
                async (error) => {
                    console.warn("GPS failed:", error.code, error.message);
                    console.warn("Error details:", {
                        code: error.code,
                        message: error.message,
                        PERMISSION_DENIED: error.code === 1,
                        POSITION_UNAVAILABLE: error.code === 2,
                        TIMEOUT: error.code === 3
                    });
                    // GPS failed, try IP Fallback
                    try {
                        const ipLocation = await fetchIpLocation();
                        resolve(ipLocation);
                    } catch (ipError) {
                        reject(ipError);
                    }
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000, // Increased to 15 seconds for better GPS lock
                    maximumAge: 0
                }
            );
        } else {
            // GPS not supported or insecure context
            console.warn("GPS not supported or insecure context, using IP location...");
            try {
                const ipLocation = await fetchIpLocation();
                resolve(ipLocation);
            } catch (ipError) {
                reject(ipError);
            }
        }
    });
};

const fetchIpLocation = async (): Promise<LocationData> => {
    try {
        console.log("⚠️ Using IP-based location (GPS unavailable)");
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error('IP API failed');

        const data = await response.json();
        if (data.error) throw new Error(data.reason || 'IP API error');

        console.log("📍 IP Location:", data.city, data.region_code);
        console.log("IP Coordinates:", { lat: data.latitude, lng: data.longitude });

        return {
            lat: data.latitude,
            lng: data.longitude,
            name: `${data.city}, ${data.region_code}`,
            source: 'ip'
        };
    } catch (error) {
        console.error("IP Location failed:", error);
        throw new Error('Could not determine location via GPS or IP');
    }
};
