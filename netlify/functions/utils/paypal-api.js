// netlify/functions/utils/paypal-api.js
const fetch = require('node-fetch'); // Use require for CommonJS

// Determine API base based on environment (Sandbox vs. Live)
// You'll set PAYPAL_API_BASE in Netlify Environment Variables
const base = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';

// Function to generate an access token
async function generateAccessToken() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_SECRET; // Get from Netlify env vars

    if (!clientId || !secret) {
        throw new Error('MISSING_API_CREDENTIALS');
    }

    const auth = Buffer.from(`<span class="math-inline">\{clientId\}\:</span>{secret}`).toString('base64');
    const url = `${base}/v1/oauth2/token`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: 'grant_type=client_credentials',
            headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        if (!response.ok) {
             const errorData = await response.text();
             console.error("Failed to get access token:", errorData);
             throw new Error(`Failed to get access token: ${response.statusText}`);
        }

        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error('Error generating PayPal access token:', error);
        throw error; // Re-throw the error to be caught by the calling function
    }
}

// Function to make PayPal API calls
async function makePayPalAPIRequest(endpoint, method = 'GET', body = null) {
    const accessToken = await generateAccessToken();
    const url = `<span class="math-inline">\{base\}</span>{endpoint}`;

    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        // Uncomment one of these if you encounter issues during payment processing
        // 'PayPal-Request-Id': `req-${Date.now()}`, // Unique request ID helps debugging
        // 'Prefer': 'return=representation', // Ask PayPal to return full resource representation
    };

    const options = {
        method,
        headers,
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);
        const data = await response.json(); // Try to parse JSON regardless of status for error details

        if (!response.ok) {
             console.error(`PayPal API Error (${response.status}) for ${method} ${endpoint}:`, data);
             // Construct a more informative error message
             const errorMessage = data.message || data.details?.[0]?.description || `HTTP error ${response.status}`;
             const error = new Error(errorMessage);
             error.statusCode = response.status;
             error.paypalDebugId = response.headers.get('paypal-debug-id'); // Useful for PayPal support
             error.details = data.details; // Include details if available
             throw error;
        }

        return data;
    } catch (error) {
        console.error(`Error during PayPal API request to ${method} ${endpoint}:`, error);
        // Re-throw the processed error or the original fetch error
         throw error instanceof Error ? error : new Error('Network or parsing error during PayPal API call');
    }
}

module.exports = { makePayPalAPIRequest };