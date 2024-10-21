import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';

const DeviceDetail = () => {
    const { address } = useParams();
    const [device, setDevice] = useState(null);
    const [staticIp, setStaticIp] = useState('');
    const [isDhcpEnabled, setIsDhcpEnabled] = useState(true);
    const history = useHistory();

    useEffect(() => {
        const fetchDeviceData = async () => {
            try {
                const response = await fetch(`/api/device/${address}`);
                const data = await response.json();
                setDevice(data);
                setStaticIp(data.address);
                setIsDhcpEnabled(data.isDhcpEnabled);
            } catch (error) {
                console.error('Chyba při načítání dat o zařízení:', error);
            }
        };

        fetchDeviceData();
    }, [address]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(`/api/update-device`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ address, staticIp, isDhcpEnabled })
            });

            if (response.ok) {
                alert('Zařízení úspěšně aktualizováno');
                history.push('/');
            } else {
                alert('Aktualizace zařízení selhala');
            }
        } catch (error) {
            console.error('Chyba při aktualizaci zařízení:', error);
        }
    };

    return (
        <div className="container mt-5">
            {device ? (
                <>
                    <h2>Detail zařízení: {device.hostName}</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="ipAddress" className="form-label">IP Adresa</label>
                            <input
                                type="text"
                                className="form-control"
                                id="ipAddress"
                                value={staticIp}
                                onChange={(e) => setStaticIp(e.target.value)}
                                disabled={isDhcpEnabled}
                            />
                        </div>
                        <div className="form-check mb-3">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                id="dhcpCheck"
                                checked={isDhcpEnabled}
                                onChange={() => setIsDhcpEnabled(!isDhcpEnabled)}
                            />
                            <label className="form-check-label" htmlFor="dhcpCheck">
                                Povolit DHCP
                            </label>
                        </div>
                        <button type="submit" className="btn btn-primary">Aktualizovat zařízení</button>
                    </form>
                </>
            ) : (
                <p>Načítám data o zařízení...</p>
            )}
        </div>
    );
};

export default DeviceDetail;
