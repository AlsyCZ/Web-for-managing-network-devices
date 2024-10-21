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
app.get('/api/device/:address', async (req, res) => {
    const { address } = req.params;

    try {
        const client = await api.connect();

        const device = await client.menu('/ip/dhcp-server/lease').find({ address });
        const isDhcpEnabled = device.length > 0;

        const result = {
            address,
            hostName: device.length ? device[0]['host-name'] : 'Neznámé zařízení',
            isDhcpEnabled
        };

        await api.close();
        res.json(result);
    } catch (error) {
        console.error('Chyba při získávání dat zařízení:', error);
        res.status(500).send('Chyba při získávání dat zařízení');
    }
});
app.post('/api/update-device', async (req, res) => {
    const { address, staticIp, isDhcpEnabled } = req.body;

    try {
        const client = await api.connect();

        if (isDhcpEnabled) {
            await client.menu('/ip/dhcp-server/lease').set({
                address,
                'dynamic': true
            });
        } else {
            await client.menu('/ip/address').add({
                address: staticIp,
                interface: 'ether1'
            });
        }

        await api.close();
        res.status(200).send('Zařízení úspěšně aktualizováno');
    } catch (error) {
        console.error('Chyba při aktualizaci zařízení:', error);
        res.status(500).send('Chyba při aktualizaci zařízení');
    }
});


app.listen(3001, () => {
    console.log('Server běží na http://localhost:3001');
});
