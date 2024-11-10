import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Table from './table';
import DeviceDetail from './DeviceDetail'; // Importujte DeviceDetail komponentu

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Table />} />
                <Route path="/device-detail/:address" element={<DeviceDetail />} />
            </Routes>
        </Router>
    );
}

export default App;
