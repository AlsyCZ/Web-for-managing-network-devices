const express = require('express');
const cors = require('cors');
const { RouterOSClient } = require('routeros-client');
const path = require('path');
const dotenv = require('dotenv');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());

dotenv.config();

const corsOptions = {
    origin: 'http://localhost:3000',
    methods: 'GET,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
};
app.use(cors(corsOptions));

const api = new RouterOSClient({
    host: process.env.API_HOST,
    user: process.env.API_USER,
    password: process.env.API_PASSWORD,
    tls: { rejectUnauthorized: false },
    port: process.env.API_PORT,
    timeout: 40000,
});

let client = null;
let isConnecting = false;

const connectToApi = async () => {
    if (isConnecting || client) return;
    isConnecting = true;
    try {
        client = await api.connect();
        console.log('Connected to MikroTik API');
    } catch (error) {
        console.error('Error connecting to MikroTik:', error);
        setTimeout(connectToApi, 5000);
    } finally {
        isConnecting = false;
    }
};

setInterval(async () => {
    if (client) {
        try {
            await client.menu('/system/resource').getAll();
        } catch (error) {
            console.error('Keep-alive ping failed:', error);
            client = null;
            connectToApi();
        }
    }
}, 30000);

require('events').EventEmitter.defaultMaxListeners = 0;
app.use(express.static(path.join(__dirname, 'public')));
connectToApi().catch(error => console.error('Initial connection error:', error));

// MySQL database connection
const db = mysql.createConnection({ 
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
    } else {
        console.log('Connected to the MySQL database');
    }
});

// Email transporter
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Serve React build
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'react-app/build')));
  
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'react-app/build', 'index.js'));
    });
  }

app.post('/register', async (req, res) => {
    const { username, password, email } = req.body;
    db.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], async (err, results) => {
        if (err) {
            console.error('Database error:', err); // Logování chyby
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.length > 0) return res.status(400).json({ error: 'Username or email already exists' });
        
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const otp = Math.floor(100000 + Math.random() * 900000);
            db.query('INSERT INTO users (username, password, email, otp, verified) VALUES (?, ?, ?, ?, ?)', [username, hashedPassword, email, otp, 0], (err) => {
                if (err) return res.status(500).json({ error: 'Database error' });
                
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: 'Your OTP Code',
                    text: `Your OTP code is: ${otp}`
                };
                
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error('Email sending error:', error);
                        return res.status(500).json({ error: 'Email sending failed' });
                    }
                    console.log('Email sent:', info.response);
                    res.status(201).json({ message: 'User registered. Check your email for OTP.' });
                });
            });
        } catch (error) {
            res.status(500).json({ error: 'Server error' });
        }
    });
});

app.post('/verify', (req, res) => {
    const { otp } = req.body;
    db.query('SELECT * FROM users WHERE otp = ? AND verified = 0', [otp], (err, results) => {
        if (err) return res.status(500).json({ message: 'Chyba serveru' });

        if (results.length === 0) return res.status(400).json({ message: 'Neplatný OTP kód' });

        db.query('UPDATE users SET verified = 1 WHERE otp = ?', [otp], (err) => {
            if (err) return res.status(500).json({ message: 'Chyba při ověřování' + err });
            res.json({ message: 'Úspěšně ověřeno' });
        });
    });
});


app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (results.length === 0 || !(await bcrypt.compare(password, results[0].password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!results[0].verified) {
            // Uživatel není ověřený, vrátíme speciální flag
            return res.status(403).json({ message: 'Email not verified', verified: false });
        }

        // Uživatel je ověřený, vygenerujeme token
        const token = jwt.sign({ id: results[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, verified: true });
    });
});

const verifyToken = (req, res, next) => { 
    const token = req.headers['authorization']; 
    if (!token) return res.status(403).json({ message: 'No token provided' });
    jwt.verify(token.split(' ')[1], process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(500).json({ message: 'Failed to authenticate token' });
        req.userId = decoded.id;
        next();
    });
};

