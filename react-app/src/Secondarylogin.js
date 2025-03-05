import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SecondaryLogin = () => {
    const navigate = useNavigate();

    useEffect(() => {
        console.log('SecondaryLogin component mounted'); // Logování
        const secondaryLogin = () => {
            console.log('Secondary login prompt triggered'); // Logování
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
                    // Nic se neděje, zůstane bílá obrazovka
                }
            } else {
                navigate('/login'); // Uživatel již prošel sekundárním přihlášením
            }
        };

        secondaryLogin();
    }, [navigate]);

    return null; // Tato komponenta nic nerenderuje
};

export default SecondaryLogin;