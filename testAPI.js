
import fetch from 'node-fetch';

const fetchShelters = async () => {
    try {
        const response = await fetch('http://localhost:5000/api/shelters');
        const data = await response.json();
        console.log('API Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Fetch error:', error);
    }
};

fetchShelters();
