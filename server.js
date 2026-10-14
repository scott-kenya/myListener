import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import QRCode from 'qrcode';
import qrcodeTerminal from 'qrcode-terminal';
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import path from 'path';
import fs from 'fs';
import http from 'http';

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files from 'dist' if present
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

// Attach WebSocket server directly to the same HTTP server
const wss = new WebSocketServer({ server });

// Target keywords for Nyali & Bamburi property & BNB inquiries
const PRESCRIBED_RULES = [
  {
    id: 'rule-bnb-urgent',
    name: 'Urgent BNB Inquiry (Nyali & Bamburi)',
    priority: 'CRITICAL',
    keywords: [
      'urgently looking for bnb in nyali',
      'urgently looking for bnb in bamburi',
      'urgent bnb nyali',
      'urgent bnb in nyali',
      'urgent bnb bamburi',
      'urgent bnb in bamburi',
      'bnb in nyali',
      'bnb in bamburi'
    ]
  },
  {
    id: 'rule-house-rent',
    name: 'House Rental Search (Nyali & Bamburi)',
    priority: 'HIGH',
    keywords: [
      'looking for house in nyali',
      'looking for house in bamburi',
      'house for rent in nyali',
      'house for rent in bamburi',
      'house in nyali',
      'house in bamburi'
    ]
  },
  {
    id: 'rule-availability',
    name: 'Host Availability Check',
    priority: 'HIGH',
    keywords: [
      'who is available now in nyali',
      'who is available now bamburi',
      'who is available now in bamburi',
      'available now nyali',
      'available now bamburi'
    ]
  }
];

// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8981263518:AAGMitWrxAOrGXKBlk0Wni1nLZZgTkvqe9c';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '8984858765';

// State
let status = 'INITIALIZING'; // INITIALIZING, QR_READY, CONNECTED, DISCONNECTED
let qrDataUrl = null;
let rawQrString = null;
let connectedUser = null;
let groupsList = [];
let sock = null;

const broadcast = (data) => {
  const payload = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
};

// Send alert directly to Telegram
async function sendTelegramAlert(lead) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('[Telegram] Missing bot token or chat ID.');
    return;
  }

  const priorityEmoji = lead.priority === 'CRITICAL' ? '🚨🚨 CRITICAL' : '🔔 HIGH PRIORITY';
  const text = 
`${priorityEmoji} WHATSAPP LEAD FOUND!

📍 Group: ${lead.groupName}
👤 Sender: ${lead.author} (${lead.authorPhone})
🏷️ Matched Rule: ${lead.ruleName}
🎯 Keyphrase: "${lead.matchedKeywords.join('", "')}"

💬 Message:
"${lead.text}"

⏰ Time: ${new Date().toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi' })}`;

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'HTML'
      })
    });
    const result = await res.json();
    if (result.ok) {
      console.log(`[Telegram] Alert successfully sent to Telegram chat ${TELEGRAM_CHAT_ID}!`);
    } else {
      console.error('[Telegram] Error from Telegram API:', result);
    }
  } catch (err) {
    console.error('[Telegram] Failed to dispatch Telegram alert:', err.message);
  }
}

// Keyword matcher engine
function checkMessageForKeywords(messageText) {
  if (!messageText) return null;
  const lower = messageText.toLowerCase();

  for (const rule of PRESCRIBED_RULES) {
    const matched = [];
    for (const kw of rule.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        matched.push(kw);
      }
    }
    if (matched.length > 0) {
      return {
        ruleName: rule.name,
        priority: rule.priority,
        matchedKeywords: matched
      };
    }
  }
  return null;
}

