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

// Property lead detection for Nyali and Bamburi.
// Keep this list focused on property opportunities, not general local services.
const AREA_PATTERNS = [
  { name: 'Nyali', pattern: /\bnyali\b/i },
  { name: 'Bamburi', pattern: /\bbamburi\b/i }
];

const PROPERTY_RULES = [
  {
    id: 'short-stay',
    name: 'Short-stay / Airbnb inquiry',
    priority: 'CRITICAL',
    pattern: /\b(?:airbnb|a\s?b\s?b|bnb|holiday home|holiday rental|short[\s-]?stay|nightly stay|furnished apartment|serviced apartment|vacation rental|weekend stay|place to stay|somewhere to stay|accommodation|guest house|hotel room)\b/i
  },
  {
    id: 'long-term-rental',
    name: 'Long-term rental inquiry',
    priority: 'HIGH',
    pattern: /\b(?:long[\s-]?term rent(?:al)?|house to let|flat to rent|apartment to rent|apartment for rent|house for rent|monthly rent|annual lease|lease|bedsitter|studio apartment|unfurnished house|vacant apartment|vacant house|looking for (?:a )?(?:house|home|apartment|flat|bedsitter|studio|room)|need (?:a )?(?:house|home|apartment|flat|bedsitter|studio|room)|place to live|rental house|rental apartment|one bedroom|two bedroom|three bedroom|1br|2br|3br)\b/i
  },
  {
    id: 'property-owner-agent',
    name: 'Property owner / agent opportunity',
    priority: 'HIGH',
    pattern: /\b(?:property management|property manager|manage my property|manage my apartment|hosting partner|host my apartment|landlord|property agent|real estate agent|caretaker|vacant unit|unit available|apartment available|house available|house to let|property to let|looking for tenants|tenant wanted)\b/i
  },
  {
    id: 'property-sale',
    name: 'Property sale / investment inquiry',
    priority: 'NORMAL',
    pattern: /\b(?:house for sale|land for sale|plot for sale|apartment for sale|property for sale|buy a house|buying property|buy an apartment|property investment|plot to buy|land to buy)\b/i
  },
  {
    id: 'property-referral',
    name: 'Property recommendation / referral',
    priority: 'HIGH',
    pattern: /\b(?:recommend|recommendation|anyone know|anyone has|anyone with|looking for|searching for|need|require|available|availability|booking|book|reserve|reservation|how much|what is the rate|price per night|monthly budget|budget is)\b/i
  }
];

const PROPERTY_CONTEXT_PATTERN =
  /\b(?:airbnb|bnb|accommodation|apartment|flat|house|bedsitter|studio|rental|rent|to let|lease|property|plot|land|villa|holiday home|furnished|unfurnished|booking|host|landlord|tenant|caretaker|real estate|room|bedroom|\d\s?br|unit|guest house|hotel)\b/i;

// WhatsApp destination for property-lead notifications.
// Kenya local format 0112415949 is normalized to 254112415949@s.whatsapp.net.
const LEADS_WHATSAPP_NUMBER = process.env.LEADS_WHATSAPP_NUMBER || '0112415949';

function getLeadsWhatsAppJid() {
  let digits = String(LEADS_WHATSAPP_NUMBER).replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `254${digits.slice(1)}`;
  return `${digits}@s.whatsapp.net`;
}

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

// Send a property-lead alert to the chosen WhatsApp number using the active Baileys session.
async function sendWhatsAppAlert(lead) {
  if (!sock || status !== 'CONNECTED') {
    console.warn('[WhatsApp alert] Cannot send: WhatsApp session is not connected.');
    return false;
  }

  const priorityLabel = lead.priority === 'CRITICAL'
    ? '🚨 CRITICAL PROPERTY LEAD'
    : lead.priority === 'HIGH'
      ? '🔔 HIGH PRIORITY PROPERTY LEAD'
      : '🏠 PROPERTY OPPORTUNITY';

  const text = [
    priorityLabel,
    '',
    `📍 Area: ${(lead.matchedAreas || []).join(', ') || 'Nyali / Bamburi'}`,
    `👥 Group: ${lead.groupName || 'WhatsApp Group'}`,
    `👤 Sender: ${lead.author || 'Unknown'} (${lead.authorPhone || 'Unknown'})`,
    `🏷️ Category: ${lead.ruleName || 'Property inquiry'}`,
    `🎯 Matched signals: ${(lead.matchedKeywords || []).join(', ') || 'N/A'}`,
    '',
    '💬 Message:',
    lead.text || '',
    '',
    `⏰ Time: ${lead.timestamp || new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })}`
  ].join('\n');

  try {
    const recipient = getLeadsWhatsAppJid();
    await sock.sendMessage(recipient, { text });
    console.log(`[WhatsApp alert] Property lead sent to ${recipient}.`);
    return true;
  } catch (err) {
    console.error('[WhatsApp alert] Failed to send lead:', err.message);
    return false;
  }
}

