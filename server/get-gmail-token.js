const { google } = require('googleapis');
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = process.argv[2] || path.join(__dirname, '..', 'credentials.json');
const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];
const REDIRECT_URI = 'http://localhost:3000/oauth/callback';

async function main() {
    if (!fs.existsSync(CREDENTIALS_PATH)) {
        console.error('No se encontró credentials.json en:', CREDENTIALS_PATH);
        console.error('Pasá la ruta como argumento: node get-gmail-token.js "ruta/al/credentials.json"');
        process.exit(1);
    }

    const creds = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const { client_id, client_secret } = creds.web;

    const oauth2Client = new google.auth.OAuth2(client_id, client_secret, REDIRECT_URI);

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
    });

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  PASO 1: Agregá esta URI en Google Cloud Console           ║');
    console.log('║  API & Services → Credentials → Editar OAuth 2.0 Client   ║');
    console.log('║  Agregá como redirect URI autorizado:                      ║');
    console.log(`║  ${REDIRECT_URI}               ║`);
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('\nPresioná Enter cuando hayas agregado la URI...');
    await waitForEnter();

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  PASO 2: Abrí esta URL en tu navegador                      ║');
    console.log('║  Iniciá sesión con hubvntg@gmail.com                        ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('\n' + authUrl + '\n');

    const server = http.createServer(async (req, res) => {
        const parsed = url.parse(req.url, true);
        if (parsed.pathname === '/oauth/callback') {
            const code = parsed.query.code;
            if (!code) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Error: no se recibió el código de autorización');
                return;
            }

            try {
                const { tokens } = await oauth2Client.getToken(code);
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(`<html><body><h2>✅ Token obtenido</h2><p>Ya podés cerrar esta ventana.</p></body></html>`);
                server.close();

                console.log('\n╔══════════════════════════════════════════════════════════════╗');
                console.log('║  REFRESH TOKEN (agregalo al .env):                          ║');
                console.log('╚══════════════════════════════════════════════════════════════╝');
                console.log(`\nGMAIL_CLIENT_ID=${client_id}`);
                console.log(`GMAIL_CLIENT_SECRET=${client_secret}`);
                console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}\n`);
                console.log('╔══════════════════════════════════════════════════════════════╗');
                console.log('║  Copiá esas 3 líneas al final de tu archivo .env           ║');
                console.log('╚══════════════════════════════════════════════════════════════╝\n');
            } catch (err) {
                console.error('Error al obtener token:', err.message);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error al obtener token');
            }
        }
    });

    server.listen(3000, () => {
        console.log('Esperando callback en http://localhost:3000/oauth/callback ...');
    });
}

function waitForEnter() {
    return new Promise(resolve => {
        process.stdin.once('data', () => resolve());
    });
}

main().catch(console.error);
