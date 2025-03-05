import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Styles/form.css';

const Verify = () => {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleVerify = async () => {
        try {
            const response = await fetch('https://web-for-managing-network-devices-production.up.railway.app//verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ otp })
            });

            const data = await response.json();
            if (response.ok) {
                navigate('/login');
            } else {
                setError(data.message || 'Neplatný kód OTP');
            }
        } catch (error) {
            setError('Chyba při ověřování.');
        }
    };

    return (
        <div className="form-container">
            <h2>Verify email</h2>
            <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
            />
            <button onClick={handleVerify}>Verify</button>
            <button className="link-button" onClick={() => navigate('/')}>
                Back to Login
            </button>
            {error && <p className="error">{error}</p>}
        </div>
    );
};

export default Verify;