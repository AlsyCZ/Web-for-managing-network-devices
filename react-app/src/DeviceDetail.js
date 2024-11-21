import React, { useState, useEffect, useRef } from 'react';

const DeviceDetail = ({ address, onLoadComplete }) => {
    const [deviceData, setDeviceData] = useState(null);
    const [isBanned, setIsBanned] = useState(false);
    const [customIp, setCustomIp] = useState('');
    const [loading, setLoading] = useState(false);
    const [isStaticIp, setIsStaticIp] = useState(false); // Track if IP is static
    const intervalIdRef = useRef(null);

    useEffect(() => {
        let isMounted = true;
    
        const fetchData = async (addr) => {
            try {
                const response = await fetch(`/api/device-detail/${addr}`);
                const data = await response.json();
    
                if (isMounted) {
                    // Kontrolujeme, zda je status změněn a aktualizujeme pouze při skutečné změně
                    if (!deviceData || deviceData.address !== data.address || deviceData.status !== data.status) {
                        setDeviceData(data); // Aktualizace stavu s novými daty
                        setIsBanned(data.isBanned || false);
                        onLoadComplete(); // Upozornění na dokončení načítání
                    }
                }
            } catch (error) {
                console.error('Chyba při načítání dat:', error);
            }
        };
    
        fetchData(address); // Inicializace načtení dat
    
        // Nastavení intervalu pro kontrolu změn
        intervalIdRef.current = setInterval(async () => {
            try {
                const ipToCheck = customIp || address;
                const response = await fetch(`/api/device-detail/${ipToCheck}`);
                const data = await response.json();
    
                if (isMounted) {
                    // Pokud je status "bound", vyvoláme fetchData a resetujeme stará data
                    if (data.status === 'bound' && (!deviceData || deviceData.address !== data.address)) {
                        console.log("Status změněn na 'bound', vyvolávám fetchData pro nová data");
                        fetchData(data.address); // Vyvoláme fetchData s novými daty
                    }
                }
            } catch (error) {
                console.error('Chyba při kontrole stavu DHCP lease:', error);
            }
        }, 5000); // Kontrolujeme každých 5 sekund
    
        return () => {
            isMounted = false;
            clearInterval(intervalIdRef.current); // Vymazání intervalu při odpojení komponenty
        };
    }, [address, customIp, deviceData, onLoadComplete]); // Přidání customIp a deviceData do závislostí useEffect
    
    
    
    

    const handleMakeStatic = async () => {
        setLoading(true);
        try {
            const currentIpAddress = deviceData.address;
            const newIpAddress = customIp || deviceData.address;

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
            setIsStaticIp(true); // Mark IP as static
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
                        disabled={loading}
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
                        disabled={loading}
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
                    disabled={loading}
                >
                    Make Static
                </button>
            </div>
            <br></br>
            <button onClick={deleteLease} disabled={loading}>
                Delete current DHCP Lease
            </button>
        </div>
    );
};

export default DeviceDetail;
