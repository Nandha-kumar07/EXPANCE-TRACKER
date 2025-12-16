import { strict as assert } from 'assert';

const API_URL = "http://localhost:5000/api";

const randomSuffix = Math.floor(Math.random() * 10000);
const testUser = {
    name: `Test User ${randomSuffix}`,
    email: `test${randomSuffix}@example.com`,
    password: "password123"
};

async function testAuthFlow() {
    console.log("Starting Auth Flow Verification...");
    console.log("Target API:", API_URL);
    console.log("Test User:", testUser);

    try {
        // 1. Signup
        console.log("\n1. Testing Signup...");
        const signupRes = await fetch(`${API_URL}/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(testUser)
        });

        if (!signupRes.ok) {
            const err = await signupRes.text();
            throw new Error(`Signup failed (${signupRes.status}): ${err}`);
        }

        const signupData = await signupRes.json();
        console.log("✅ Signup Successful");
        console.log("Received Token:", !!signupData.token);
        console.log("User ID:", signupData.user.id);

        assert.equal(signupData.user.email, testUser.email, "Signup email mismatch");
        assert.equal(signupData.user.name, testUser.name, "Signup name mismatch");


        // 2. Login
        console.log("\n2. Testing Login...");
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: testUser.email,
                password: testUser.password
            })
        });

        if (!loginRes.ok) {
            const err = await loginRes.text();
            throw new Error(`Login failed (${loginRes.status}): ${err}`);
        }

        const loginData = await loginRes.json();
        console.log("✅ Login Successful");

        assert.equal(loginData.user.email, testUser.email, "Login email mismatch");
        assert.ok(loginData.token, "Login should return a token");
        assert.equal(loginData.user.id, signupData.user.id, "User ID should match across sessions");

        // 3. Verify Persistence verify /me
        console.log("\n3. Testing Persistence (/me)...");
        const meRes = await fetch(`${API_URL}/auth/me`, {
            headers: {
                "Authorization": `Bearer ${loginData.token}`
            }
        });

        if (!meRes.ok) {
            const err = await meRes.text();
            throw new Error(`Me check failed (${meRes.status}): ${err}`);
        }

        const meData = await meRes.json();
        console.log("✅ Persistence Check Successful");
        assert.equal(meData.user.email, testUser.email, "Me email mismatch");

        console.log("\n🎉 ALL TESTS PASSED: Data is being stored and retrieved correctly.");

    } catch (error) {
        console.error("\n❌ TEST FAILED:", error.message);
        process.exit(1);
    }
}

testAuthFlow();
