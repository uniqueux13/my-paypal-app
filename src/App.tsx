import { useState } from 'react';
import {
    PayPalScriptProvider,
    PayPalButtons,
    ReactPayPalScriptOptions,
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

    const createOrder = async () => {
        setMessage('Creating order...');
        setError('');
        try {
            const response = await axios.post('/api/create-paypal-order', {});
            setMessage(`Order created with ID: ${response.data.orderID}`);
            return response.data.orderID;
        } catch (err) {
            console.error('Error creating order:', err);
            setError('Failed to create PayPal order.');
            setMessage('');
            throw err;
        }
    };

    const onApprove = async (data: any,) => {
        setMessage(`Processing payment for order ${data.orderID}...`);
        setError('');
        try {
            const response = await axios.post('/api/capture-paypal-order', {
                orderID: data.orderID,
            });

            console.log('Capture result:', response.data);
            const transactionId = response.data?.purchase_units?.[0]?.payments?.captures?.[0]?.id;
            setMessage(
                `Payment Successful! ${transactionId ? `Transaction ID: ${transactionId}` : ''}`
            );
            setError('');

        } catch (err: any) {
             console.error('Error capturing order:', err);
             const errorMsg = err.response?.data?.message || err.message || 'Failed to capture PayPal payment.';
             setError(errorMsg);
             setMessage('');
             if (err.response?.data?.name === 'INSTRUMENT_DECLINED') {
                 console.warn("Payment instrument declined.")
             }
        }
    };


    const onError = (err: any) => {
        console.error('PayPal Button Error:', err);
        const message = typeof err === 'object' && err !== null && 'message' in err ? err.message : 'An error occurred with the PayPal payment.';
        setError(String(message));
        setMessage('');
    };

    return (
        <div className="App">
            <h1>Minimal PayPal Integration</h1>
            {error && <div style={{ color: 'red' }}>Error: {error}</div>}
            {message && <div style={{ color: 'blue' }}>Status: {message}</div>}

            <PayPalScriptProvider options={initialOptions}>
                {(!initialOptions.clientId || initialOptions.clientId === 'test') ? (
                     <p style={{color: 'orange'}}>Warning: PayPal Client ID not configured.</p>
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