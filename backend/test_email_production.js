const API_URL = "https://expance-tracker-3.onrender.com/api";

async function testForgotPassword() {
    console.log("Testing Forgot Password on:", API_URL);

    // Use an email that likely exists or use a dummy one to trigger the attempt
    const email = "nandhakumar.p2023eee@gmail.com";

    try {
        const res = await fetch(`${API_URL}/auth/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });

        const data = await res.json();

        if (!res.ok) {
            console.error("\n❌ Request Failed!");
            console.error("Status:", res.status);
            console.error("Message:", data.message);
            if (data.error) console.error("Error Detail:", data.error);
        } else {
            console.log("\n✅ Success:", data.message);
        }

    } catch (err) {
        console.error("Network Error:", err.message);
    }
}

testForgotPassword();
