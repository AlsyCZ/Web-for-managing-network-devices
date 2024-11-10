const express = require('express');
const cors = require('cors');
const { RouterOSClient } = require('routeros-client');
const path = require('path');
const dotenv = require('dotenv');

const app = express();

// Allow requests from localhost:3000 (React development server)
const corsOptions = {
    origin: 'http://localhost:3000', // Allow requests from React app
    methods: 'GET,POST,DELETE',      // Allow certain HTTP methods
    allowedHeaders: 'Content-Type',  // Allow headers
};

app.use(cors(corsOptions)); // Use CORS middleware with options

dotenv.config();

const api = new RouterOSClient({
    host: process.env.API_HOST,
    user: process.env.API_USER,
    password: process.env.API_PASSWORD,
    tls: { rejectUnauthorized: false },
    port: process.env.API_PORT
});


app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/raw-data', async (req, res) => {
    try {
        const client = await api.connect();

        const arpTable = await client.menu('/ip/arp').getAll();
        console.log('ARP Table:', arpTable);

        const dhcpLeases = await client.menu('/ip/dhcp-server/lease').getAll();
        console.log('DHCP Leases:', dhcpLeases);

        const bridgeHosts = await client.menu('/interface bridge host').getAll();
        console.log('Bridge Hosts:', bridgeHosts);

        // Logging all retrieved data
        dhcpLeases.forEach(lease => console.log('DHCP Leases:', lease));

        await api.close();
        res.json({ arpTable, dhcpLeases, bridgeHosts });
    } catch (error) {
        console.error('Chyba při připojení k MikroTiku: ', error);
        res.status(500).send('Chyba při připojení k MikroTiku: ' + error.message);
    }
});

app.get('/api/device-detail/:address', async (req, res) => {
    const { address } = req.params;

    try {
        const client = await api.connect();

        // Získání ARP tabulky
        const arpTable = await client.menu('/ip/arp').getAll();
        const arpEntry = arpTable.find(entry => entry.address === address);
        console.log('Found ARP Entry:', arpEntry);

        if (!arpEntry) {
            await api.close();
            return res.status(404).send('Zařízení nenalezeno v ARP tabulce');
        }

        // Získání DHCP leases
        const dhcpLeases = await client.menu('/ip/dhcp-server/lease').getAll();
        const dhcpLease = dhcpLeases.find(lease => lease.address === address);
        const isDhcpEnabled = Boolean(dhcpLease);
        console.log('Found DHCP Lease:', dhcpLease);

        // Získání Bridge Hosts
        const bridgeHosts = await client.menu('/interface bridge host').getAll();
        const bridgeHost = bridgeHosts.find(host => host.macAddress === arpEntry.macAddress);
        console.log('Found Bridge Host:', bridgeHost);

        // Získání hostName a status
        const hostName = dhcpLease?.['hostName'] || 'Neznámé zařízení';
        const macAddress = arpEntry.macAddress || 'Neznámá MAC adresa';
        const bridgePort = bridgeHost ? bridgeHost.interface : 'Není k dispozici';
        const status = dhcpLease?.status || arpEntry.status || 'Status není k dispozici';

        const result = {
            address,
            hostName,
            macAddress,
            bridgePort,
            status,
            isDhcpEnabled
        };

        await api.close();
        res.json(result);
    } catch (error) {
        console.error('Chyba při získávání dat zařízení:', error);
        res.status(500).send('Chyba při získávání dat zařízení: ' + error.message);
    }
});


// Assuming the DELETE request targets /api/delete-arp/:address
app.delete('/api/delete-arp/:address', async (req, res) => {
    const { address } = req.params;

    try {
        const client = await api.connect();
        await client.menu('/ip/arp').remove({ address });
        await api.close();
        res.status(200).send('ARP entry deleted successfully');
    } catch (error) {
        console.error('Error deleting ARP entry:', error);
        res.status(500).send('Error deleting ARP entry');
    }
});



app.listen(3001, () => {
    console.log('Server běží na http://localhost:3001');
});
