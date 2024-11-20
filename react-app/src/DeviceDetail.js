import React, { useState, useEffect } from 'react';

const DeviceDetail = ({ address, onLoadComplete }) => {
    const [deviceData, setDeviceData] = useState(null);
    const [isBanned, setIsBanned] = useState(false);
    const [isStatic, setIsStatic] = useState(false); // Track if the IP is static
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
                    setIsStatic(data.isDhcpEnabled === false); // Pokud je DHCP zakázáno, je IP adresa statická
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
    

    const handleMakeStatic = async (ipAddress) => {
        console.log('Sending request with IP:', ipAddress); // Přidání logu
        try {
            const response = await fetch('http://localhost:3000/api/make-static', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ipAddress: ipAddress }),
            });
    
            if (!response.ok) {
                throw new Error('Failed to make IP static');
            }
    
            // Zde můžete např. aktualizovat stav komponenty na základě nové odpovědi
        } catch (error) {
            console.error('Error while making IP static:', error);
        }
    };
    
    

    if (!deviceData) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>Detail zařízení: {deviceData.address}</h1>
            <p>Host Name: {deviceData.hostName}</p>
            <p>Bridge Port: {deviceData.bridgePort}</p>
            <p>MAC Address: {deviceData.macAddress}</p>
            <div>
                <label>
                    <input
                        type="checkbox"
                        checked={isBanned}
                        onChange={async (event) => {
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
                        }}
                        disabled={loading}
                    />
                    &nbsp; IP internet ban
                </label>
            </div>
            <div>
                <button onClick={() => handleMakeStatic(deviceData.address)}>
                    Make Static
                </button>
            </div>
        </div>
    );
};

export default DeviceDetail;
