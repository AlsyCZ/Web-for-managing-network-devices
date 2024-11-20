import React, { useState, useEffect } from 'react';

const DeviceDetail = ({ address, onLoadComplete }) => {
    const [deviceData, setDeviceData] = useState(null);
    const [isBanned, setIsBanned] = useState(false);
    const [customIp, setCustomIp] = useState('');

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

    const handleMakeStatic = async () => {

        try {
            const currentIpAddress = deviceData.address; // aktuální IP adresa
            const newIpAddress = customIp || deviceData.address; // nová nebo aktuální IP adresa
            console.log('Sending request with current IP:', currentIpAddress, 'and new IP:', newIpAddress);
            const response = await fetch('/api/make-static', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentIpAddress, newIpAddress }),
            });

            if (!response.ok) {
                throw new Error('Chyba při nastavování statické IP adresy');
            }

            console.log('IP adresa byla nastavena jako statická');
        } catch (error) {
            console.error('Chyba při nastavování statické IP adresy:', error);
        }
    };

    const deleteLease = async () => {

        try {
            const ipAddress = deviceData.address; // aktuální IP adresa
            const response = await fetch('/api/delete-lease', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ipAddress }),
            });

            if (!response.ok) {
                throw new Error('Chyba při mazání DHCP lease');
            }
        } catch (error) {
            console.error('Chyba při mazání DHCP lease:', error);
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
                            }
                        }}
                    />
                    &nbsp; IP internet ban
                </label>
            </div>
            <div>
            <br></br>
                <label>
                    Vlastní IP adresa:&nbsp;
                    <input
                        type="text"
                        value={customIp}
                        onChange={(e) => setCustomIp(e.target.value)}
                        placeholder="10.0.1.3-254"
                    />
                </label>
                &nbsp;
                <button onClick={handleMakeStatic}>
                    Make Static
                </button>
            </div>
            <br></br>
            <button onClick={deleteLease}>
                Delete current DHCP Lease
            </button>
        </div>
    );
};

export default DeviceDetail;