// Initialize Baileys WhatsApp Connection
async function initWhatsAppSession() {
  try {
    console.log('🔄 Initializing WhatsApp connection...');
    status = 'CONNECTING';
    broadcast({ type: 'STATUS', status, qrDataUrl, connectedUser, groupsCount: groupsList.length });

    const authFolder = path.join(process.cwd(), 'baileys_auth');
    if (!fs.existsSync(authFolder)) {
      fs.mkdirSync(authFolder, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(authFolder);

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ['GroupPulse AI', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        status = 'QR_READY';
        rawQrString = qr;
        qrDataUrl = await QRCode.toDataURL(qr);
        
        console.log('\n================================================================');
        console.log('📱 SCAN THIS WHATSAPP QR CODE WITH YOUR PHONE (Linked Devices):');
        console.log('================================================================\n');
        try {
          qrcodeTerminal.generate(qr, { small: true });
        } catch (e) {}
        console.log('\n👉 Or view the QR code in your browser at: http://localhost:' + PORT + '/qr\n');

        broadcast({ type: 'STATUS', status, qrDataUrl, connectedUser, groupsCount: groupsList.length });
      }

      if (connection === 'open') {
        status = 'CONNECTED';
        qrDataUrl = null;
        rawQrString = null;
        connectedUser = sock.user ? { name: sock.user.name || 'WhatsApp User', id: sock.user.id.split(':')[0] } : null;

        console.log('\n================================================================');
        console.log('✅ WHATSAPP CONNECTED SUCCESSFULLY!');
        console.log(`📱 User Account: ${connectedUser ? connectedUser.id : 'Active'}`);
        console.log('👂 NOW ACTIVELY LISTENING TO ALL JOINED WHATSAPP GROUPS...');
        console.log('================================================================\n');

        try {
          const fetchedGroups = await sock.groupFetchAllParticipating();
          groupsList = Object.values(fetchedGroups).map(g => ({
            id: g.id,
            name: g.subject || 'Unnamed Group',
            membersCount: g.participants ? g.participants.length : 0,
            platform: 'WhatsApp (Real)'
          }));
          console.log(`📋 Found ${groupsList.length} active WhatsApp groups being monitored.`);
        } catch (err) {
          console.error('Error fetching groups list:', err.message);
        }

        broadcast({ 
          type: 'STATUS', 
          status, 
          qrDataUrl: null, 
          connectedUser, 
          groups: groupsList 
        });
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;
        const shouldReconnect = !isLoggedOut;
        console.log(`⚠️ Connection closed (statusCode: ${statusCode}). Reconnecting? ${shouldReconnect}`);
        
        status = 'DISCONNECTED';
        qrDataUrl = null;
        rawQrString = null;
        connectedUser = null;
        broadcast({ type: 'STATUS', status, qrDataUrl: null, connectedUser: null, groupsCount: 0 });

        if (isLoggedOut) {
          console.log('Session logged out or expired. Clearing stale auth folder and generating fresh QR code...');
          const authFolder = path.join(process.cwd(), 'baileys_auth');
          if (fs.existsSync(authFolder)) {
            try { fs.rmSync(authFolder, { recursive: true, force: true }); } catch (e) {}
          }
          setTimeout(initWhatsAppSession, 2000);
        } else {
          setTimeout(initWhatsAppSession, 5000);
        }
      }
    });

    // Main Group Message Listener
    sock.ev.on('messages.upsert', async (m) => {
      if (!m.messages || m.messages.length === 0) return;
      const msg = m.messages[0];

      if (!msg.message || msg.key.fromMe) return;

      const remoteJid = msg.key.remoteJid;
      const isGroup = remoteJid && remoteJid.endsWith('@g.us');

      // We only monitor group messages
      if (!isGroup) return;

      const text = msg.message.conversation || 
                   msg.message.extendedTextMessage?.text || 
                   msg.message.imageMessage?.caption || '';

      if (!text.trim()) return;

      const senderPhone = msg.key.participant ? msg.key.participant.split('@')[0] : 'Unknown';
      const senderName = msg.pushName || `+${senderPhone}`;

      let groupName = 'WhatsApp Group';
      const foundGroup = groupsList.find(g => g.id === remoteJid);
      if (foundGroup) {
        groupName = foundGroup.name;
      } else {
        groupName = remoteJid.replace('@g.us', '');
      }

      console.log(`[Message in "${groupName}"] from ${senderName}: "${text.slice(0, 50)}..."`);

      // Check if text matches any Nyali / Bamburi prescribed keywords
      const match = checkMessageForKeywords(text);

      if (match) {
        console.log(`\n🚨🚨 KEYWORD MATCHED in [${groupName}]!`);
        console.log(`Keywords: ${match.matchedKeywords.join(', ')}`);
        console.log(`Sender: ${senderName} (+${senderPhone})`);
        console.log(`Text: "${text}"\n`);

        const leadAlert = {
          id: 'lead-' + Date.now(),
          groupName,
          author: senderName,
          authorPhone: `+${senderPhone}`,
          text,
          ruleName: match.ruleName,
          priority: match.priority,
          matchedKeywords: match.matchedKeywords,
          timestamp: new Date().toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi' })
        };

        // Broadcast to any open web dashboard
        broadcast({
          type: 'REAL_MESSAGE',
          message: leadAlert
        });

        // SEND DIRECT NOTIFICATION TO TELEGRAM IMMEDIATELY (24/7)
        await sendTelegramAlert(leadAlert);
      }
    });

  } catch (err) {
    console.error('Failed to start WhatsApp session:', err);
    status = 'DISCONNECTED';
    broadcast({ type: 'STATUS', status, qrDataUrl: null, connectedUser: null });
  }
}

// REST Endpoints
app.get('/api/status', (req, res) => {
  res.json({
    status,
    qrDataUrl,
    connectedUser,
    groups: groupsList
  });
});

