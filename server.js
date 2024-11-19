const express = require('express');
const cors = require('cors');
const { RouterOSClient } = require('routeros-client');
const path = require('path');
const dotenv = require('dotenv');

const app = express();

app.use(express.json());

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
    port: process.env.API_PORT,
    timeout: 40000 // Increase timeout to 30 seconds or more
});

let client = null;
let isConnecting = false; // Flag to indicate if a connection is being established

const connectToApi = async () => {
    if (isConnecting || client) return;

    isConnecting = true;
    try {
        client = await api.connect();
        console.log('Connected to MikroTik API');
    } catch (error) {
        console.error('Error connecting to MikroTik:', error);
        // Retry connection after a delay
        setTimeout(connectToApi, 5000); // Attempt to reconnect after 5 seconds
    } finally {
        isConnecting = false;
    }
};

// Keep the connection alive by periodically querying the router
const keepAliveInterval = 30000; // Every 15 seconds

const sendKeepAlive = async () => {
    if (client) {
        try {
            await client.menu('/system/resource').getAll(); // Run a harmless command
        } catch (error) {
            console.error('Keep-alive ping failed:', error);
            client = null; // Reset client if the keep-alive fails
            connectToApi(); // Attempt to reconnect
        }
    }
};

setInterval(sendKeepAlive, keepAliveInterval);

require('events').EventEmitter.defaultMaxListeners = 0;

app.use(express.static(path.join(__dirname, 'public')));

// Initial connection attempt at startup
connectToApi().catch(error => console.error('Initial connection error:', error));

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
            isBanned: rules.length > 0, // Pokud existuje pravidlo, IP je v banu
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
        const comment = `ban-${ipAddress}`; // Unikátní komentář pro každou IP adresu

        if (ban) {
            // Přidání pravidla do firewallu s unikátním komentářem
            await client.menu('/ip/firewall/filter/').add({
                chain: 'forward',
                srcAddress: ipAddress,
                action: 'drop',
                comment: comment,
            });
            res.status(200).send(`IP adresa ${ipAddress} zablokována`);
        } else {
            // Vyhledání pravidla podle unikátního komentáře
            const rules = await client.menu('/ip/firewall/filter/').getAll({
                comment: comment,
            });

            if (!rules || rules.length === 0) {
                console.log(`Pravidlo s komentářem ${comment} nebylo nalezeno.`);
                return res.status(404).send(`Pravidlo s komentářem ${comment} nenalezeno`);
            }
            // Smazání pravidel nalezených podle komentáře
            for (const rule of rules) {
                if (!rule.id) {
                    console.error('Pravidlo nemá platné ID:', rule);
                    continue; // Přeskoč pravidla bez ID
                }
                await client.menu('/ip/firewall/filter/').remove(rule.id);
            }
            res.status(200).send(`IP adresa ${ipAddress} odblokována`);
        }
    } catch (error) {
        console.error('Chyba při nastavování pravidla:', error);
        res.status(500).send('Chyba při nastavování pravidla');
    }
});
const axios = require('axios');

app.post('/api/make-static', async (req, res) => {
    const { ipAddress } = req.body;

    try {
        if (!client) throw new Error('Klient není připojen');

        const dhcpLeases = await client.menu('/ip/dhcp-server/lease').getAll();
        console.log('Retrieved DHCP Leases:', dhcpLeases);

        const lease = dhcpLeases.find(l => l.address === ipAddress);
        if (!lease) {
            console.log('Lease not found for IP:', ipAddress);
            return res.status(404).send('DHCP lease pro tuto IP adresu nebyl nalezen');
        }

        console.log('Lease found:', lease);

        // Použijeme HTTP POST požadavek k provedení příkazu make-static
        const response = await axios.post(`http://${process.env.API_HOST}/rest/ip/dhcp-server/lease/make-static`, {
            numbers: lease.id
        }, {
            auth: {
                username: process.env.API_USER, // Zkonfigurováno v .env souboru
                password: process.env.API_PASSWORD // Zkonfigurováno v .env souboru
            },
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 200) {
            res.status(200).send(`IP adresa ${ipAddress} byla nastavena jako statická`);
        } else {
            throw new Error('Nepodařilo se nastavit statickou IP adresu');
        }
    } catch (error) {
        console.error('Chyba při nastavování statické IP adresy:', error);
        res.status(500).send('Chyba při nastavování statické IP adresy');
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

// Ensure the connection is properly closed when the server is stopped
process.on('SIGINT', async () => {
    if (client) {
        await api.close();
        console.log('Disconnected from MikroTik API');
    }
    process.exit();
});

app.listen(3001, () => {
    console.log('Server is running at http://localhost:3001');
});
