import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './form.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:3001/login', { username, password });
            localStorage.setItem('token', response.data.token);
            navigate('/table');
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    return (
        <div className="form-container">
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
                <label>Username:</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
                <label>Password:</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit">Login</button>
            </form>
            <button className="link-button" onClick={() => navigate('/register')}>Register</button>
        </div>
    );
};

export default Login;