app.get('/username', verifyToken, (req, res) => { 
    db.query('SELECT username FROM users WHERE id = ?', [req.userId], (err, results) => { 
        if (err) { 
            return res.status(500).json({ error: 'Internal server error' }); 
        } 
        if (results.length === 0) { 
            return res.status(404).json({ error: 'User not found' }); 
        } 
        res.json({ username: results[0].username });
    });
});

app.get('/api/raw-data', async (req, res) => {
    try {
        await connectToApi();
        if (!client) throw new Error('Client not connected');

        const arpTable = await client.menu('/ip/arp').getAll();
        const dhcpLeases = await client.menu('/ip/dhcp-server/lease').getAll();
        const bridgeHosts = await client.menu('/interface bridge host').getAll();

        res.json({ arpTable, dhcpLeases, bridgeHosts });
    } catch (error) {
        console.error('Error connecting to MikroTik:', error);
        res.status(500).send('Error connecting to MikroTik: ' + error.message);
    }
});

app.get('/api/device-detail/:address', async (req, res) => {
    const { address } = req.params;
    try {
        if (!client) throw new Error('Client not connected');

        const arpTable = await client.menu('/ip/arp').getAll();
        const arpEntry = arpTable.find(entry => entry.address === address);

        if (!arpEntry) {
            return res.status(404).send('Device not found in ARP table');
        }
        const rules = await client.menu('/ip/firewall/filter/').getAll({
            chain: 'forward',
            srcAddress: address,
            action: 'drop',
        });
        const dhcpLeases = await client.menu('/ip/dhcp-server/lease').getAll();
        const dhcpLease = dhcpLeases.find(lease => lease.address === address);
        const isDhcpEnabled = Boolean(dhcpLease);

        const bridgeHosts = await client.menu('/interface bridge host').getAll();
        const bridgeHost = bridgeHosts.find(host => host.macAddress === arpEntry.macAddress);

        const result = {
            address,
            isBanned: rules.length > 0,
            hostName: dhcpLease?.['hostName'] || 'Unknown device',
            macAddress: arpEntry.macAddress || 'Unknown MAC address',
            bridgePort: bridgeHost ? bridgeHost.interface : 'Not available',
            status: dhcpLease?.status || arpEntry.status || 'Status not available',
            isDhcpEnabled
        };

        res.json(result);
    } catch (error) {
        console.error('Error retrieving device data:', error);
        res.status(500).send('Error retrieving device data: ' + error.message);
    }
});
app.post('/api/ban-ip', async (req, res) => {
    const { ipAddress, ban } = req.body;

    try {
        const comment = `ban-${ipAddress}`;

        if (ban) {
            await client.menu('/ip/firewall/filter/').add({
                chain: 'forward',
                srcAddress: ipAddress,
                action: 'drop',
                comment: comment,
            });
            res.status(200).send(`IP address ${ipAddress} was blocked`);
        } else {
            const rules = await client.menu('/ip/firewall/filter/').getAll({
                comment: comment,
            });

            if (!rules || rules.length === 0) {
                console.log(`Rule with comment ${comment} wasn't found.`);
                return res.status(404).send(`Rule with comment ${comment} wasn't found`);
            }
            for (const rule of rules) {
                if (!rule.id) {
                    console.error('Rule does not have a valid ID:', rule);
                    continue;
                }
                await client.menu('/ip/firewall/filter/').remove(rule.id);
            }
            res.status(200).send(`IP address ${ipAddress} was unblocked`);
        }
    } catch (error) {
        console.error('Error while setting up rule:', error);
        res.status(500).send('Error while setting up rule');
    }
});

