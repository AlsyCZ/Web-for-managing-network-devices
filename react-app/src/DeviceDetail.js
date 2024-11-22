import React, { useState, useEffect, useRef } from 'react';

const DeviceDetail = ({ address, onLoadComplete }) => {
    const [deviceData, setDeviceData] = useState(null);
    const [isBanned, setIsBanned] = useState(false);
    const [customIp, setCustomIp] = useState('');
    const [loading, setLoading] = useState(false);
    const intervalIdRef = useRef(null);
    const [firstUse, setFirstUse] = useState(true); // Stav pro sledování prvního načítání
    const [firstUse2, setFirstUse2] = useState(true); // Stav pro sledování prvního načítání

    useEffect(() => {
        const fetchData = async (addr) => {
            console.log('Fetching data for address:', addr);
            try {
                const response = await fetch(`/api/device-detail/${addr}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }
                const data = await response.json();
                console.log('Fetched data:', data);
                onLoadComplete();
                // Nejprve aktualizujeme data bez ohledu na stav
                if(firstUse2){
                    setDeviceData(data);  
                    setFirstUse2(false);
                }
                // Kontrola, jestli je zařízení v požadovaném stavu 'bound' a odpovídá IP
                if (data.status === 'bound' && data.address === customIp) {
                    console.log('Zařízení přešlo na bound s novou IP, data aktualizována.');
                    setDeviceData(data);  
                    clearInterval(intervalIdRef.current);  // Ukončení intervalového sledování
                }
            } catch (error) {
                console.error('Chyba při načítání dat:', error);
            }
        };
    
        // První načtení dat
        if (firstUse) {
            fetchData(address);
            setFirstUse(false);

        }
    
        intervalIdRef.current = setInterval(() => {
            const ipToCheck = customIp || address; // Sledujeme buď novou, nebo původní IP
            console.log('Kontroluji stav zařízení pro IP:', ipToCheck);
            fetchData(ipToCheck);
        }, 5000);
    
        return () => {
            clearInterval(intervalIdRef.current);
        };
    }, [address, customIp, firstUse]); // Přidali jsme `firstUse` pro správnou reaktivitu
    

    const handleMakeStatic = async () => {
        setLoading(true);
        try {
            const currentIpAddress = deviceData.address;
            const newIpAddress = customIp || deviceData.address;

            console.log('Odesílám požadavek na nastavení statické IP:', newIpAddress);

            const response = await fetch('/api/make-static', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentIpAddress, newIpAddress }),
            });

            if (!response.ok) {
                throw new Error('Chyba při nastavování statické IP adresy');
            }

            console.log('Požadavek na nastavení statické IP byl úspěšný.');

            // Aktualizujeme sledovanou IP ihned po změně
            setCustomIp(newIpAddress);
            setDeviceData((prev) => ({
                ...prev,
                status: 'waiting', // Přechodný stav
            }));
        } catch (error) {
            console.error('Chyba při nastavování statické IP adresy:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteLease = async () => {
        setLoading(true);
        try {
            const ipAddress = deviceData.address;
            const response = await fetch('/api/delete-lease', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ipAddress }),
            });

            if (!response.ok) {
                throw new Error('Chyba při mazání DHCP lease');
            }

            console.log('DHCP lease smazán');
        } catch (error) {
            console.error('Chyba při mazání DHCP lease:', error);
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
                <br />
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
                <button
                    onClick={() => {
                        const ipRegex = /^10\.0\.1\.(3[0-9]|[3-9][0-9]|[12][0-9]{2}|254)$/;
                        if (!customIp || ipRegex.test(customIp)) {
                            handleMakeStatic();
                        } else {
                            alert('Neplatná IP adresa! Povolený rozsah je 10.0.1.3 až 10.0.1.254.');
                        }
                    }}
                >
                    Make Static
                </button>
            </div>
            <br />
            <button onClick={deleteLease}>Delete current DHCP Lease</button>
        </div>
    );
};

export default DeviceDetail;
