import React, { useState, useEffect } from 'react';

const DeviceDetail = ({ address, onLoadComplete }) => { // Add 'onLoadComplete' as a prop
    const [deviceData, setDeviceData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/raw-data');
                const data = await response.json();
                console.log('Raw Data for DeviceDetail:', data);
    
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
                    onLoadComplete(); // Notify parent that data is loaded
                } else {
                    setDeviceData(null);
                }
            } catch (error) {
                console.error('Chyba při načítání dat:', error);
            }
        };
    
        fetchData();
    }, [address, onLoadComplete]);  // onLoadComplete added as a dependency

    if (!deviceData) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>Detail zařízení: {deviceData.address}</h1>
            <p>Host Name: {deviceData.hostName}</p>
            <p>DHCP Enabled: Ano</p>
            <p>Bridge Port: {deviceData.bridgePort}</p>
            <p>MAC Address: {deviceData.macAddress}</p>
        </div>
    );
};

export default DeviceDetail;
