import React, { useEffect, useState } from 'react';

const ArpTable = () => {
    const [arpEntries, setArpEntries] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/raw-data');
                const data = await response.json();
                console.log('Raw Data:', data);

                const arpTable = data.arpTable.map(arp => {
                    const lease = data.dhcpLeases.find(lease => lease['address'] === arp['address']);
                    const bridge = data.bridgeHosts.find(host => host['macAddress'] === arp['macAddress']);
                    const hostName = lease ? lease['hostName'] : 'Neznámé zařízení';
                    const bridgePort = bridge ? bridge['interface'] : 'Není k dispozici';
                    
                    return {
                        address: arp['address'],
                        macAddress: arp['macAddress'] || 'Není k dispozici',
                        interface: arp['interface'],
                        bridgePort: bridgePort,
                        hostName: hostName || 'Neznámé zařízení',
                        status: arp['status']
                    };
                });
                console.log('ARP Table:', data.arpTable);
                console.log('DHCP Leases:', data.dhcpLeases);
                console.log('Bridge Hosts:', data.bridgeHosts);
                
                console.log('Combined Data:', arpTable);
                setArpEntries(arpTable);
            } catch (error) {
                console.error('Chyba při načítání dat:', error);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="container mt-5">
            <h1 className="text-center">ARP Tabulka</h1>
            <table className="table table-bordered">
                <thead>
                    <tr>
                        <th>IP Adresa</th>
                        <th>MAC Adresa</th>
                        <th>Interface</th>
                        <th>Bridge Port</th>
                        <th>Host Name</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {arpEntries.map((entry, index) => (
                        <tr key={index}>
                            <td>{entry.address}</td>
                            <td>{entry.macAddress}</td>
                            <td>{entry.interface}</td>
                            <td>{entry.bridgePort}</td>
                            <td>{entry.hostName}</td>
                            <td>{entry.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ArpTable;
