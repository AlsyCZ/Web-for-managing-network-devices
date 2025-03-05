import React, { useEffect, useState } from 'react';
import DeviceDetail from './DeviceDetail.js';
import { useNavigate } from 'react-router-dom';
import VLANManager from './VlanManager.js';
import './Styles/table.css';

const ArpTable = () => {
    const [arpEntries, setArpEntries] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
    const [isVlanModalOpen, setIsVlanModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
        }
    }, [navigate]);

    const openVlanModal = () => setIsVlanModalOpen(true);
    const closeVlanModal = () => setIsVlanModalOpen(false);
    
    const fetchData = async () => {
        try {
            const response = await fetch('https://web-for-managing-network-devices-production.up.railway.app/api/raw-data');
            if (!response.ok) {
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            const arpTable = data.arpTable
                .filter(arp => arp['interface'] !== 'ether1-WAN')
                .map((arp) => {
                    const lease = data.dhcpLeases.find(lease => lease['address'] === arp['address']);
                    const bridge = data.bridgeHosts.find(host => host['macAddress'] === arp['macAddress']);
                    const hostName = lease ? lease['hostName'] : 'Unknown device';
                    const bridgePort = bridge ? bridge['interface'] : 'Not available';
                    return {
                        address: arp['address'],
                        macAddress: arp['macAddress'] || 'Not available',
                        interface: arp['interface'],
                        bridgePort: bridgePort,
                        hostName: hostName || 'Unknown device',
                        status: arp['status']
                    };
                });
            setArpEntries(arpTable);
        } catch (error) {
            console.error('Error while getting data:', error);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleDelete = async (address) => {
        try {
            const response = await fetch(`/api/delete-arp/${address}`, { method: 'DELETE' });
            if (!response.ok) {
                throw new Error(`Failed to delete ARP: ${response.status} ${response.statusText}`);
            }
            console.log('ARP lease was deleted');
            setArpEntries(arpEntries.filter(entry => entry.address !== address));
        } catch (error) {
            console.error('Error while deleting ARP lease:', error);
            alert(`Error while deleting ARP lease: ${error.message}`);
        }
    };

    const handleEdit = (address) => {
        setSelectedAddress(address);
        setIsDeviceModalOpen(true);
        setLoading(true);
    };

    const closeModal = () => {
        setIsDeviceModalOpen(false);
        setLoading(false);
        setSelectedAddress(null);
    };
    const handleLoadComplete = () => {
        setLoading(false);
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
                                <button className="vlan-button" onClick={() => handleDelete(entry.address)}>Delete</button>
                                &ensp;
                                <button className="vlan-button" onClick={() => handleEdit(entry.address)}>Edit</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {isDeviceModalOpen && (
                <div className="modalOverlayStyle">
                    <div className="modalStyle">
                        {!loading && (
                            <button className="closeButtonStyle" onClick={closeModal}>X</button>
                        )}
                        <DeviceDetail address={selectedAddress} onLoadComplete={handleLoadComplete} />
                    </div>
                </div>
            )}

            {isVlanModalOpen && (
                <div className="modalOverlayStyle">
                    <div className="modalStyle">
                        <VLANManager onClose={closeVlanModal} />
                    </div>
                </div>
            )}
            
        </>
    );
};