import React, { useState, useEffect, useRef } from 'react';
import './DeviceDetail.css';

const DeviceDetail = ({ address, onLoadComplete }) => {
    const [deviceData, setDeviceData] = useState(null);
    const [isBanned, setIsBanned] = useState(false);
    const [customIp, setCustomIp] = useState('');
    const [loading, setLoading] = useState(false);
    const intervalIdRef = useRef(null);
    const [firstUse, setFirstUse] = useState(true);
    const [firstUse2, setFirstUse2] = useState(true);

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

                if(firstUse2){
                    setDeviceData(data);  
                    setFirstUse2(false);
                }
                if (data.status === 'bound' && data.address === customIp) {
                    console.log('The device has switched to bound with a new IP, data updated.');
                    setDeviceData(data);  
                    clearInterval(intervalIdRef.current);
                }
            } catch (error) {
                console.error('Error while loading data:', error);
            }
        };
    
        if (firstUse) {
            fetchData(address);
            setFirstUse(false);
        }
    
        intervalIdRef.current = setInterval(() => {
            const ipToCheck = customIp || address;
            console.log('Checking the device status for IP:', ipToCheck);
            fetchData(ipToCheck);
        }, 5000);
    
        return () => {
            clearInterval(intervalIdRef.current);
        };
    }, [address, customIp, firstUse]);
    
    const handleMakeStatic = async () => {
        setLoading(true);
        try {
            const currentIpAddress = deviceData.address;
            const newIpAddress = customIp || deviceData.address;

            console.log('Sending a request to set up a static IP:', newIpAddress);

            const response = await fetch('/api/make-static', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentIpAddress, newIpAddress }),
            });

            if (!response.ok) {
                throw new Error('Error setting static IP address');
            }

            console.log('The request to set a static IP was successful.');

            setCustomIp(newIpAddress);
            setDeviceData((prev) => ({
                ...prev,
                status: 'waiting',
            }));
        } catch (error) {
            console.error('Error setting static IP address:', error);
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
                throw new Error('Error deleting DHCP lease');
            }

            console.log('DHCP lease was deleted');
        } catch (error) {
            console.error('Error deleting DHCP lease:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!deviceData) {
        return <div>Loading...</div>;
    }

    return (
        <div className="device-detail">
            <h1>Device detail: {deviceData.address}</h1>
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
                                    throw new Error('Error while setting IP ban');
                                }

                                console.log(`IP ${newBanState ? 'prohibited' : 'allowed'}`);
                            } catch (error) {
                                console.error('Error sending IP ban request:', error);
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
                    Custom IP address:&nbsp;
                    <input
                        type="text"
                        value={customIp}
                        onChange={(e) => setCustomIp(e.target.value)}
                        placeholder="10.0.1.3-254"
                        className="device-input"
                    />
                </label>
                &nbsp;
                <button
                    className="device-button"
                    onClick={() => {
                        const ipRegex = /^10\.0\.1\.(3[0-9]|[3-9][0-9]|[12][0-9]{2}|254)$/;
                        if (!customIp || ipRegex.test(customIp)) {
                            handleMakeStatic();
                        } else {
                            alert('Invalid IP address! The allowed range is 10.0.1.3 to 10.0.1.254.');
                        }
                    }}
                >
                    Make Static
                </button>
            </div>
            <br />
            <button className="device-button2" onClick={deleteLease}>
                Delete current DHCP Lease
            </button>
        </div>
    );
};

export default DeviceDetail;
