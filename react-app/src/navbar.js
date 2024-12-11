import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './navbar.css'; // Import the navbar CSS

const Navbar = () => {
    const [username, setUsername] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch username from the server or localStorage
        const fetchUsername = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                } else {
                    const response = await fetch('http://localhost:3001/username', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const data = await response.json();
                    setUsername(data.username);
                }
            } catch (error) {
                console.error('Error fetching username:', error);
            }
        };

        fetchUsername();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">Network Management Web</div>
            <div className="navbar-right">
                {username && <span className="navbar-username">Logged in as: {username}</span>}
                <button className="navbar-button" onClick={handleLogout}>Logout</button>
            </div>
        </nav>
    );
};

export default Navbar;
