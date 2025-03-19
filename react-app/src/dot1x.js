import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Styles/Dot1x.css';

const Dot1x = ({ onClose }) => {
    const [dot1xEntries, setDot1xEntries] = useState([]);
    const [certificates, setCertificates] = useState([]);
    const [dot1xServers, setDot1xServers] = useState([]);
    const [radiusData, setRadiusData] = useState([]);
    const [interfaces, setInterfaces] = useState([]);
    const [formData, setFormData] = useState({
        interface: '',
        eapMethods: '',
        identity: '',
        password: '',
        anonIdentity: '',
        certificate: '',
    });
    const [serverFormData, setServerFormData] = useState({
        interface: '',
        dot1xAuth: false,
        macAuth: '',
        macAuthMode: '',
        radiusMacFormat: '',
        accounting: false,
    });
    const [radiusFormData, setRadiusFormData] = useState({
        ppp: '',
        hotspot: '',
        dhcp: '',
        dot1x: '',
        login: '',
        wireless: '',
        ipsec: '',
        address: '',
        protocol: '',
        secret: '',
        authenticationPort: '',
        accountingPort: '',
        timeout: '',
        requireMessageAuth: '',
        srcAddress: '',
    });
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
        } else {
            fetchData();
            fetchServerData();
            fetchRadiusData();
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

    const fetchServerData = async () => {
        try {
            const response = await fetch('/api/dot1x-server');
            const data = await response.json();
            setDot1xServers(data);
        } catch (error) {
            console.error('Error fetching Dot1x server data:', error);
        }
    };

    const fetchRadiusData = async () => {
        try {
            const response = await fetch('/api/radius');
            const data = await response.json();
            setRadiusData(data);
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

    const handleRadiusInputChange = (e) => {
        const { name, type, checked, value } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        setRadiusFormData({ ...radiusFormData, [name]: newValue });
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

            fetchData();
        } catch (error) {
            console.error('Error creating new Dot1x client:', error);
        }
    };

    const handleServerSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/create-dot1x-server', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(serverFormData),
            });

            if (!response.ok) {
                throw new Error('Failed to create new Dot1x server');
            }

            fetchServerData();
        } catch (error) {
            console.error('Error creating new Dot1x server:', error);
        }
    };

    const convertMillisecondsToTimeFormat = (milliseconds) => {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const ms = milliseconds % 1000;
        const seconds = totalSeconds % 60;
        const minutes = Math.floor(totalSeconds / 60) % 60;
        const hours = Math.floor(totalSeconds / 3600);

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
    };

    const handleRadiusSubmit = async (e) => {
        e.preventDefault();
        try {
            const radiusDataToSend = {
                ...radiusFormData,
                timeout: convertMillisecondsToTimeFormat(radiusFormData.timeout),
            };

            const response = await fetch('/api/create-radius', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(radiusDataToSend),
            });

            if (!response.ok) {
                throw new Error('Failed to create new Radius');
            }

            fetchRadiusData();
        } catch (error) {
            console.error('Error creating new Radius:', error);
        }
    };

    const handleDeleteEntry = async (id) => {
        try {
            const response = await fetch(`/api/delete-dot1x-client/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete Dot1x client');
            }

            fetchData();
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

            fetchServerData();
        } catch (error) {
            console.error('Error deleting Dot1x client:', error);
        }
    };

    const handleDeleteRadius = async (id) => {
        try {
            const response = await fetch(`/api/delete-radius/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete radius');
            }

            fetchRadiusData();
        } catch (error) {
            console.error('Error deleting radius:', error);
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

    const handleOutsideClick = (e) => {
        if (e.target.classList.contains('overlay')) {
            onClose();
        }
    };

    return (
        <div className="overlay" onClick={handleOutsideClick}>
            <div className="dot1x-manager" onClick={(e) => e.stopPropagation()}>
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
                            <select name="interface" value={formData.interface} onChange={handleInputChange} required>
                                <option value="" selected disabled hidden>Select Interface</option>
                                {interfaces.map((iface) => (
                                    <option key={iface.id} value={iface.name}>{iface.name}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            EAP Methods:
                            <select name="eapMethods" value={formData.eapMethods} onChange={handleInputChange} required>
                                <option value="" selected disabled hidden>Select EAP Method</option>
                                <option value="eap-tls">EAP TLS</option>
                                <option value="eap-ttls">EAP TTLS</option>
                                <option value="eap-peap">EAP PEAP</option>
                                <option value="eap-mschapv2">EAP MSCHAPv2</option>
                            </select>
                        </label>
                        <label>
                            Identity:
                            <input type="text" name="identity" value={formData.identity} onChange={handleInputChange} required />
                        </label>
                    </div>
                    <div className="form-row">
                        <label>
                            Password:
                            <input type="password" name="password" value={formData.password} onChange={handleInputChange} required />
                        </label>
                        <label>
                            Anon. Identity:
                            <input type="text" name="anonIdentity" value={formData.anonIdentity} onChange={handleInputChange} required />
                        </label>
                        <label>
                            Certificate:
                            <select name="certificate" value={formData.certificate} onChange={handleInputChange}>
                                <option value="" selected disabled hidden>Select Certificate</option>
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
                            <th>Mac Auth. Mode</th>
                            <th>RADIUS MAC Format</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dot1xServers.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center' }}>No data</td>
                            </tr>
                        ) : (
                            dot1xServers.map((server, index) => (
                                <tr key={index}>
                                    <td>{server.interface}</td>
                                    <td>{server.authTypes}</td>
                                    <td>{server.accounting ? 'Enabled' : 'Disabled'}</td>
                                    <td>{server.macAuthMode}</td>
                                    <td>{server.radiusMacFormat}</td>
                                    <td><button onClick={() => handleDeleteServer(server.id)} className="vlan-button">Delete</button></td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <h3>Create Dot1x Server</h3>
                <form onSubmit={handleServerSubmit} className="form-grid">
                    <div className="form-row">
                        <label>
                            Interface:
                            <select name="interface" value={serverFormData.interface} onChange={handleServerInputChange}>
                                <option value="" selected disabled hidden>Select Interface</option>
                                {interfaces.map((iface) => (
                                    <option key={iface.id} value={iface.name}>{iface.name}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Dot1x Authentication:
                            <input type="checkbox" name="dot1xAuth" checked={serverFormData.dot1xAuth} onChange={handleServerInputChange} />
                        </label>
                        <label>
                            MAC Authentication:
                            <input type="checkbox" name="macAuth" checked={serverFormData.macAuth} onChange={handleServerInputChange} />
                        </label>
                    </div>
                    <div className="form-row">
                        <label>
                            MAC Auth. Mode:
                            <select name="macAuthMode" value={serverFormData.macAuthMode} onChange={handleServerInputChange}>
                                <option value="" selected disabled hidden>Choose MAC auth. mode</option>
                                <option value="mac-as-username-and-password" selected="selected">MAC as username and password</option>
                                <option value="mac-as-username">MAC as username</option>
                            </select>
                        </label>
                        <label>
                            RADIUS MAC Format:
                            <select name="radiusMacFormat" value={serverFormData.radiusMacFormat} onChange={handleServerInputChange}>
                                <option value="" selected disabled hidden>Choose RADIUS MAC Format</option>
                                <option value="XXXXXXXXXXXX">XXXXXXXXXXXX</option>
                                <option value="XX-XX-XX-XX-XX-XX">XX-XX-XX-XX-XX-XX</option>
                                <option value="XX:XX:XX:XX:XX:XX">XX:XX:XX:XX:XX:XX</option>
                                <option value="xx-xx-xx-xx-xx-xx">xx-xx-xx-xx-xx-xx</option>
                                <option value="xx:xx:xx:xx:xx:xx">xx:xx:xx:xx:xx:xx</option>
                                <option value="xxxxxxxxxxxx">xxxxxxxxxxxx</option>
                            </select>
                        </label>
                        <label>
                            Accounting:
                            <select name="accounting" value={serverFormData.accounting} onChange={handleServerInputChange}>
                                <option value="true">ON</option>
                                <option value="false">OFF</option>
                            </select>
                        </label>
                    </div>
                    <button className="submitbtn" type="submit">Create Dot1x Server</button>
                </form>
                <br></br>
                <h2>RADIUS configuration</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Service</th>
                            <th>Address</th>
                            <th>Protocol</th>
                            <th>Secret</th>
                            <th>Authentication Port</th>
                            <th>Accounting Port</th>
                            <th>Timeout</th>
                            <th>Require Message Auth</th>
                            <th>Src. Address</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {radiusData.length === 0 ? (
                            <tr>
                                <td colSpan="10" style={{ textAlign: 'center' }}>No data</td>
                            </tr>
                        ) : (
                            radiusData.map((entry, index) => (
                                <tr key={index}>
                                    <td>{entry.service}</td>
                                    <td>{entry.address}</td>
                                    <td>{entry.protocol}</td>
                                    <td>{entry.secret}</td>
                                    <td>{entry.authenticationPort}</td>
                                    <td>{entry.accountingPort}</td>
                                    <td>{entry.timeout}</td>
                                    <td>{entry.requireMessageAuth}</td>
                                    <td>{entry.srcAddress}</td>
                                    <td><button onClick={() => handleDeleteRadius(entry.id)} className="vlan-button">Delete</button></td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <h3>Create New RADIUS</h3>
                <form onSubmit={handleRadiusSubmit} className="form-grid">
                    <label>Service:</label>
                    <div className="form-row">
                        <label>
                            PPP
                            <input type="checkbox" name="ppp" checked={radiusFormData.ppp} onChange={handleRadiusInputChange} />
                        </label>
                        <label>
                            Hotspot
                            <input type="checkbox" name="hotspot" checked={radiusFormData.hotspot} onChange={handleRadiusInputChange} />
                        </label>
                        <label>
                            DHCP
                            <input type="checkbox" name="dhcp" checked={radiusFormData.dhcp} onChange={handleRadiusInputChange} />
                        </label>
                        <label>
                            Dot1X
                            <input type="checkbox" name="dot1x" checked={radiusFormData.dot1x} onChange={handleRadiusInputChange} />
                        </label>
                        <label>
                            Login
                            <input type="checkbox" name="login" checked={radiusFormData.login} onChange={handleRadiusInputChange} />
                        </label>
                        <label>
                            Wireless
                            <input type="checkbox" name="wireless" checked={radiusFormData.wireless} onChange={handleRadiusInputChange} />
                        </label>
                        <label>
                            Ipsec
                            <input type="checkbox" name="ipsec" checked={radiusFormData.ipsec} onChange={handleRadiusInputChange} />
                        </label>
                    </div>
                    <div className="form-row">
                        <label>
                            Address:
                            <input type="text" name="address" value={radiusFormData.address} onChange={handleRadiusInputChange} required />
                        </label>
                        <label>
                            Protocol:
                            <select name="protocol" value={radiusFormData.protocol} onChange={handleRadiusInputChange}>
                                <option value="" selected disabled hidden>Choose protocol</option>
                                <option value="radsec">Radsec</option>
                                <option value="udp">UDP</option>
                            </select>
                        </label>
                        <label>
                            Secret:
                            <input type="password" name="secret" value={radiusFormData.secret} onChange={handleRadiusInputChange} required />
                        </label>
                        <label>
                            Authentication Port:
                            <input type="text" name="authenticationPort" value={radiusFormData.authenticationPort} onChange={handleRadiusInputChange} required />
                        </label>
                    </div>
                    <div className="form-row">
                        <label>
                            Accounting Port:
                            <input type="text" name="accountingPort" value={radiusFormData.accountingPort} onChange={handleRadiusInputChange} required />
                        </label>
                        <label>
                            Timeout:
                            <input type="number" name="timeout" value={radiusFormData.timeout} onChange={handleRadiusInputChange} required />
                        </label>
                        <label>
                            Require Message Auth:
                            <select name="requireMessageAuth" value={radiusFormData.requireMessageAuth} onChange={handleRadiusInputChange}>
                                <option value="" selected disabled hidden>Select Message auth</option>
                                <option value="yes-for-request-resp">Yes for request resp</option>
                                <option value="no">No</option>
                            </select>
                        </label>
                        <label>
                            Src. Address:
                            <input type="text" name="srcAddress" value={radiusFormData.srcAddress} onChange={handleRadiusInputChange} required />
                        </label>
                    </div>
                    <button className="submitbtn" type="submit">Create RADIUS</button>
                </form>
            </div>
        </div>
    );
};

export default Dot1x;