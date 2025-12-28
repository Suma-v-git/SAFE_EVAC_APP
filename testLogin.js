
async function testLogin() {
    try {
        console.log("Attempting to connect to http://localhost:3000/api/login...");
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@example.com', password: 'wrongpassword' })
        });

        console.log("Status:", response.status);
        const data = await response.json();
        console.log("Response:", data);
    } catch (error) {
        console.error("Fetch Error:", error.cause || error);
    }
}

testLogin();
