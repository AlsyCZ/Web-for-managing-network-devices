import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Table from './table';
import Login from './login';
import Register from './register';
import Verify from './verify';
import DeviceDetail from './DeviceDetail';
import LayoutWithNavbar from './LayoutWithNavbar';
import LayoutWithoutNavbar from './LayoutWithoutNavbar';

const App = () => {
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
