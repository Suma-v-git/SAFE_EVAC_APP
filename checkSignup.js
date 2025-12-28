// using native fetch

// Use native fetch if node 18+
async function testSignup() {
    console.log("Testing Signup...");
    try {
        const response = await fetch('http://localhost:5000/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test User',
                email: `test${Date.now()}@example.com`,
                password: 'password123'
            })
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        const data = await response.json();
        console.log('Response:', data);
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testSignup();
