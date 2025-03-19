import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SecondaryLogin = () => {
    const navigate = useNavigate();
    const [accessDenied, setAccessDenied] = useState(false);

    useEffect(() => {
        const secondaryLogin = () => {
            const isSecondaryLoggedIn = localStorage.getItem('isSecondaryLoggedIn');

            if (!isSecondaryLoggedIn) {
                const username = prompt('Please enter your username:');
                const password = prompt('Please enter your password:');

                if (
                    username === process.env.REACT_APP_SECONDARY_USERNAME &&
                    password === process.env.REACT_APP_SECONDARY_PASSWORD
                ) {
                    alert('Login successful!');
                    localStorage.setItem('isSecondaryLoggedIn', 'true');
                    navigate('/login');
                } else {
                    alert('Invalid username or password. Access denied.');
                    setAccessDenied(true);
                }
            } else {
                navigate('/login');
            }
        };

        secondaryLogin();
    }, [navigate]);

    if (accessDenied) {
        return <div style={{ textAlign: 'center', marginTop: '50px' }}>Přístup odepřen</div>;
    }

    return null;
};

export default SecondaryLogin;