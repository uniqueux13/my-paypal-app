// netlify/functions/create-paypal-order.js
const { makePayPalAPIRequest } = require('./utils/paypal-api');

exports.handler = async (event, context) => {
    // Basic check: Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // Hardcode order details for this minimal example
        // In a real app, get amount/currency/items from event.body
        const orderData = {
            intent: 'CAPTURE',
            purchase_units: [
                {
                    amount: {
                        currency_code: 'USD', // Or get from request body
                        value: '10.00',     // Or get from request body
                    },
                    // You can add description, items array, etc. here
                    description: "Minimal Test Purchase"
                },
            ],
            // Optional: Add application context like return/cancel URLs
             application_context: {
                 return_url: 'https://YOUR_APP_URL/success', // Replace with your actual success page
                 cancel_url: 'https://YOUR_APP_URL/cancel',  // Replace with your actual cancel page
             }
        };

        // Call PayPal API to create the order
        const paypalResponse = await makePayPalAPIRequest('/v2/checkout/orders', 'POST', orderData);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderID: paypalResponse.id }),
        };
    } catch (error) {
        console.error('Error creating PayPal order:', error);
        // Return a structured error response
        return {
            statusCode: error.statusCode || 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error: 'Failed to create PayPal order.',
                message: error.message, // Provide the specific error message
                paypalDebugId: error.paypalDebugId, // Include debug ID if available
            }),
        };
    }
};