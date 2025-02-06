import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Styles/Dot1x.css'; // Import CSS

const Dot1x = ({ onClose }) => {
    const [dot1xEntries, setDot1xEntries] = useState([]);
    const [certificates, setCertificates] = useState([]);
    const [dot1xServers, setDot1xServers] = useState([]);
    const [interfaces, setInterfaces] = useState([]);
    const [formData, setFormData] = useState({
        interface: '',
        eapMethods: '',
        identity: '',
        password: '',
        anonIdentity: '',
        certificate: 'none',
    });

    const [serverFormData, setServerFormData] = useState({
        interface: '',
        authTypes: '',
        accounting: false,
    });
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
        } else {
            fetchData();
            fetchServerData();
            fetchCertificates();
            fetchServerData();
            fetchInterfaces();
        }
    }, [navigate]);

    const fetchData = async () => {
        try {
            const response = await fetch('/api/dot1x-data');
            const data = await response.json();
            setDot1xEntries(data);
        } catch (error) {
            console.error('Error fetching Dot1x data:', error);
        }
    };
    const fetchInterfaces = async () => {
        try {
            const response = await fetch('/api/get-interfaces');
            const data = await response.json();
            setInterfaces(data);
        } catch (error) {
            console.error('Error fetching interface data:', error);
        }
    };
    const fetchServerData = async () => {
        try {
            const response = await fetch('/api/dot1x-server');
            const data = await response.json();
            setDot1xServers(data);
        } catch (error) {
            console.error('Error fetching Dot1x server data:', error);
        }
    };
    const fetchCertificates = async () => {
        try {
            const response = await fetch('/api/certificates');
            const data = await response.json();
            setCertificates(data);
        } catch (error) {
            console.error('Error fetching certificates:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleServerInputChange = (e) => {
        const { name, type, checked, value } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        setServerFormData({ ...serverFormData, [name]: newValue });
    };


    const handleDeleteEntry = async (id) => {
        try {
            const response = await fetch(`/api/delete-dot1x-client/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete Dot1x client');
            }

            fetchData(); // Refresh data after deleting client
        } catch (error) {
            console.error('Error deleting Dot1x client:', error);
        }
    };
    const handleDeleteServer = async (id) => {
        try {
            const response = await fetch(`/api/delete-dot1x-server/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete Dot1x client');
            }

            fetchServerData(); // Refresh data after deleting client
        } catch (error) {
            console.error('Error deleting Dot1x client:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/create-dot1x-client', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Failed to create new Dot1x client');
            }

            fetchData(); // Refresh data after creating new client
        } catch (error) {
            console.error('Error creating new Dot1x client:', error);
        }
    };

    const handleServerSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/create-dot1x-server', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(serverFormData),
            });
            if (!response.ok) throw new Error('Failed to create new Dot1x server');
            fetchServerData();
        } catch (error) {
            console.error('Error creating new Dot1x server:', error);
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
        <div className="dot1x-manager">
            <button style={closeButtonStyle} onClick={onClose}>X</button>
            <h2>Dot1x Client Manager</h2>
            <table>
                <thead>
                    <tr>
                        <th>Interface</th>
                        <th>EAP Methods</th>
                        <th>Identity</th>
                        <th>Certificate</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                {dot1xEntries.length === 0 ? (
                <tr>
                    <td colSpan="6" style={{ textAlign: 'center' }}>No data</td>
                </tr>
                    ) : (
                dot1xEntries.map((entry, index) => (
                    <tr key={index}>
                        <td>{entry.interface}</td>
                        <td>{entry.eapMethods}</td>
                        <td>{entry.identity}</td>
                        <td>{entry.certificate}</td>
                        <td>{entry.status}</td>
                        <td><button onClick={() => handleDeleteEntry(entry.id)} className="vlan-button">Delete</button></td>
                    </tr>
                    ))
                )}

                </tbody>
            </table>
            <h3>Create New Client</h3>
            <form onSubmit={handleSubmit} className="form-grid">
                <div className="form-row">
                    <label>
                        Interface:
                        <select placeholder="Select Interface" name="interface" value={formData.interface} onChange={handleInputChange} required>
                        {interfaces.map((iface) => (
                                            <option key={iface.name} value={iface.name}>{iface.name}</option>
                                        ))}
                                        </select>
                    </label>
                    <label>
                        EAP Methods:
                        <select name="eapMethods" value={formData.eapMethods} onChange={handleInputChange} required>
                            <option value="">Select EAP Method</option>
                            <option value="eap-tls">EAP TLS</option>
                            <option value="eap-ttls">EAP TTLS</option> 
                            <option value="eap-peap">EAP PEAP</option>
                            <option value="eap-mschapv2">EAP MSCHAPv2</option>
                        </select>

                    </label>
                    <label>
                        Identity:
                        <input type="text" placeholder="Type identity" name="identity" value={formData.identity} onChange={handleInputChange} required />
                    </label>
                </div>
                <div className="form-row">
                    <label>
                        Password:
                        <input type="password" placeholder="Type password" name="password" value={formData.password} onChange={handleInputChange} required />
                    </label>
                    <label>
                        Anon. Identity:
                        <input type="text" placeholder="Type anon. identity" name="anonIdentity" value={formData.anonIdentity} onChange={handleInputChange}/>
                    </label>
                    <label>
                        Certificate:
                        <select name="certificate" value={formData.certificate} onChange={handleInputChange}>
                            <option value="">None</option>
                            {certificates.map((cert) => (
                                <option key={cert.id} value={cert.name}>{cert.name}</option>
                            ))}
                        </select>
                    </label>
                </div>
                <button className="submitbtn" type="submit">Create new Client</button>
            </form>
            <br></br>
            <h2>Dot1x Server Manager</h2>
            <table>
            <thead>
                <tr>
                    <th>Interface</th>
                    <th>Authentication types</th>
                    <th>Accounting</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                {dot1xServers.length === 0 ? (
                    <tr>
                        <td colSpan="4" style={{ textAlign: 'center' }}>No data</td>
                    </tr>
                ) : (
                    dot1xServers.map((server, index) => (
                        <tr key={index}>
                            <td>{server.interface}</td>
                            <td>{server.authTypes}</td>
                            <td>{server.accounting ? 'Enabled' : 'Disabled'}</td>
                            <td><button onClick={() => handleDeleteServer(server.id)} className="vlan-button">Delete</button></td>
                        </tr>
                    ))
                )}
            </tbody>
            </table>
            <h3>Create New Dot1x Server</h3>
            <form onSubmit={handleServerSubmit} className="form-grid">
                <label>
                    Interface:
                    <select name="interface" value={serverFormData.interface} onChange={handleServerInputChange} required>
                        {interfaces.map((iface) => (
                            <option key={iface.name} value={iface.name}>{iface.name}</option>
                        ))}
                    </select>
                </label>
                <label>
                    <input type="checkbox" name="dot1xAuth" checked={serverFormData.dot1xAuth} onChange={handleServerInputChange} /> Dot1X Authentication
                </label>
                <label>
                    <input type="checkbox" name="macAuth" checked={serverFormData.macAuth} onChange={handleServerInputChange} /> MAC Authentication
                </label>
                <label>
                    <input type="checkbox" name="accounting" checked={serverFormData.accounting} onChange={handleServerInputChange} /> Enable Accounting
                </label>
                <button className="submitbtn" type="submit">Create Dot1x Server</button>
            </form>
        </div>
    );
};

export default Dot1x;