app.post('/api/make-static', async (req, res) => {
    const { currentIpAddress, newIpAddress } = req.body;

    if (!currentIpAddress || !newIpAddress) {
        return res.status(400).json({ message: 'Current and new IP addresses are required' });
    }

    console.log('Received current IP address:', currentIpAddress, 'and new IP address:', newIpAddress);

    const ipRegex = /^10\.0\.1\.(3[0-9]|[3-9][0-9]|[12][0-9]{2}|254)$/;
    if (!ipRegex.test(newIpAddress)) {
        return res.status(400).json({ message: 'New IP address is not in the valid range 10.0.1.3 - 10.0.1.254' });
    }

    try {
        if (!client) throw new Error('Client not connected');

        const dhcpLeases = await client.menu('/ip/dhcp-server/lease').getAll();
        const arpTable = await client.menu('/ip/arp').getAll();

        const dhcpLease = dhcpLeases.find(lease => lease.address === currentIpAddress);
        const arpEntry = arpTable.find(entry => entry.address === currentIpAddress);
        const macAddress = arpEntry?.macAddress;

        console.log('MAC address:', macAddress);

        if (!macAddress) {
            return res.status(400).send('MAC address not found for the provided IP address.');
        }

        let dhcpid = null;
        if (dhcpLease) {
            dhcpid = dhcpLease.id;
            console.log(`Found DHCP lease for IP: ${currentIpAddress}`);
            console.log("Lease ID: ", dhcpid);

            if (dhcpLease.status !== 'bound') {
                console.log(`Lease for IP ${currentIpAddress} is not in 'bound' state, cannot delete.`);
                return res.status(400).send(`Lease for IP ${currentIpAddress} is not in 'bound' state.`);
            }

            await client.menu('/ip/dhcp-server/lease').remove(dhcpid);
        } else {
            console.log(`No DHCP lease found for IP: ${currentIpAddress}`);
        }

        const dhcpServer = 'dhcp1';
        const servers = await client.menu('/ip/dhcp-server').getAll();
        if (!servers.some(server => server.name === dhcpServer)) {
            return res.status(400).send(`DHCP server with name '${dhcpServer}' not found.`);
        }

        console.log(`Creating static lease for new IP: ${newIpAddress}`);
        await client.menu('/ip/dhcp-server/lease').add({
            address: newIpAddress,
            'mac-address': macAddress,
            disabled: false,
            server: dhcpServer,
        });

        return res.status(200).json({ newIpAddress });
    } catch (error) {
        console.error('Error:', error.message);
        return res.status(500).send(`Error: ${error.message}`);
    }
});

app.post('/api/delete-lease', async (req, res) => {
    const {ipAddress} = req.body;
    try {
        if (!client) throw new Error('Client not connected');

        const dhcpLeases = await client.menu('/ip/dhcp-server/lease').getAll();
        const dhcpLease = dhcpLeases.find(lease => lease.address === ipAddress);

        if (dhcpLease) {
            dhcpid = dhcpLease.id;
            await client.menu('/ip/dhcp-server/lease').remove(dhcpid);
        } else {
            console.log(`No DHCP lease found for IP: ${ipAddress}`);
        }
    } catch (error) {
        console.error('Error:', error.message);
        return res.status(500).send(`Error: ${error.message}`);
    }
});

app.delete('/api/delete-arp/:address', async (req, res) => {
    const { address } = req.params;
    try {
        if (!client) throw new Error('Client not connected');

        await client.menu('/ip/arp').remove({ address });

        res.status(200).send('ARP entry deleted successfully');
    } catch (error) {
        console.error('Error deleting ARP entry:', error);
        res.status(500).send('Error deleting ARP entry');
    }
});

app.delete('/api/delete-vlan/:vlanId', async (req, res) => {
    const { vlanId } = req.params;
    try {
        if (!client) throw new Error('Client not connected');

        await client.menu('/interface/bridge/vlan').remove(vlanId);

        res.status(200).send('VLAN deleted successfully');
    } catch (error) {
        console.error('Error deleting VLAN:', error);
        res.status(500).send('Error deleting VLAN');
    }
});

app.get('/api/get-vlans', async (req, res) => {
    try {
        const vlans = await client.menu('/interface/bridge/vlan/print').getAll();
        res.status(200).json(vlans);
    } catch (error) {
        console.error('Error fetching VLANs:', error);
        res.status(500).json({ message: 'Failed to fetch VLANs', error: error.message || error });
    }
});

