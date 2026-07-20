#!/usr/bin/env node
/**
 * WhatsApp Bot API Server - Bagaskara Premium
 * 
 * Script ini berfungsi sebagai bridge/bot WhatsApp yang menerima request HTTP POST
 * dari web store Next.js untuk mengirimkan notifikasi pesanan ke pembeli.
 * 
 * Penggunaan:
 *   npm run wa-bot
 * 
 * Jalankan script ini di VPS (bisa menggunakan PM2 agar berjalan di background).
 * Saat pertama kali dijalankan, scan QR Code yang muncul di terminal menggunakan WhatsApp Anda.
 */

const http = require('http');
const path = require('path');
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');

// Load environment variables dari Next.js (.env / .env.local)
try {
  const { loadEnvConfig } = require('@next/env');
  loadEnvConfig(process.cwd());
} catch (e) {
  console.warn('⚠️ Gagal memuat @next/env, mencoba membaca process.env secara manual.');
}

const WA_BOT_KEY = process.env.WA_BOT_KEY || 'wa-bot-key-123';
const WA_BOT_URL = process.env.WA_BOT_URL || 'http://localhost:8000';

let port = 8000;
try {
  const urlObj = new URL(WA_BOT_URL);
  port = parseInt(urlObj.port) || 8000;
} catch (e) {
  console.warn(`⚠️ WA_BOT_URL tidak valid ("${WA_BOT_URL}"). Menggunakan port fallback: 8000`);
}

// Inisialisasi WhatsApp Client
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: path.resolve(process.cwd(), '.wwebjs_auth')
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--disable-gpu'
    ]
  },
  webVersionCache: {
    type: 'remote',
    remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
  }
});

let isBotReady = false;

// Event: Menampilkan QR Code di terminal
client.on('qr', (qr) => {
  console.log('\n======================================================================');
  console.log('👉 SCAN QR CODE INI DENGAN WHATSAPP ANDA UNTUK LOGIN BOT:');
  console.log('======================================================================\n');
  qrcode.generate(qr, { small: true });
  console.log('\n======================================================================\n');
});

// Event: Bot siap digunakan
client.on('ready', () => {
  isBotReady = true;
  console.log('\n======================================================================');
  console.log('✅ Bot WhatsApp terhubung dan siap mengirim notifikasi!');
  console.log('======================================================================\n');
});

// Event: Gagal login/autentikasi
client.on('auth_failure', (msg) => {
  console.error('❌ Gagal otentikasi WhatsApp:', msg);
});

// Event: Terputus
client.on('disconnected', (reason) => {
  isBotReady = false;
  console.log('⚠️ Bot WhatsApp terputus:', reason);
});

// Inisialisasi Client
console.log('[WA-BOT] Sedang menginisialisasi Client WhatsApp (silakan tunggu)...');
client.initialize();

// Membuat Server HTTP Ringan tanpa Express
const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Endpoint: POST /send
  if (req.method === 'POST' && req.url === '/send') {
    const apiKey = req.headers['x-api-key'];

    // Verifikasi API Key
    if (apiKey !== WA_BOT_KEY) {
      console.warn(`[WA-BOT] Percobaan akses tanpa izin dengan API Key: "${apiKey}"`);
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Forbidden: API Key salah' }));
      return;
    }

    // Verifikasi status koneksi Bot
    if (!isBotReady) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Service Unavailable: Bot belum login / belum siap' }));
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const { to, message } = payload;

        if (!to || !message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Parameter "to" dan "message" wajib diisi' }));
          return;
        }

        // Membersihkan nomor telepon dan format ke JID whatsapp-web.js (628xxx@c.us)
        let cleanTo = to.replace(/\D/g, '');
        if (cleanTo.startsWith('0')) {
          cleanTo = '62' + cleanTo.slice(1);
        }
        
        const formattedTo = cleanTo.includes('@c.us') ? cleanTo : `${cleanTo}@c.us`;

        console.log(`[WA-BOT] Mengirim pesan ke ${cleanTo}...`);
        await client.sendMessage(formattedTo, message);
        console.log(`[WA-BOT] Pesan berhasil dikirim ke ${cleanTo}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        console.error('[WA-BOT] Gagal mengirim pesan:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Not Found' }));
  }
});

// Jalankan Server HTTP
server.listen(port, () => {
  console.log(`[WA-BOT] HTTP API Server berjalan di http://localhost:${port}`);
  console.log(`[WA-BOT] Gunakan token x-api-key: "${WA_BOT_KEY}"`);
});
