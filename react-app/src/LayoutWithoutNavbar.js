import React from 'react';
import { Outlet } from 'react-router-dom';

const LayoutWithoutNavbar = () => (
    <div>
        <Outlet />
    </div>
);

export default LayoutWithoutNavbar;