// Classify property-related messages in the target operating areas.
// A message must mention Nyali or Bamburi and contain property context.
function checkMessageForKeywords(messageText) {
  if (typeof messageText !== 'string' || !messageText.trim()) return null;

  const text = messageText
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  const matchedAreas = AREA_PATTERNS.filter(area => area.pattern.test(text));
  if (matchedAreas.length === 0) return null;

  if (!PROPERTY_CONTEXT_PATTERN.test(text)) return null;

  const matchedRules = PROPERTY_RULES.filter(rule => rule.pattern.test(text));
  if (matchedRules.length === 0) return null;

  // Don't classify casual mentions of the beach/area as leads unless the
  // message also contains a property category or clear property context.
  const categories = matchedRules.map(rule => rule.name);
  const hasShortStay = matchedRules.some(rule => rule.id === 'short-stay');
  const hasLongTermRental = matchedRules.some(rule => rule.id === 'long-term-rental');
  const hasOwnerOpportunity = matchedRules.some(rule => rule.id === 'property-owner-agent');
  const hasSaleIntent = matchedRules.some(rule => rule.id === 'property-sale');

  // Prioritise potential short-stay guests; retain other property opportunities.
  let priority = 'NORMAL';
  if (hasShortStay) priority = 'CRITICAL';
  else if (hasLongTermRental || hasOwnerOpportunity) priority = 'HIGH';

  const matchedKeywords = [
    ...matchedAreas.map(area => area.name),
    ...matchedRules.map(rule => rule.name)
  ];

  let leadType = 'Property inquiry';
  if (hasShortStay) leadType = 'Potential short-stay / Airbnb guest';
  else if (hasLongTermRental) leadType = 'Potential long-term tenant';
  else if (hasOwnerOpportunity) leadType = 'Property owner / agent opportunity';
  else if (hasSaleIntent) leadType = 'Property sale / investment';
  else if (categories.includes('Property recommendation / referral')) {
    leadType = 'Property referral';
  }

  return {
    ruleName: categories.join(' + '),
    priority,
    matchedKeywords: [...new Set(matchedKeywords)],
    matchedAreas: matchedAreas.map(area => area.name),
    categories,
    leadType
  };
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

    // Main Group Message Listener. Process every message in each upsert event.
    sock.ev.on('messages.upsert', async (m) => {
      if (!Array.isArray(m.messages) || m.messages.length === 0) return;

      for (const msg of m.messages) {
        try {
          if (!msg?.message || msg.key?.fromMe) continue;

          const remoteJid = msg.key?.remoteJid;
          const isGroup = typeof remoteJid === 'string' && remoteJid.endsWith('@g.us');
          if (!isGroup) continue;

          // Ignore protocol-only events and extract common text/caption formats.
          const messageContent = msg.message;
          const text = messageContent.conversation
            || messageContent.extendedTextMessage?.text
            || messageContent.imageMessage?.caption
            || messageContent.videoMessage?.caption
            || messageContent.documentMessage?.caption
            || messageContent.buttonsResponseMessage?.selectedDisplayText
            || messageContent.listResponseMessage?.title
            || messageContent.templateButtonReplyMessage?.selectedDisplayText
            || '';

          if (typeof text !== 'string' || !text.trim()) continue;

          const senderPhone = msg.key?.participant
            ? msg.key.participant.split('@')[0]
            : 'Unknown';
          const senderName = msg.pushName || (senderPhone !== 'Unknown' ? `+${senderPhone}` : 'Unknown');

          const foundGroup = groupsList.find(group => group.id === remoteJid);
          const groupName = foundGroup?.name || remoteJid.replace('@g.us', '');

          console.log(`[Message in "${groupName}"] from ${senderName}: "${text.slice(0, 80)}"`);

          const match = checkMessageForKeywords(text);
          if (!match) continue;

          console.log(`\n🏠 PROPERTY LEAD MATCHED in [${groupName}]!`);
          console.log(`Category: ${match.ruleName}`);
          console.log(`Areas: ${match.matchedAreas.join(', ')}`);
          console.log(`Sender: ${senderName} (${senderPhone})`);
          console.log(`Text: "${text}"\n`);

          const leadAlert = {
            id: `lead-${msg.key?.id || Date.now()}`,
            groupName,
            author: senderName,
            authorPhone: senderPhone === 'Unknown' ? 'Unknown' : `+${senderPhone}`,
            text,
            ruleName: match.ruleName,
            leadType: match.leadType,
            priority: match.priority,
            matchedKeywords: match.matchedKeywords,
            matchedAreas: match.matchedAreas,
            timestamp: new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })
          };

          broadcast({ type: 'REAL_MESSAGE', message: leadAlert });
          await sendWhatsAppAlert(leadAlert);
        } catch (messageError) {
          console.error('[WhatsApp] Failed to process an incoming group message:', messageError.message);
        }
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
          <p style="color: #8696a0; font-size: 13px;">Any matching Nyali / Bamburi property leads will be sent to WhatsApp number 0112415949.</p>
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

// Test WhatsApp lead notification route
app.post('/api/test-whatsapp', async (req, res) => {
  const success = await sendWhatsAppAlert({
    groupName: 'Nyali & Bamburi Real Estate Deals',
    author: 'Test Client',
    authorPhone: '+254700000000',
    ruleName: 'Short-stay / Airbnb inquiry',
    leadType: 'Potential short-stay / Airbnb guest',
    priority: 'CRITICAL',
    matchedAreas: ['Nyali'],
    matchedKeywords: ['Nyali', 'Short-stay / Airbnb inquiry'],
    timestamp: new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' }),
    text: 'Hello, I am looking for an Airbnb in Nyali for 2 nights.'
  });
  res.status(success ? 200 : 503).json({
    success,
    message: success
      ? 'Test alert sent to WhatsApp number 0112415949.'
      : 'Test alert could not be sent. Check that WhatsApp is connected and review the server logs.'
  });
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
