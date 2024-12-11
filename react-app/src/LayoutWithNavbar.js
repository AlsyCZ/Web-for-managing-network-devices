import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './navbar';

const LayoutWithNavbar = () => (
    <div>
        <Navbar />
        <Outlet />
    </div>
);

export default LayoutWithNavbar;
