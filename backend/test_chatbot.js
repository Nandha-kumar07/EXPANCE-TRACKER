// Test script for AI Chatbot endpoint
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = 'http://localhost:5000';

const TEST_USER = {
    email: 'test@example.com',
    password: 'test123'
};

async function testChatbot() {
    try {
        console.log('Testing Chatbot Endpoint...\n');

        console.log('Logging in...');
        const loginResponse = await axios.post(`${API_URL}/api/auth/login`, TEST_USER);
        const token = loginResponse.data.token;
        console.log('Login successful\n');

        console.log('Sending message to chatbot...');
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

        console.log('Chatbot response received:\n');
        console.log('Reply:', chatResponse.data.reply);
        console.log('\nSuggestions:', chatResponse.data.suggestions);

        console.log('\nTesting with conversation history...');
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

        console.log('Follow-up response received:\n');
        console.log('Reply:', followUpResponse.data.reply);

        console.log('\nAll tests passed!');

    } catch (error) {
        console.error('\nTest failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Message:', error.response.data.message);
        } else {
            console.error(error.message);
        }
    }
}

testChatbot();
