
export interface WeatherData {
    temp: number;
    description: string;
    windSpeed: number;
    conditionCode: number;
    updatedAt: string;
}

/**
 * Fetches real-time weather data from Open-Meteo API
 */
export const fetchWeatherData = async (lat: number, lng: number): Promise<WeatherData | null> => {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&wind_speed_unit=kmh`;
        const response = await fetch(url);

        if (!response.ok) throw new Error('Weather API error');

        const data = await response.json();
        const current = data.current;

        return {
            temp: Math.round(current.temperature_2m),
            description: getWeatherDescription(current.weather_code),
            windSpeed: Math.round(current.wind_speed_10m),
            conditionCode: current.weather_code,
            updatedAt: new Date().toISOString()
        };
    } catch (error) {
        console.error("Failed to fetch weather:", error);
        return null;
    }
};

/**
 * Maps WMO Weather Interpretation Codes (WW) to readable descriptions
 * https://open-meteo.com/en/docs
 */
const getWeatherDescription = (code: number): string => {
    const codes: Record<number, string> = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Fog',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        71: 'Slight snow fall',
        73: 'Moderate snow fall',
        75: 'Heavy snow fall',
        80: 'Slight rain showers',
        81: 'Moderate rain showers',
        82: 'Violent rain showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with slight hail',
        99: 'Thunderstorm with heavy hail',
    };

    return codes[code] || 'Unknown';
};
