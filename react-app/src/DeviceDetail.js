import React, { useState, useEffect } from 'react';

const DeviceDetail = ({ address, onLoadComplete }) => {
    const [deviceData, setDeviceData] = useState(null);

    useEffect(() => {
        let isMounted = true; // Flag pro sledování, zda je komponenta stále aktivní
        const fetchData = async () => {
            try {
                const response = await fetch(`/api/device-detail/${address}`);
                const data = await response.json();

                if (isMounted) { // Pokud je komponenta stále aktivní, nastaví data
                    setDeviceData(data);
                    onLoadComplete();
                }
            } catch (error) {
                console.error('Chyba při načítání dat:', error);
            }
        };

        fetchData();

        return () => {
            isMounted = false; // Nastaví flag na false, když se komponenta odmontuje
        };
    }, [address, onLoadComplete]);

    if (!deviceData) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>Detail zařízení: {deviceData.address}</h1>
            <p>Host Name: {deviceData.hostName}</p>
            <p>DHCP Enabled: {deviceData.isDhcpEnabled ? 'Ano' : 'Ne'}</p>
            <p>Bridge Port: {deviceData.bridgePort}</p>
            <p>MAC Address: {deviceData.macAddress}</p>
        </div>
    );
};

export default DeviceDetail;
