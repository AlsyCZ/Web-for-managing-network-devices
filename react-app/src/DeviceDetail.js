import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';


const DeviceDetail = () => {
    const { address } = useParams(); // Získání parametru 'address' z URL
    const [deviceData, setDeviceData] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/raw-data'); // Použijeme stejný endpoint jako v ArpTable
                const data = await response.json();
                console.log('Raw Data for DeviceDetail:', data);

                // Najdeme ARP záznam podle adresy a doplníme potřebné údaje podobně jako v ArpTable
                const arpEntry = data.arpTable.find(arp => arp.address === address);
                if (arpEntry) {
                    const lease = data.dhcpLeases.find(lease => lease.address === arpEntry.address);
                    const bridge = data.bridgeHosts.find(host => host.macAddress === arpEntry.macAddress);
                    const hostName = lease ? lease.hostName : 'Neznámé zařízení';
                    const bridgePort = bridge ? bridge.interface : 'Není k dispozici';

                    setDeviceData({
                        address: arpEntry.address,
                        macAddress: arpEntry.macAddress || 'Není k dispozici',
                        interface: arpEntry.interface,
                        bridgePort: bridgePort,
                        hostName: hostName || 'Neznámé zařízení',
                    });
                } else {
                    setDeviceData(null);
                }
            } catch (error) {
                console.error('Chyba při načítání dat:', error);
            }
        };

        fetchData();
    }, [address]);

    if (!deviceData) {
        return <div>Loading...</div>;
    }
    const handleBack = () => {
        navigate('/');  // Navigace zpět na hlavní stránku nebo jinou stránku
    };
    return (
        <div>
            <h1>Detail zařízení: {deviceData.address}</h1>
            <p>Host Name: {deviceData.hostName}</p>
            <p>DHCP Enabled: Ano</p> {/* Pro zjednodušení nastaveno na Ano */}
            <p>Bridge Port: {deviceData.bridgePort}</p>
            <p>MAC Address: {deviceData.macAddress}</p>
            <button onClick={handleBack}>Zpět na seznam zařízení</button>
        </div>
    );
};

export default DeviceDetail;
