import React, { useState, useEffect } from 'react';
import './VlanManager.css';
// TODO: assign VLAN to IP pool
// TODO: DHCP confif for VLANs
// TODO: Firewall rules and routing? (if needed)
const VLANManager = ({ onClose }) => {
    const [vlans, setVlans] = useState([]);
    const [vlanId, setVlanId] = useState('');
    const [vlanName, setVlanName] = useState('');
    const [selectedInterface, setSelectedInterface] = useState('');
    const [interfaces, setInterfaces] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVlans = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/get-vlans');
                const data = await response.json();
                console.log(data);
                setVlans(data || []);
            } catch (err) {
                setError('Failed to fetch VLANs');
            } finally {
                setLoading(false);
            }
        };
        fetchVlans();

        const fetchInterfaces = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/get-interfaces');
                const data = await response.json();
                console.log(data);
                setInterfaces(data || []);
                if (data.length > 0) {
                    setSelectedInterface(data[0].name);
                }
            } catch (err) {
                setError('Failed to fetch interfaces');
            }
        };
        fetchInterfaces();
    }, []);

    const handleCreateVlan = async () => {
        if (!vlanId || !vlanName || !selectedInterface) {
            setError('VLAN ID, name, and interface are required');
            return;
        }

        try {
            const response = await fetch('http://localhost:3001/api/create-vlan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ vlanId, name: vlanName, interface: selectedInterface }),
            });

            if (response.ok) {
                setVlans(prevVlans => [...prevVlans, { vlanId, name: vlanName, interface: selectedInterface }]);
                setVlanId('');
                setVlanName('');
                setSelectedInterface('');
                setError(null);
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to create VLAN, make sure to not create VLAN in same interface');
            }
        } catch (err) {
            setError('Error occurred while creating VLAN');
        }
    };

    const handleDeleteVlan = async (vlanName) => {
        try {
            const response = await fetch(`http://localhost:3001/api/delete-vlan/${vlanName}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setVlans(vlans.filter(vlan => vlan.name !== vlanName));
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to delete VLAN');
            }
        } catch (err) {
            setError('Error occurred while deleting VLAN');
        }
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
        <div className="vlan-manager">
            <button style={closeButtonStyle} onClick={onClose}>X</button>
            <h2>VLAN Manager</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {loading ? (
                <p>Loading VLANs...</p>
            ) : (
                <>
                    {vlans && vlans.length > 0 ? (
                        <ul>
                            {vlans.map((vlan, index) => (
                                <li key={index}>
                                    VLAN ID: {vlan.vlanId || 'N/A'}, Name: {vlan.name || 'N/A'}, Interface: {vlan.interface || 'N/A'}
                                    <button onClick={() => handleDeleteVlan(vlan.name)} className="vlan-button">Delete</button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No VLANs found.</p>
                    )}
                    <div>
                        <h3>Create New VLAN</h3>
                        <input
                            type="text"
                            placeholder="VLAN ID"
                            value={vlanId}
                            onChange={(e) => setVlanId(e.target.value)}
                            className="vlan-input"
                        />
                        &nbsp;
                        <input
                            type="text"
                            placeholder="VLAN Name"
                            value={vlanName}
                            onChange={(e) => setVlanName(e.target.value)}
                            className="vlan-input"
                        />
                        &nbsp;
                        <select
                            value={selectedInterface}
                            onChange={(e) => setSelectedInterface(e.target.value)}
                            className="vlan-select"
                        >
                            {interfaces.map((iface, index) => (
                                <option key={index} value={iface.name}>
                                    {iface.name}
                                </option>
                            ))}
                        </select>
                        &nbsp;
                        <button onClick={handleCreateVlan} className="vlan-button">Create VLAN</button>
                    </div>
                </>
            )}
        </div>
    );
};

export default VLANManager;