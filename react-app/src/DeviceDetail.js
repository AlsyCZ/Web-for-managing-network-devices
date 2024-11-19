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
    

    const handleMakeStatic = async () => {
        setLoading(true);
    
        try {
            const response = await fetch('/api/make-static', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ipAddress: deviceData.address }), // Odesílá IP adresu
            });
    
            if (response.ok) {
                setIsStatic(true); // Změní stav na "statickou" IP
                setDeviceData(prevData => ({ ...prevData, isDhcpEnabled: false }));
                console.log('IP adresa byla nastavena jako statická');
            } else {
                throw new Error('Chyba při nastavování statické IP adresy');
            }
        } catch (error) {
            console.error('Chyba při nastavování statické IP adresy:', error);
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
                <button onClick={handleMakeStatic} disabled={loading || isStatic}>
                    {isStatic ? 'IP is Static' : 'Make Static'}
                </button>
            </div>
        </div>
    );
};

export default DeviceDetail;
