import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Styles/form.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('https://projekt.alsy.cz/login', { username, password });

            if (response.data.verified === false) {
                navigate('/verify', { state: { username } });
            } else {
                localStorage.setItem('token', response.data.token);
                navigate('/table');
            }
        } catch (error) {
            if (error.response && error.response.status === 403) {
                navigate('/verify', { state: { username } });
            } else {
                setError('Login failed. Please check your credentials.');
                console.error('Login failed:', error);
            }
        }
    };

    return (
        <div className="form-container">
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
                <label>Username:</label>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <label>Password:</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Login</button>
            </form>
            {error && <p className="error-message">{error}</p>}
            <button className="link-button" onClick={() => navigate('/register')}>
                Register
            </button>
        </div>
    );
};

export default Login;