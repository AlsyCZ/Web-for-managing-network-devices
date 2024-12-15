import React, { useState, useEffect } from 'react';
import './Styles/VlanManager.css';

const VLANManager = ({ onClose }) => {
    const [vlans, setVlans] = useState([]);
    const [vlanId, setVlanId] = useState('');
    const [selectedBridge, setSelectedBridge] = useState('');
    const [selectedTaggedInterface, setSelectedTaggedInterface] = useState('');
    const [selectedUntaggedInterface, setSelectedUntaggedInterface] = useState('');
    const [bridges, setBridges] = useState([]);
    const [interfaces, setInterfaces] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);
    
                // Fetch bridges
                const bridgesResponse = await fetch('http://localhost:3001/api/get-bridges');
                const bridges = await bridgesResponse.json();
                setBridges(bridges);

                // Fetch interfaces
                const interfacesResponse = await fetch('http://localhost:3001/api/get-interfaces');
                const interfaces = await interfacesResponse.json();
                setInterfaces(interfaces);
    
                // Fetch VLANs on bridges
                const vlansResponse = await fetch('http://localhost:3001/api/get-vlans');
                const vlans = await vlansResponse.json();
                setVlans(vlans);
    
                setError(null);
            } catch (err) {
                setError('Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };
    
        fetchAllData();
    }, []);

    const handleCheckboxChangeVlan = async (bridgeName, vlanFiltering) => {
        const bridge = bridges.find(b => b.name === bridgeName);
            if (bridge.vlanFiltering && bridge.mvrp) {
                await handleCheckboxChangeMvrp(bridge.name, false);
            }
        try {
            const response = await fetch('http://localhost:3001/api/enable-vlan-filtering', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    bridgeName,
                    vlanFiltering,
                }),
            });
    
            if (!response.ok) {
                throw new Error('Failed to update VLAN Filtering');
            }
    
            const updatedBridges = bridges.map((bridge) =>
                bridge.name === bridgeName ? { ...bridge, vlanFiltering } : bridge
            );
            setBridges(updatedBridges);
            refreshBridgesAndVlans();
        } catch (err) {
            setError('Failed to update VLAN Filtering');
        }
    };
    const refreshBridgesAndVlans = async () => {
        try {
            setLoading(true);
    
            // Znovu načtěte mosty
            const bridgesResponse = await fetch('http://localhost:3001/api/get-bridges');
            const bridges = await bridgesResponse.json();
            setBridges(bridges);
    
            // Znovu načtěte VLANy
            const vlansResponse = await fetch('http://localhost:3001/api/get-vlans');
            const vlans = await vlansResponse.json();
            setVlans(vlans);
    
            setError(null);
        } catch (err) {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };
    
    const handleCheckboxChangeMvrp = async (bridgeName, mvrp) => {
        try {
            const bridge = bridges.find(b => b.name === bridgeName);
            if (!bridge.vlanFiltering && !bridge.mvrp) {
                await handleCheckboxChangeVlan(bridge.name, true);
            }
    
            const response = await fetch('http://localhost:3001/api/enable-mvrp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    bridgeName,
                    mvrp,
                }),
            });
    
            if (!response.ok) {
                throw new Error('Failed to update MVRP');
            }
    
            const updatedBridges = bridges.map((bridge) =>
                bridge.name === bridgeName ? { ...bridge, mvrp } : bridge
            );
            setBridges(updatedBridges);
            refreshBridgesAndVlans();
        } catch (err) {
            setError('Failed to update MVRP');
        }
    };
    
    const handleCreateVlan = async () => {
        if (!vlanId || !selectedBridge) {
            setError('VLAN ID and bridge are required');
            return;
        }
    
        try {
            const response = await fetch('http://localhost:3001/api/create-vlan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    vlanId,
                    bridge: selectedBridge,
                    tagged: selectedTaggedInterface ? [selectedTaggedInterface] : [],
                    untagged: selectedUntaggedInterface ? [selectedUntaggedInterface] : []
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to create VLAN');
            } else {
                // Fetch updated VLANs after successful creation
                const updatedVlansResponse = await fetch('http://localhost:3001/api/get-vlans');
                const updatedVlans = await updatedVlansResponse.json();
                setVlans(updatedVlans);
                
                setVlanId('');
                setSelectedBridge('');
                setSelectedTaggedInterface('');
                setSelectedUntaggedInterface('');
                setError(null);
            }
        } catch (err) {
            setError('Error occurred while creating VLAN');
        }
    };

    const handleDeleteVlan = async (vlanId) => {
        try {
            const response = await fetch(`http://localhost:3001/api/delete-vlan/${vlanId}`, {
                method: 'DELETE',
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to delete VLAN');
            } else {
                // Fetch updated VLANs after successful deletion
                const updatedVlansResponse = await fetch('http://localhost:3001/api/get-vlans');
                const updatedVlans = await updatedVlansResponse.json();
                setVlans(updatedVlans);
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
            <h2>VLAN Bridge Manager</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {loading ? (
                <p>Loading VLANs...</p>
            ) : (
                <>
                    <ul>
                        {vlans.map((vlan, index) => (
                            <li key={index}>
                                VLAN ID: {vlan['vlanIds'] || 'N/A'}, Bridge: {vlan.bridge || 'N/A'}, Tagged: {vlan.tagged || 'None'}, Untagged: {vlan.untagged || 'None'}
                                <button onClick={() => handleDeleteVlan(vlan.id)} className="vlan-button">Delete</button>
                            </li>
                        ))}
                    </ul>
                    <div>
                        <h3>Create New Bridge VLAN</h3>
                        <input
                            type="text"
                            placeholder="VLAN ID"
                            value={vlanId}
                            onChange={(e) => setVlanId(e.target.value)}
                            className="vlan-input"
                        />
                        &nbsp;
                        <select
                            value={selectedBridge}
                            onChange={(e) => setSelectedBridge(e.target.value)}
                            className="vlan-select"
                        >
                            <option value="">Select Bridge</option>
                            {bridges.map((bridge, index) => (
                                <option key={index} value={bridge.name}>
                                    {bridge.name}
                                </option>
                            ))}
                        </select>
                        &nbsp;
                        <select
                            value={selectedTaggedInterface}
                            onChange={(e) => setSelectedTaggedInterface(e.target.value)}
                            className="vlan-select"
                        >
                            <option value="">Select Tagged Interface</option>
                            {interfaces.map((iface, index) => (
                                <option key={index} value={iface.name}>
                                    {iface.name}
                                </option>
                            ))}
                        </select>
                        &nbsp;
                        <select
                            value={selectedUntaggedInterface}
                            onChange={(e) => setSelectedUntaggedInterface(e.target.value)}
                            className="vlan-select"
                        >
                            <option value="">Select Untagged Interface</option>
                            {interfaces.map((iface, index) => (
                                <option key={index} value={iface.name}>
                                    {iface.name}
                                </option>
                            ))}
                        </select>
                        &nbsp;
                        <button onClick={handleCreateVlan} className="vlan-button">Create VLAN</button>
                    </div>
                    &nbsp;
                    <h3>Bridge Interfaces</h3>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <ul>
    {bridges.map((bridge) => (
        <li key={bridge.name}>
            <strong>Bridge:</strong> {bridge.name}, 
            <strong> VLAN Filtering: </strong> 
            <label>
                <input
                    type="checkbox"
                    checked={bridge.vlanFiltering}
                    onChange={(e) => handleCheckboxChangeVlan(bridge.name, e.target.checked)}
                />
            </label>
            , 
            <strong> MVRP: </strong>
            <label>
                <input
                    type="checkbox"
                    checked={bridge.mvrp}
                    onChange={(e) => handleCheckboxChangeMvrp(bridge.name, e.target.checked)}
                />
            </label>
        </li>
    ))}
</ul>

                </>
            )}
        </div>
    );
};

export default VLANManager;
