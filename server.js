const express = require('express');
const cors = require('cors');
const { RouterOSClient } = require('routeros-client');
const path = require('path');
const dotenv = require('dotenv');
const WebSocket = require('ws'); // Import WebSocket

const app = express();
dotenv.config();

const corsOptions = {
    origin: 'http://localhost:3000', // Allow requests from React app
    methods: 'GET,POST,DELETE',
    allowedHeaders: 'Content-Type',
};
app.use(cors(corsOptions));

const api = new RouterOSClient({
    host: process.env.API_HOST,
    user: process.env.API_USER,
    password: process.env.API_PASSWORD,
    tls: { rejectUnauthorized: false },
    port: process.env.API_PORT,
});

// To avoid MaxListenersExceededWarning, set the max listeners to a high number or disable it
api.setMaxListeners(20);

let isConnecting = false;

const connectToApi = async () => {
    if (!isConnecting) {
        isConnecting = true;
        try {
            await api.connect();
        } catch (error) {
            console.error('Error connecting to MikroTik:', error);
        } finally {
            isConnecting = false;
        }
    }
};

const server = app.listen(3001, () => {
    console.log('Server running at http://localhost:3001');
});

// WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');

    ws.on('close', () => {
        console.log('Client disconnected from WebSocket');
    });
});

let isConnected = false; // Proměnná, která sleduje stav připojení

const connectToAPI = async () => {
    if (!isConnected) { // Pokud není připojeno, pokus se připojit
        await api.connect();
        isConnected = true;
    }
};

const closeApiConnection = async () => {
    if (isConnected) { // Pokud je připojeno, zavři připojení
        await api.close();
        isConnected = false;
    }
};

const sendArpUpdates = async () => {
    try {
        await connectToAPI(); // Připojí se jen, pokud není připojeno

        const arpTable = await api.menu('/ip/arp').getAll();
        const dhcpLeases = await api.menu('/ip/dhcp-server/lease').getAll();
        const bridgeHosts = await api.menu('/interface bridge host').getAll();

        // Pošle aktualizovaná data všem připojeným klientům
        const data = JSON.stringify({ arpTable, dhcpLeases, bridgeHosts });
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    } catch (error) {
        console.error('Error fetching ARP data:', error);
    } finally {
        await closeApiConnection(); // Zavře připojení po dokončení
    }
};


app.get('/api/device-detail/:address', async (req, res) => {
    const { address } = req.params;

    try {
        await connectToApi();

        const arpTable = await api.menu('/ip/arp').getAll();
        const arpEntry = arpTable.find(entry => entry.address === address);
        console.log('Found ARP Entry:', arpEntry);

        if (!arpEntry) {
            await api.close();
            return res.status(404).send('Device not found in ARP table');
        }

        const dhcpLeases = await api.menu('/ip/dhcp-server/lease').getAll();
        const dhcpLease = dhcpLeases.find(lease => lease.address === address);
        const isDhcpEnabled = Boolean(dhcpLease);
        console.log('Found DHCP Lease:', dhcpLease);

        const bridgeHosts = await api.menu('/interface bridge host').getAll();
        const bridgeHost = bridgeHosts.find(host => host.macAddress === arpEntry.macAddress);
        console.log('Found Bridge Host:', bridgeHost);

        const result = {
            address,
            hostName: dhcpLease?.['hostName'] || 'Unknown device',
            macAddress: arpEntry.macAddress || 'Unknown MAC address',
            bridgePort: bridgeHost ? bridgeHost.interface : 'Not available',
            status: dhcpLease?.status || arpEntry.status || 'Status not available',
            isDhcpEnabled
        };

        await api.close();
        res.json(result);
    } catch (error) {
        console.error('Error fetching device data:', error);
        res.status(500).send('Error fetching device data: ' + error.message);
    }
});

// Fetch ARP data and broadcast updates every 10 seconds
setInterval(sendArpUpdates, 10000);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/raw-data', async (req, res) => {
    try {
        await connectToApi();

        const arpTable = await api.menu('/ip/arp').getAll();
        const dhcpLeases = await api.menu('/ip/dhcp-server/lease').getAll();
        const bridgeHosts = await api.menu('/interface bridge host').getAll();

        await api.close();
        res.json({ arpTable, dhcpLeases, bridgeHosts });
    } catch (error) {
        console.error('Error connecting to MikroTik:', error);
        res.status(500).send('Error connecting to MikroTik: ' + error.message);
    }
});

app.delete('/api/delete-arp/:address', async (req, res) => {
    const { address } = req.params;

    try {
        await connectToApi();
        await api.menu('/ip/arp').remove({ address });
        await api.close();
        res.status(200).send('ARP entry deleted successfully');
    } catch (error) {
        console.error('Error deleting ARP entry:', error);
        res.status(500).send('Error deleting ARP entry');
    }
});
