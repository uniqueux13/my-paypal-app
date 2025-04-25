import React, { useState } from 'react';
import {
    PayPalScriptProvider,
    PayPalButtons,
    ReactPayPalScriptOptions,
    // Removed: OnApproveData,
    // Removed: CreateOrderData,
    // You might still need action types if you interact with the 'actions' parameter directly
    // e.g., import type { OnApproveActions, CreateOrderActions } from '@paypal/react-paypal-js';
} from '@paypal/react-paypal-js';
import axios from 'axios';
import './App.css';

function App() {
    const [message, setMessage] = useState<string>('');
    const [error, setError] = useState<string>('');

    const initialOptions: ReactPayPalScriptOptions = {
        clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || 'test',
        currency: 'USD',
        intent: 'capture',
    };

    // Let TypeScript infer 'data' and 'actions' types from the context (PayPalButtons prop)
    // The second parameter 'actions' provides functions like actions.order.capture() (if doing client-side capture)
    // or actions.order.create() (if doing client-side creation). We are doing server-side, so we primarily use 'data'.
    const createOrder = async (data: any, actions: any) => { // Use 'any' or remove type annotation entirely
        setMessage('Creating order...');
        setError('');
        try {
            const response = await axios.post('/api/create-paypal-order', {});
            setMessage(`Order created with ID: ${response.data.orderID}`);
            // The createOrder function for server-side integration must return the Order ID
            return response.data.orderID;
        } catch (err) {
            console.error('Error creating order:', err);
            setError('Failed to create PayPal order.');
            setMessage('');
            throw err; // Propagate error to PayPal SDK
        }
    };

    // Let TypeScript infer 'data' and 'actions' types
    // 'data' contains { orderID: string, payerID?: string, etc. }
    // 'actions' might contain actions.order.capture(), actions.redirect() etc.
    const onApprove = async (data: any, actions: any) => { // Use 'any' or remove type annotation entirely
        setMessage(`Processing payment for order ${data.orderID}...`);
        setError('');
        try {
            // Use data.orderID which is passed by the PayPal script
            const response = await axios.post('/api/capture-paypal-order', {
                orderID: data.orderID,
            });

            console.log('Capture result:', response.data);
            // Check the actual structure of response.data based on your Netlify function's return
             const transactionId = response.data?.purchase_units?.[0]?.payments?.captures?.[0]?.id;
            setMessage(
                `Payment Successful! ${transactionId ? `Transaction ID: ${transactionId}` : ''}`
            );
            setError('');

        } catch (err: any) { // Catch potential errors, including from axios response
             console.error('Error capturing order:', err);
             const errorMsg = err.response?.data?.message || err.message || 'Failed to capture PayPal payment.';
             setError(errorMsg);
             setMessage('');
            // Optionally rethrow or handle specific PayPal errors (like INSTRUMENT_DECLINED)
             if (err.response?.data?.name === 'INSTRUMENT_DECLINED') {
                 // Handle declined payment, maybe using actions.restart() if applicable or showing a specific message
                 console.warn("Payment instrument declined.")
                 // return actions.restart(); // Example if using client-side flow actions
             }
        }
    };


    const onError = (err: any) => {
        console.error('PayPal Button Error:', err);
        // Extract a more specific error message if available
        const message = typeof err === 'object' && err !== null && 'message' in err ? err.message : 'An error occurred with the PayPal payment.';
        setError(String(message)); // Ensure it's a string
        setMessage('');
    };

    return (
        <div className="App">
            <h1>Minimal PayPal Integration</h1>
            {error && <div style={{ color: 'red' }}>Error: {error}</div>}
            {message && <div style={{ color: 'blue' }}>Status: {message}</div>}

            <PayPalScriptProvider options={initialOptions}>
                {(!initialOptions.clientId || initialOptions.clientId === 'test') ? (
                     <p style={{color: 'orange'}}>Warning: PayPal Client ID not configured in .env file (VITE_PAYPAL_CLIENT_ID).</p>
                ) : (
                    <PayPalButtons
                        style={{ layout: 'vertical', color: 'blue', shape: 'rect', label: 'paypal' }}
                        createOrder={createOrder}
                        onApprove={onApprove}
                        onError={onError}
                    />
                 )}
            </PayPalScriptProvider>

        </div>
    );
}

export default App;