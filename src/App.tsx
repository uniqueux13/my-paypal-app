import React, { useState } from 'react';
import {
    PayPalScriptProvider,
    PayPalButtons,
    ReactPayPalScriptOptions,
    OnApproveData,
    CreateOrderData,
} from '@paypal/react-paypal-js';
import axios from 'axios';
import './App.css';

function App() {
    const [message, setMessage] = useState<string>('');
    const [error, setError] = useState<string>('');

    // Get Client ID from environment variables
    const initialOptions: ReactPayPalScriptOptions = {
        clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || 'test', // Use 'test' or fail loudly if not set
        currency: 'USD', // Change as needed
        intent: 'capture',
    };

    // Function to call your Netlify function to create an order
    const createOrder = async (data: CreateOrderData) => {
        setMessage('Creating order...');
        setError('');
        try {
            // Replace '/api/create-paypal-order' with your actual function endpoint
            const response = await axios.post('/api/create-paypal-order', {
                // You could pass cart details here if needed
                // For minimal example, amount is hardcoded in the backend function
            });
            setMessage(`Order created with ID: ${response.data.orderID}`);
            return response.data.orderID;
        } catch (err) {
            console.error('Error creating order:', err);
            setError('Failed to create PayPal order.');
            setMessage('');
            // You might want to throw err here to stop the PayPal flow
            throw err; // Rethrow or handle as needed
        }
    };

    // Function to call your Netlify function to capture the order
    const onApprove = async (data: OnApproveData) => {
        setMessage(`Processing payment for order ${data.orderID}...`);
        setError('');
        try {
            // Replace '/api/capture-paypal-order' with your actual function endpoint
            const response = await axios.post('/api/capture-paypal-order', {
                orderID: data.orderID,
            });

            // Handle success (e.g., show confirmation, redirect)
            console.log('Capture result:', response.data);
            setMessage(
                `Payment Successful! Transaction ID: ${
                    response.data.purchase_units[0]?.payments?.captures[0]?.id || 'N/A'
                }`
            );
            setError('');
             // Here you might update your application state, database, etc.

        } catch (err) {
            console.error('Error capturing order:', err);
            setError('Failed to capture PayPal payment.');
            setMessage('');
             // Handle payment failure in your UI
        }
    };

    const onError = (err: any) => {
        console.error('PayPal Button Error:', err);
        setError('An error occurred with the PayPal payment.');
        setMessage('');
    };

    return (
        <div className="App">
            <h1>Minimal PayPal Integration</h1>
            {error && <div style={{ color: 'red' }}>Error: {error}</div>}
            {message && <div style={{ color: 'blue' }}>Status: {message}</div>}

            <PayPalScriptProvider options={initialOptions}>
                <PayPalButtons
                    style={{ layout: 'vertical', color: 'blue', shape: 'rect', label: 'paypal' }}
                    createOrder={createOrder}
                    onApprove={onApprove}
                    onError={onError}
                    disabled={!initialOptions.clientId || initialOptions.clientId === 'test'} // Disable if no client ID
                />
            </PayPalScriptProvider>
            {(!initialOptions.clientId || initialOptions.clientId === 'test') && (
                 <p style={{color: 'orange'}}>Warning: PayPal Client ID not configured in .env file (VITE_PAYPAL_CLIENT_ID).</p>
            )}
        </div>
    );
}

export default App;