app.get('/api/get-interfaces', async (req, res) => {
    try {
        const interfaces = await client.menu('/interface/print').getAll();
        res.status(200).json(interfaces);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch interfaces', error: error.message || error });
    }
});


app.post('/api/create-vlan', async (req, res) => {
    const { vlanId, bridge, tagged, untagged } = req.body;

    try {
        await client.menu('/interface/bridge/vlan').add({
            vlanIds: vlanId,
            bridge: bridge,
            tagged: tagged || [],
            untagged: untagged || []
        });

        res.status(200).json({ message: 'VLAN created successfully' });
    } catch (error) {
        console.error('Failed to create VLAN:', error);
        res.status(500).json({ message: 'Failed to create VLAN', error: error.message || error });
    }
});

app.get('/api/get-bridges', async (req, res) => {
    try {
        const bridges = await client.menu('/interface/bridge').getAll();
        res.status(200).json(bridges);
    } catch (error) {
        console.error('Error fetching bridges:', error);
        res.status(500).json({ message: 'Failed to fetch bridges', error: error.message || error });
    }
});
app.post('/api/enable-vlan-filtering', async (req, res) => {
    const { bridgeName, vlanFiltering } = req.body;
    try {
        await client.menu('/interface/bridge').set({
            name: bridgeName,
            'vlan-filtering': vlanFiltering ? 'yes' : 'no'
        });
        res.status(200).json({ message: 'VLAN Filtering updated successfully' });
    } catch (error) {
        console.error('Error enabling VLAN filtering:', error);
        res.status(500).json({ message: 'Failed to update VLAN Filtering', error: error.message || error });
    }
});

app.post('/api/enable-mvrp', async (req, res) => {
    const { bridgeName, mvrp } = req.body;
    try {
        await client.menu('/interface/bridge').set({
            name: bridgeName,
            mvrp: mvrp ? 'yes' : 'no'
        });
        res.status(200).json({ message: 'MVRP updated successfully' });
    } catch (error) {
        console.error('Error enabling MVRP:', error);
        res.status(500).json({ message: 'Failed to update MVRP', error: error.message || error });
    }
});

app.get('/api/dot1x-data', async (req, res) => {
    try {
        if (!client) throw new Error('Client not connected');

        const dot1xData = await client.menu('/interface/dot1x/client').getAll();
        res.json(dot1xData);
    } catch (error) {
        console.error('Error fetching Dot1x data:', error.message);
        return res.status(500).send(`Error: ${error.message}`);
    }
});
app.get('/api/dot1x-server', async (req, res) => {
    try {
        if (!client) throw new Error('Client not connected');

        const dot1xData = await client.menu('/interface/dot1x/server').getAll();

        res.json(dot1xData);
    } catch (error) {
        console.error('Error fetching Dot1x data:', error.message);
        return res.status(500).send(`Error: ${error.message}`);
    }
});

app.get('/api/radius', async (req, res) => {
    try {
        if (!client) throw new Error('Client not connected');

        const dot1xData = await client.menu('/radius').getAll();

        res.json(dot1xData);
    } catch (error) {
        console.error('Error fetching Radius data:', error.message);
        return res.status(500).send(`Error: ${error.message}`);
    }
});

app.get('/api/certificates', async (req, res) => {
    try {
        if (!client) throw new Error('Client not connected');

        const certificates = await client.menu('/certificate').getAll();
        res.json(certificates);
    } catch (error) {
        console.error('Error fetching certificates:', error.message);
        return res.status(500).send(`Error: ${error.message}`);
    }
});

