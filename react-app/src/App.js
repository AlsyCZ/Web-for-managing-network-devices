import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import Table from './table';
import Login from './login';
import Register from './register';
import Verify from './verify';
import DeviceDetail from './DeviceDetail';
import LayoutWithNavbar from './LayoutWithNavbar';
import LayoutWithoutNavbar from './LayoutWithoutNavbar';

const App = () => {
    const navigate = useNavigate();

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
                } else {
                    alert('Invalid username or password. Access denied.');
                    navigate('/login'); // Přesměrování na přihlašovací stránku
                }
            }
        };

        secondaryLogin();
    }, [navigate]);

    return (
        <Router>
            <Routes>
                <Route element={<LayoutWithoutNavbar />}>
                    <Route path="/" element={<Login />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/verify" element={<Verify />} />
                </Route>
                <Route element={<LayoutWithNavbar />}>
                    <Route path="/table" element={<Table />} />
                    <Route path="/device-detail/:address" element={<DeviceDetail />} />
                </Route>
            </Routes>
        </Router>
    );
};

export default App;