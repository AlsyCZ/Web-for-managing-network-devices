import React, { useState, useEffect } from 'react';
import './Styles/VlanManager.css';
import { useNavigate } from 'react-router-dom';

const VLANManager = ({ onClose }) => {
    const [vlans, setVlans] = useState([]);
    const [vlanId, setVlanId] = useState('');
    const [selectedBridge, setSelectedBridge] = useState('');
    const [taggedInterfaces, setTaggedInterfaces] = useState([]);
    const [untaggedInterfaces, setUntaggedInterfaces] = useState([]);
    const [bridges, setBridges] = useState([]);
    const [interfaces, setInterfaces] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
        }
    }, [navigate]);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);
                const [bridgesResponse, interfacesResponse, vlansResponse] = await Promise.all([
                    fetch('https://projekt.alsy.cz/api/get-bridges'),
                    fetch('https://projekt.alsy.cz/api/get-interfaces'),
                    fetch('https://projekt.alsy.cz/api/get-vlans'),
                ]);

                const bridges = await bridgesResponse.json();
                const interfaces = await interfacesResponse.json();
                const vlans = await vlansResponse.json();

                setBridges(bridges);
                setInterfaces(interfaces);
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

    const handleAddInterface = (iface, type) => {
        if (type === 'tagged' && !taggedInterfaces.includes(iface)) {
            setTaggedInterfaces([...taggedInterfaces, iface]);
        } else if (type === 'untagged' && !untaggedInterfaces.includes(iface)) {
            setUntaggedInterfaces([...untaggedInterfaces, iface]);
        }
    };

    const handleRemoveInterface = (iface, type) => {
        if (type === 'tagged') {
            setTaggedInterfaces(taggedInterfaces.filter((item) => item !== iface));
        } else if (type === 'untagged') {
            setUntaggedInterfaces(untaggedInterfaces.filter((item) => item !== iface));
        }
    };

    const handleCreateVlan = async () => {
        if (!vlanId || !selectedBridge) {
            setError('VLAN ID and bridge are required');
            return;
        }

        try {
            const response = await fetch('https://projekt.alsy.cz/api/create-vlan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vlanId,
                    bridge: selectedBridge,
                    tagged: taggedInterfaces,
                    untagged: untaggedInterfaces,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to create VLAN');
            } else {
                setVlanId('');
                setSelectedBridge('');
                setTaggedInterfaces([]);
                setUntaggedInterfaces([]);
                setError(null);

                const updatedVlansResponse = await fetch('https://projekt.alsy.cz/api/get-vlans');
                const updatedVlans = await updatedVlansResponse.json();
                setVlans(updatedVlans);
            }
        } catch (err) {
            setError('Error occurred while creating VLAN');
        }
    };

    const handleDeleteVlan = async (vlanId) => {
        try {
            const response = await fetch(`https://projekt.alsy.cz/api/delete-vlan/${vlanId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to delete VLAN');
            } else {
                const updatedVlansResponse = await fetch('https://projekt.alsy.cz/api/get-vlans');
                const updatedVlans = await updatedVlansResponse.json();
                setVlans(updatedVlans);
            }
        } catch (err) {
            setError('Error occurred while deleting VLAN');
        }
    };

    const handleCheckboxChangeVlan = async (bridgeName, vlanFiltering) => {
        const bridge = bridges.find(b => b.name === bridgeName);
        if (bridge.vlanFiltering && bridge.mvrp) {
            await handleCheckboxChangeMvrp(bridge.name, false);
        }
        try {
            const response = await fetch('https://projekt.alsy.cz/api/enable-vlan-filtering', {
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

            const bridgesResponse = await fetch('https://projekt.alsy.cz/api/get-bridges');
            const bridges = await bridgesResponse.json();
            setBridges(bridges);

            const vlansResponse = await fetch('https://projekt.alsy.cz/api/get-vlans');
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

            const response = await fetch('https://projekt.alsy.cz/api/enable-mvrp', {
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

    const closeButtonStyle = {
        float: 'right',
        marginRight: '10px',
        background: 'none',
        border: 'none',
        fontSize: '20px',
        cursor: 'pointer',
    };

    // Funkce pro zavření modalu při kliknutí na overlay
    const handleOutsideClick = (e) => {
        if (e.target.classList.contains('overlay')) {
            onClose(); // Zavření modalu pomocí prop `onClose`
        }
    };

    return (
        <div className="overlay" onClick={handleOutsideClick}>
            <div className="vlan-manager" onClick={(e) => e.stopPropagation()}>
                <button style={closeButtonStyle} onClick={onClose}>X</button>
                <h2>VLAN Bridge Manager</h2>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {loading ? (
                    <p>Loading VLANs...</p>
                ) : (
                    <>
                        <table>
                            <thead>
                                <tr>
                                    <th>VLAN ID</th>
                                    <th>Bridge</th>
                                    <th>Tagged</th>
                                    <th>Untagged</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vlans.map((vlan, index) => (
                                    <tr key={index}>
                                        <td>{vlan['vlanIds'] || 'N/A'}</td>
                                        <td>{vlan.bridge || 'N/A'}</td>
                                        <td>{vlan.tagged || 'None'}</td>
                                        <td>{vlan.untagged || 'None'}</td>
                                        <td><button onClick={() => handleDeleteVlan(vlan.id)} className="vlan-button">Delete</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="content" style={{ display: 'collumn', gap: '20px' }}>
                            <div>
                                <h3>Create New VLAN</h3>
                                <input
                                    type="text"
                                    placeholder="VLAN ID"
                                    value={vlanId}
                                    onChange={(e) => setVlanId(e.target.value)}
                                    className="vlan-input"
                                />
                                <select
                                    value={selectedBridge}
                                    onChange={(e) => setSelectedBridge(e.target.value)}
                                    className="vlan-select"
                                >
                                    <option value="" selected disabled hidden>Select Bridge</option>
                                    {bridges.map((bridge) => (
                                        <option key={bridge.name} value={bridge.name}>{bridge.name}</option>
                                    ))}
                                </select>

                                <button onClick={handleCreateVlan} className="vlan-button">Create VLAN</button>
                            </div>
                            &nbsp;
                            <div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <div>
                                        <h5>Tagged interface:</h5>
                                        <select
                                            onChange={(e) => handleAddInterface(e.target.value, 'tagged')}
                                            className="vlan-select"
                                        >
                                            <option value="" selected disabled hidden>Select Interface</option>
                                            {interfaces.map((iface) => (
                                                <option key={iface.name} value={iface.name}>{iface.name}</option>
                                            ))}
                                        </select>
                                        <ul>
                                            {taggedInterfaces.map((iface) => (
                                                <li key={iface}>
                                                    {iface}{' '}
                                                    <button className="vlan-button" onClick={() => handleRemoveInterface(iface, 'tagged')}>-</button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h5>Untagged interface:</h5>
                                        <select
                                            onChange={(e) => handleAddInterface(e.target.value, 'untagged')}
                                            className="vlan-select"
                                        >
                                            <option value="" selected disabled hidden>Select Interface</option>
                                            {interfaces.map((iface) => (
                                                <option key={iface.name} value={iface.name}>{iface.name}</option>
                                            ))}
                                        </select>
                                        <ul>
                                            {untaggedInterfaces.map((iface) => (
                                                <li key={iface}>
                                                    {iface}{' '}
                                                    <button className="vlan-button" onClick={() => handleRemoveInterface(iface, 'untagged')}>-</button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <h3>Bridge Interfaces</h3>
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
        </div>
    );
};

export default VLANManager;