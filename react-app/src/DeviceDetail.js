import React, { useState, useEffect } from 'react';

const DeviceDetail = ({ address, onLoadComplete }) => {
    const [deviceData, setDeviceData] = useState(null);
    const [isBanned, setIsBanned] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            try {
                const response = await fetch(`/api/device-detail/${address}`);
                const data = await response.json();

                if (isMounted) {
                    setDeviceData(data);
                    setIsBanned(data.isBanned || false);
                    onLoadComplete();
                }
            } catch (error) {
                console.error('Chyba při načítání dat:', error);
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [address, onLoadComplete]);

    const handleBanChange = async (event) => {
        const newBanState = event.target.checked;
        setIsBanned(newBanState);
        setLoading(true);

        try {
            const response = await fetch('/api/ban-ip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ipAddress: deviceData.address, ban: newBanState }),
            });

            if (!response.ok) {
                throw new Error('Chyba při nastavování IP banu');
            }

            console.log(`IP ${newBanState ? 'zakázána' : 'povolena'}`);
        } catch (error) {
            console.error('Chyba při odesílání požadavku na IP ban:', error);
            setIsBanned(!newBanState);
        } finally {
            setLoading(false);
        }
    };

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
            <div>
                <label>
                    <input
                        type="checkbox"
                        checked={isBanned}
                        onChange={handleBanChange}
                        disabled={loading}
                    />
                    IP Ban
                </label>
            </div>
        </div>
    );
};

export default DeviceDetail;
