import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Styles/form.css';

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [passwordretype, setPasswordRetype] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const validatePassword = (password) => {
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
        return passwordRegex.test(password);
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        if (!validatePassword(password)) {
            setError('Password must be at least 8 characters long, contain at least one number, and uppercase letter.');
            return;
        }

        if (password !== passwordretype) {
            setError('Passwords do not match!');
            return;
        }

        try {
            await axios.post('https://projekt.alsy.cz/register', { username, password, email });
            navigate('/verify');
        } catch (error) {
            console.error('Registration failed:', error);
            if (error.response && error.response.data && error.response.data.error) {
                setError(error.response.data.error);
            } else {
                setError('Registration failed. Please try again.');
            }
        }
    };

    return (
        <div className="form-container">
            <h2>Register</h2>
            <form onSubmit={handleRegister}>
                <label>Username:</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
                <label>Password:</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <label>Retype Password:</label>
                <input type="password" value={passwordretype} onChange={(e) => setPasswordRetype(e.target.value)} required />
                <label>Email:</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                {error && <p className="error">{error}</p>}
                <button type="submit">Register</button>
            </form>
            <button className="link-button" onClick={() => navigate('/')}>Back to Login</button>
        </div>
    );
};

export default Register;