// Dedicated QR page for easy scanning on any device / phone
app.get('/qr', (req, res) => {
  if (status === 'CONNECTED') {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WhatsApp Connected - GroupPulse AI</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: sans-serif; background: #0b141a; color: #fff; text-align: center; padding: 40px; }
          .card { background: #111b21; border: 1px solid #00a884; border-radius: 16px; padding: 30px; display: inline-block; max-width: 400px; }
          h2 { color: #00a884; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>✅ WhatsApp is Connected!</h2>
          <p>Listening to groups in real time.</p>
          <p>Account: <strong>${connectedUser ? connectedUser.id : 'Active'}</strong></p>
          <p style="color: #8696a0; font-size: 13px;">Any matching Nyali / Bamburi leads will be sent directly to your Telegram.</p>
        </div>
      </body>
      </html>
    `);
  }

  if (qrDataUrl) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Scan WhatsApp QR Code</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta http-equiv="refresh" content="20">
        <style>
          body { font-family: sans-serif; background: #0b141a; color: #fff; text-align: center; padding: 20px; }
          .card { background: #111b21; border: 1px solid #202c33; border-radius: 16px; padding: 24px; display: inline-block; max-width: 420px; }
          img { border: 6px solid #00a884; border-radius: 12px; margin: 15px 0; max-width: 280px; }
          ol { text-align: left; font-size: 14px; color: #8696a0; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2 style="color: #00a884; margin-bottom: 5px;">Scan WhatsApp QR Code</h2>
          <p style="font-size: 13px; color: #8696a0;">Auto-refreshes every 20s</p>
          <img src="${qrDataUrl}" alt="WhatsApp QR Code" />
          <ol>
            <li>Open <strong>WhatsApp</strong> on your phone</li>
            <li>Tap <strong>Settings</strong> or <strong>Menu (⋮)</strong></li>
            <li>Select <strong>Linked Devices</strong> → <strong>Link a Device</strong></li>
            <li>Scan this QR code</li>
          </ol>
        </div>
      </body>
      </html>
    `);
  }

  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Starting...</title><meta http-equiv="refresh" content="3"></head>
    <body style="background: #0b141a; color: #fff; text-align: center; padding: 40px; font-family: sans-serif;">
      <h2>Generating WhatsApp QR Code...</h2>
      <p style="color: #8696a0;">Page will refresh automatically in 3 seconds.</p>
    </body>
    </html>
  `);
});

app.post('/api/connect', (req, res) => {
  if (status !== 'CONNECTED' && status !== 'QR_READY') {
    initWhatsAppSession();
  }
  res.json({ status });
});

app.post('/api/disconnect', async (req, res) => {
  try {
    if (sock) {
      await sock.logout();
    }
    const authFolder = path.join(process.cwd(), 'baileys_auth');
    if (fs.existsSync(authFolder)) {
      fs.rmSync(authFolder, { recursive: true, force: true });
    }
    status = 'DISCONNECTED';
    qrDataUrl = null;
    connectedUser = null;
    groupsList = [];
    broadcast({ type: 'STATUS', status, qrDataUrl: null, connectedUser: null, groups: [] });
    res.json({ message: 'Disconnected & cleared session.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check endpoint for Render / cloud monitoring
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Test telegram alert route
app.post('/api/test-telegram', async (req, res) => {
  await sendTelegramAlert({
    groupName: 'Nyali & Bamburi Real Estate Deals',
    author: 'Test Client',
    authorPhone: '+254700000000',
    ruleName: 'Urgent BNB Inquiry (Nyali & Bamburi)',
    priority: 'CRITICAL',
    matchedKeywords: ['urgently looking for bnb in nyali'],
    text: 'Hello, I am urgently looking for bnb in nyali for 2 nights.'
  });
  res.json({ success: true, message: 'Test alert sent to Telegram!' });
});

// Catch-all for single-page app (Express 5 compatible)
app.use((req, res) => {
  if (fs.existsSync(path.join(distPath, 'index.html'))) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    res.redirect('/qr');
  }
});

// Process-level safety guards to prevent crash-loops
process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Process] Unhandled Rejection:', reason);
});

// Self-ping keepalive for Render Free tier
if (process.env.RENDER_EXTERNAL_URL) {
  const url = process.env.RENDER_EXTERNAL_URL;
  console.log(`[KeepAlive] Configured self-ping for Render: ${url}/health`);
  setInterval(() => {
    fetch(`${url}/health`).catch(() => {});
  }, 10 * 60 * 1000);
}

// Start Server bound to 0.0.0.0 for Render / Docker compatibility
const HOST = '0.0.0.0';
server.listen(PORT, HOST, () => {
  console.log(`\n🚀 GroupPulse AI WhatsApp Listener Server running on http://${HOST}:${PORT}`);
  console.log(`📱 Scan QR Code in browser at: http://${HOST}:${PORT}/qr\n`);
  
  // Auto-start WhatsApp connection immediately
  initWhatsAppSession();
});
