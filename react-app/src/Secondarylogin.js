import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SecondaryLogin = () => {
    const navigate = useNavigate();
    const [accessDenied, setAccessDenied] = useState(false);

    useEffect(() => {
        const secondaryLogin = () => {
            // Zkontrolujte, zda uživatel již provedl sekundární přihlášení
            const isSecondaryLoggedIn = localStorage.getItem('isSecondaryLoggedIn');

            if (!isSecondaryLoggedIn) {
                const username = prompt('Please enter your username:');
                const password = prompt('Please enter your password:');

                if (
                    username === process.env.REACT_APP_SECONDARY_USERNAME &&
                    password === process.env.REACT_APP_SECONDARY_PASSWORD
                ) {
                    alert('Login successful!');
                    localStorage.setItem('isSecondaryLoggedIn', 'true'); // Uložení stavu
                    navigate('/login'); // Přesměrování na přihlašovací stránku
                } else {
                    alert('Invalid username or password. Access denied.');
                    setAccessDenied(true); // Zobrazí zprávu "Přístup odepřen"
                }
            } else {
                navigate('/login'); // Uživatel již prošel sekundárním přihlášením
            }
        };

        secondaryLogin();
    }, [navigate]);

    if (accessDenied) {
        return <div style={{ textAlign: 'center', marginTop: '50px' }}>Přístup odepřen</div>;
    }

    return null; // Tato komponenta nic nerenderuje
};

export default SecondaryLogin;