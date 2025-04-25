// netlify/functions/capture-paypal-order.js
const { makePayPalAPIRequest } = require('./utils/paypal-api');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { orderID } = JSON.parse(event.body);

        if (!orderID) {
            return { statusCode: 400, body: 'Missing orderID in request body' };
        }

        // Call PayPal API to capture the order
        // The empty body {} is required for POST requests even if no data needed for this specific call
        const captureData = await makePayPalAPIRequest(`/v2/checkout/orders/${orderID}/capture`, 'POST', {});

        // Return the capture details to the frontend
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(captureData), // Send back the full capture details
        };

    } catch (error) {
        console.error('Error capturing PayPal order:', error);
         // Return a structured error response
        return {
            statusCode: error.statusCode || 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error: 'Failed to capture PayPal order.',
                message: error.message,
                paypalDebugId: error.paypalDebugId,
            }),
        };
    }
};