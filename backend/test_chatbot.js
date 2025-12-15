// Test script for AI Chatbot endpoint
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = 'http://localhost:5000';

// Test credentials - replace with actual test user or create one
const TEST_USER = {
    email: 'test@example.com',
    password: 'test123'
};

async function testChatbot() {
    try {
        console.log('🧪 Testing AI Chatbot Endpoint...\n');

        // Step 1: Login to get token
        console.log('1️⃣ Logging in...');
        const loginResponse = await axios.post(`${API_URL}/api/auth/login`, TEST_USER);
        const token = loginResponse.data.token;
        console.log('✅ Login successful\n');

        // Step 2: Test chatbot endpoint
        console.log('2️⃣ Sending message to chatbot...');
        const chatResponse = await axios.post(
            `${API_URL}/api/chatbot/message`,
            {
                message: "What's my total spending?",
                conversationHistory: []
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        console.log('✅ Chatbot response received:\n');
        console.log('Reply:', chatResponse.data.reply);
        console.log('\nSuggestions:', chatResponse.data.suggestions);

        // Step 3: Test with conversation history
        console.log('\n3️⃣ Testing with conversation history...');
        const followUpResponse = await axios.post(
            `${API_URL}/api/chatbot/message`,
            {
                message: "How can I save more money?",
                conversationHistory: [
                    { role: 'user', content: "What's my total spending?" },
                    { role: 'assistant', content: chatResponse.data.reply }
                ]
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        console.log('✅ Follow-up response received:\n');
        console.log('Reply:', followUpResponse.data.reply);

        console.log('\n✅ All tests passed!');

    } catch (error) {
        console.error('\n❌ Test failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Message:', error.response.data.message);
            console.error('Error:', error.response.data.error);
        } else {
            console.error(error.message);
        }

        if (error.response?.status === 401) {
            console.log('\n💡 Tip: Make sure the test user exists. You can create one by signing up first.');
        } else if (error.response?.data?.message?.includes('API key')) {
            console.log('\n💡 Tip: Make sure GEMINI_API_KEY is set in your .env file');
            console.log('   Get your API key from: https://aistudio.google.com/app/apikey');
        }
    }
}

// Run the test
testChatbot();
