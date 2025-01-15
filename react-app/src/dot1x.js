import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Styles/Dot1x.css'; // Import CSS

const Dot1x = ({ onClose }) => {
    const [dot1xEntries, setDot1xEntries] = useState([]);
    const [certificates, setCertificates] = useState([]);
    const [interfaces, setInterfaces] = useState([]);
    const [formData, setFormData] = useState({
        interface: '',
        eapMethods: '',
        identity: '',
        password: '',
        anonIdentity: '',
        certificate: 'none',
    });
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
        } else {
            fetchData();
            fetchCertificates();
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
        </div>
    );
};

export default Dot1x;