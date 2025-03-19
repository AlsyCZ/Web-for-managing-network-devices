import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Table from './table';
import Login from './login';
import Register from './register';
import Verify from './verify';
import DeviceDetail from './DeviceDetail';
import LayoutWithNavbar from './LayoutWithNavbar';
import LayoutWithoutNavbar from './LayoutWithoutNavbar';

const App = () => {
    const [isSecondaryLoggedIn, setIsSecondaryLoggedIn] = useState(false);

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
                    setIsSecondaryLoggedIn(true);
                } else {
                    alert('Invalid username or password. Access denied.');
                }
            } else {
                setIsSecondaryLoggedIn(true);
            }
        };

        secondaryLogin();
    }, []);


    if (!isSecondaryLoggedIn) {
        return null;
    }

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
