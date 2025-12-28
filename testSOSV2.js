import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'test_sos_v2@example.com';

async function runTest() {
    try {
        console.log('--- Starting SOS V2 Verification ---');

        // 1. Signup/Ensure User Exists
        console.log('\n1. Creating/Checking User...');
        let signupRes = await fetch(`${BASE_URL}/api/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test User V2',
                email: TEST_EMAIL,
                password: 'password123'
            })
        });

        // If 400, user exists, which is fine
        if (signupRes.status === 400) {
            console.log('User already exists (expected if re-running).');
        } else if (!signupRes.ok) {
            throw new Error(`Signup failed: ${signupRes.statusText}`);
        } else {
            console.log('User created.');
        }

        // 2. Update Profile with 2 Emails
        console.log('\n2. Updating Profile with 2 Emergency Emails...');
        const profileUpdateRes = await fetch(`${BASE_URL}/api/profile/${TEST_EMAIL}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test User V2',
                password: 'password123',
                emergencyEmail1: 'contact1@example.com',
                emergencyEmail2: 'contact2@example.com'
            })
        });

        const profileData = await profileUpdateRes.json();
        if (!profileUpdateRes.ok) throw new Error(`Profile update failed: ${JSON.stringify(profileData)}`);

        console.log('Profile updated. Verifying response content...');
        if (profileData.user.emergencyEmail1 === 'contact1@example.com' && profileData.user.emergencyEmail2 === 'contact2@example.com') {
            console.log('✅ Emergency emails persisted correctly.');
        } else {
            throw new Error(`Persistence failed. Got: ${JSON.stringify(profileData.user)}`);
        }

        // 3. Trigger SOS
        console.log('\n3. Triggering SOS Alert...');
        const sosRes = await fetch(`${BASE_URL}/api/sos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: TEST_EMAIL,
                location: 'Test Location V2'
            })
        });

        const sosData = await sosRes.json();
        console.log('SOS Response:', sosData);

        if (sosRes.ok) {
            // Check if message mentions both emails
            if (sosData.message.includes('contact1@example.com') && sosData.message.includes('contact2@example.com')) {
                console.log('✅ SOS sent to BOTH contacts successfully!');
            } else {
                console.warn('⚠️ SOS success but response message might not mention both emails. Check server logs.');
            }
        } else {
            throw new Error(`SOS failed: ${JSON.stringify(sosData)}`);
        }

    } catch (error) {
        console.error('❌ Test Failed:', error);
        process.exit(1);
    }
}

runTest();
