import React, { useEffect, useState } from 'react';
import DeviceDetail from './DeviceDetail';

const ArpTable = () => {
    const [arpEntries, setArpEntries] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        try {
            const response = await fetch('/api/raw-data');
            const data = await response.json();
            const arpTable = data.arpTable.map((arp) => {
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
            console.error('Chyba při získávání dat:', error);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Aktualizace každých 10 sekund
        return () => clearInterval(interval);
    }, []);

    const handleDelete = async (address) => {
        try {
            const response = await fetch(`/api/delete-arp/${address}`, { method: 'DELETE' });
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
    const getVLANs = async () => {
        try {
            const response = await fetch('/api/get-vlans');
            if (!response.ok) {
                throw new Error('Failed to fetch VLANs');
            }
    
            const data = await response.json();
            console.log('VLANs:', data);
            return data;  // Vrátí seznam všech VLAN
        } catch (error) {
            console.error('Error fetching VLANs:', error);
        }
    };
    const assignDeviceToVLAN = async (deviceId, vlanId) => {
        try {
            const response = await fetch('/api/assign-device', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceId, vlanId }),
            });
    
            if (!response.ok) {
                throw new Error('Failed to assign device to VLAN');
            }
    
            const data = await response.json();
            console.log('Device assigned to VLAN:', data);
            return data;  // Vrátí výsledek přiřazení zařízení
        } catch (error) {
            console.error('Error assigning device to VLAN:', error);
        }
    };
    const createVLAN = async (vlanId, name) => {
        try {
            const response = await fetch('/api/create-vlan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vlanId, name }),
            });
    
            if (!response.ok) {
                throw new Error('Failed to create VLAN');
            }
    
            const data = await response.json();
            console.log('VLAN created:', data);
            return data;  // Vrátí vytvořenou VLAN
        } catch (error) {
            console.error('Error creating VLAN:', error);
        }
    };
    
    const handleEdit = (address) => {
        setSelectedAddress(address);
        setIsModalOpen(true);
        setLoading(true); // Start loading when opening the modal
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setLoading(false); // Reset loading when closing the modal
        setSelectedAddress(null); // Resetuje adresu při zavírání modalu
    };

    const handleLoadComplete = () => {
        setLoading(false); // Stop loading when DeviceDetail finishes loading
    };

    const modalOverlayStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    };

    const modalStyle = {
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        width: '66%',
        justifyContent: 'center',
        height: '50%',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        display: 'block',
    };

    const closeButtonStyle = {
        float: 'right',
        marginRight: '10px',
        background: 'none',
        border: 'none',
        fontSize: '20px',
        cursor: 'pointer',
    };

    return (
        <>
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

            {isModalOpen && (
                <div style={modalOverlayStyle}>
                    <div style={modalStyle}>
                        {!loading && (
                            <button style={closeButtonStyle} onClick={closeModal}>X</button>
                        )}
                        <DeviceDetail address={selectedAddress} onLoadComplete={handleLoadComplete} />
                    </div>
                </div>
            )}
        </>
    );
};

export default ArpTable;
