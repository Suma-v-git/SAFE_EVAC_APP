// API Configuration for SafeEvac
// Automatically detects the correct backend URL based on environment

/**
 * Determines the correct API URL based on the current environment
 * - Development: Uses localhost
 * - Production/Mobile: Uses network IP or environment variable
 */
const getApiUrl = (): string => {
    const hostname = window.location.hostname;

    // Always use relative paths for localhost to work with Vite proxy
    // This allows HTTPS frontend to communicate with HTTP backend via proxy
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return ''; // Relative path - Vite proxy will forward to http://localhost:3000
    }

    // For all public/cloud environments (Netlify, mobile testing on IP),
    // use relative paths to avoid port/domain mismatch issues.
    return '';
};

export const API_URL = getApiUrl();

// Centralized API endpoints
export const API_ENDPOINTS = {
    signup: `${API_URL}/api/signup`,
    login: `${API_URL}/api/login`,
    profile: (email: string) => `${API_URL}/api/profile/${email}`,
    sos: `${API_URL}/api/sos`,
    shelters: `${API_URL}/api/shelters`,
};

// Log the API URL in development for debugging
if (import.meta.env.DEV) {
    console.log('🔗 API URL:', API_URL);
    console.log('📍 Current hostname:', window.location.hostname);
}
