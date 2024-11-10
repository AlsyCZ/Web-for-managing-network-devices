import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';  // Změna na useNavigate pro React Router v6

const ArpTable = () => {
    const [arpEntries, setArpEntries] = useState([]);
    const navigate = useNavigate();  // Použijte navigate místo history

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
                setArpEntries(arpTable);
            } catch (error) {
                console.error('Chyba při načítání dat:', error);
            }
        };

        fetchData();
    }, []);

    const handleDelete = async (address) => {
        try {
            const response = await fetch(`/api/delete-arp/${address}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                console.log('ARP záznam byl úspěšně smazán');
                setArpEntries(arpEntries.filter(entry => entry.address !== address));
            } else {
                console.error('Chyba při mazání ARP záznamu');
            }
        } catch (error) {
            console.error('Chyba při mazání ARP položky:', error);
        }
    };

    const handleEdit = (address) => {
        navigate(`/device-detail/${address}`);  // Použijte navigate pro přesměrování

    };
    
    return (
        <table className="table table-bordered">
            <thead>
                <tr>
                    <th>IP Address</th>
                    <th>MAC Address</th>
                    <th>Interface</th>
                    <th>Bridge Port</th>
                    <th>Host Name</th>
                    <th>Status</th>
                    <th>Action</th>
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
                        <td>
                            <button onClick={() => handleDelete(entry.address)}>Smazat</button>
                            &ensp;
                            <button onClick={() => handleEdit(entry.address)}>Upravit</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default ArpTable;