app.post('/api/create-dot1x-client', async (req, res) => {
    const { interface, eapMethods, identity, password, anonIdentity, certificate } = req.body;
    try {
        if (!client) throw new Error('Client not connected');

        await client.menu('/interface/dot1x/client').add({
            interface: interface,
            'eap-methods': eapMethods,
            'identity': identity,
            'password': password,
            'anon-identity': anonIdentity,
            'certificate': certificate || ''
        });

        res.status(200).send('Dot1x client created successfully');
    } catch (error) {
        console.error('Error creating Dot1x client:', error.message);
        return res.status(500).send(`Error: ${error.message}`);
    }
});

app.post('/api/create-dot1x-server', async (req, res) => {
    const { interface, dot1xAuth, macAuth, macAuthMode, radiusMacFormat, accounting } = req.body;
    try {
        if (!client) throw new Error('Client not connected');

        // Správný formát auth-types
        let authTypes = [];
        if (dot1xAuth) authTypes.push('dot1x');
        if (macAuth) authTypes.push('mac-auth');

        await client.menu('/interface/dot1x/server').add({
            interface: interface,
            'auth-types': authTypes.join(","), // Správný formát pro MikroTik API
            'mac-auth-mode': macAuthMode || '',
            'radius-mac-format': radiusMacFormat || '',
            'accounting': accounting ? 'yes' : 'no',
        });

        res.status(200).send('Dot1x server created successfully');
    } catch (error) {
        console.error('Error creating Dot1x server:', error.message);
        return res.status(500).send(`Error: ${error.message}`);
    }
});
app.post('/api/create-radius', async (req, res) => {
    const {
        ppp, hotspot, dhcp, dot1x, login, wireless, ipsec, address, protocol, secret, authenticationPort, accountingPort, timeout, requireMessageAuth, srcAddress,} = req.body;

    try {
        if (!client) throw new Error('Client not connected');

        // Připravíme pole služeb, které mají být povoleny
        const services = [];
        if (ppp) services.push('ppp');
        if (hotspot) services.push('hotspot');
        if (dhcp) services.push('dhcp');
        if (dot1x) services.push('dot1x');
        if (login) services.push('login');
        if (wireless) services.push('wireless');
        if (ipsec) services.push('ipsec');

        // Vytvoření RADIUS serveru pomocí MikroTik API
        await client.menu('/radius').add({
            service: services.join(","), // Služby jako čárkou oddělený řetězec
            address: address,
            protocol: protocol,
            secret: secret,
            'authentication-port': authenticationPort,
            'accounting-port': accountingPort,
            timeout: timeout,
            'require-message-auth': requireMessageAuth,
            'src-address': srcAddress,
        });

        res.status(200).send('RADIUS server created successfully');
    } catch (error) {
        console.error('Error creating RADIUS server:', error.message);
        return res.status(500).send(`Error: ${error.message}`);
    }
});
app.delete('/api/delete-dot1x-client/:id', async (req, res) => {
    const { id } = req.params;
    try {
        if (!client) throw new Error('Client not connected');

        await client.menu('/interface/dot1x/client').remove(id);

        res.status(200).send('Dot1x client deleted successfully');
    } catch (error) {
        console.error('Error deleting Dot1x client:', error.message);
        return res.status(500).send(`Error: ${error.message}`);
    }
});

app.delete('/api/delete-dot1x-server/:id', async (req, res) => {
    const { id } = req.params;
    try {
        if (!client) throw new Error('Client not connected');

        await client.menu('/interface/dot1x/server').remove(id);

        res.status(200).send('Dot1x server deleted successfully');
    } catch (error) {
        console.error('Error deleting Dot1x Server:', error.message);
        return res.status(500).send(`Error: ${error.message}`);
    }
});
app.delete('/api/delete-radius/:id', async (req, res) => {
    const { id } = req.params;
    try {
        if (!client) throw new Error('Client not connected');

        await client.menu('/radius').remove(id);

        res.status(200).send('Radius deleted successfully');
    } catch (error) {
        console.error('Error deleting radius Server:', error.message);
        return res.status(500).send(`Error: ${error.message}`);
    }
});
process.on('SIGINT', async () => {
    if (client) {
        await api.close();
        console.log('Disconnected from MikroTik API');
    }
    process.exit();
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});