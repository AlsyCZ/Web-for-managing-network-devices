const express = require('express');
const cors = require('cors');
const { RouterOSClient } = require('routeros-client');
const path = require('path');
const dotenv = require('dotenv');

const app = express();
app.use(cors());
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

app.listen(3001, () => {
    console.log('Server běží na http://localhost:3001');
});
