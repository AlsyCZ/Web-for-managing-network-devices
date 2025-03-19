import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Styles/navbar.css';
import VLANManager from './VlanManager';
import Dot1x from './dot1x';

const Navbar = () => {
    const [username, setUsername] = useState('');
    const [isVlanModalOpen, setIsVlanModalOpen] = useState(false);
    const [isDot1xModalOpen, setIsDot1xModalOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUsername = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                } else {
                    const response = await fetch('https://projekt.alsy.cz/username', {
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

    const openVlanModal = () => setIsVlanModalOpen(true);
    const closeVlanModal = () => setIsVlanModalOpen(false);

    const openDot1xModal = () => setIsDot1xModalOpen(true);
    const closeDot1xModal = () => setIsDot1xModalOpen(false);

    return (
        <nav className="navbar">
            <div className="navbar-brand" style={{ cursor: 'pointer' }}>
                Network Management Web
            </div>
            <div className="navbar-right">
                {username && <span className="navbar-username">Logged in as: {username}</span>}
                <button className="navbar-button" onClick={openVlanModal}>Edit VLANs</button>
                <button className="navbar-button" onClick={openDot1xModal}>Dot1x</button>
                <button className="navbar-button" onClick={handleLogout}>Logout</button>
            </div>

            {isVlanModalOpen && (
                <div className="modalOverlayStyle">
                    <div className="modalStyle">
                        <VLANManager onClose={closeVlanModal} />
                    </div>
                </div>
            )}

            {isDot1xModalOpen && (
                <div className="modalOverlayStyle">
                    <div className="modalStyle">
                        <Dot1x onClose={closeDot1xModal} />
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;