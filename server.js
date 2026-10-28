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

// Area patterns covering Nyali, Bamburi, their estates, beaches, landmarks, and roads
const AREA_PATTERNS = [
  {
    name: 'Nyali',
    // Matches nyali, old nyali, new nyali, links road, greenwood, nyali cinemax, cinemax, city mall, beach road, premier hospital, mkomani, etc.
    pattern: /\b(?:nyali|nyalli|nyli|old[\s_-]?nyali|new[\s_-]?nyali|links[\s_-]?(?:r(?:oa)?d)?|greenwood|nyali[\s_-]?cinemax|cinemax|city[\s_-]?mall|nyali[\s_-]?cent(?:re|er)|beach[\s_-]?(?:r(?:oa)?d)?|premier[\s_-]?hospital|mkomani)\b/i
  },
  {
    name: 'Bamburi',
    // Matches bamburi, bamburi beach, mtambo, fisheries, vescon, kadzandani, masters, haller park, cowrie shell, etc.
    pattern: /\b(?:bamburi|bambury|bambur|bamburi[\s_-]?beach|bamburi[\s_-]?mtambo|mtambo|bamburi[\s_-]?fisheries|fisheries|vescon(?:\s*[123])?|kadzandani|kadzanani|masters|bamburi[\s_-]?masters|haller[\s_-]?park|cowrie[\s_-]?shell)\b/i
  }
];

// Accommodation & Property types (short-stay, holiday, Airbnb, BnB, furnished, sizes, rooms, houses, apartments)
const ACCOMMODATION_PATTERNS = [
  // Airbnb / BnB variations
  /\b(?:air[\s-]?bnb|a\s?b\s?b|bnb|b&b|b\s?n\s?b)\b/i,
  // Short stay / holiday / vacation
  /\b(?:short[\s-]?stay|holiday (?:home|rental|apartment|stay)|vacation (?:rental|home|stay)|staycation|getaway)\b/i,
  // Furnished & serviced units
  /\b(?:(?:fully[\s-]?)?furnished (?:apartment|house|unit|studio|home|flat|place)?|serviced (?:apartment|unit))\b/i,
  // Units / sizes / bedrooms
  /\b(?:studio(?: apartment)?|bed[\s-]?sitter|single room|chumba)\b/i,
  /\b(?:\d+|one|two|three|four)[\s-]*(?:bed(?:room)?s?|bdrms?|bdrs?|brs?|bhk)\b/i,
  // General houses / apartments / places
  /\b(?:apartments?|apts?|flats?|units?|houses?|villas?|cottages?|homes?|residences?|nyumba)\b/i,
  // Places to stay / lodging
  /\b(?:place to stay|somewhere to stay|a place|accommodation|accomodation|guest[\s-]?house|guest[\s-]?wing|hotel(?: room)?|lodging)\b/i
];

// Inquiry intent patterns in English and Swahili/Sheng (covering all natural phrasing humans use)
const INQUIRY_INTENT_PATTERNS = [
  // English search/need/want/booking
  /\b(?:(?:i(?:'m| am)?\s+)?(?:looking for|searching for|in search of|seeking|trying to find|in need of))\b/i,
  /\b(?:(?:i\s+)?(?:need|needs|want|wants|require|requires))\b/i,
  /\b(?:urgently (?:looking for|searching for|need|in need of|seeking)|urgent (?:need|request|search))\b/i,
  /\b(?:(?:looking|planning|want|wanting)\s+to\s+(?:book|rent|stay|get|find|lease))\b/i,
  /\b(?:anyone (?:with|has|knows|can recommend|hosting)|who (?:has|is hosting|can host|knows)|does anyone have)\b/i,
  /\b(?:is there (?:an?|any)|are there (?:any)?|any available)\b/i,
  /\b(?:can (?:anyone|someone|you) recommend|please recommend|kindly recommend|recommend (?:an? |a )?)\b/i,
  /\b(?:any leads?|any link|any recommendations?|any suggestions?)\b/i,
  /\b(?:(?:hosts?|owner)\s+(?:in|for|around)\s+(?:nyali|bamburi))\b/i,
  /\b(?:(?:inbox|dm|text|reach out to)\s+me\s+(?:if you have|with details|with options|with availability))\b/i,
  /\b(?:check(?:ing)?[\s-]?in\s+(?:today|tonight|tomorrow|now|\d+[\w\s]+))\b/i,
  /\b(?:for\s+\d+\s*(?:nights?|days?)|per night|nightly|weekend stay)\b/i,
  /\b(?:budget(?:\s*is)?\s*(?:around|of|is)?\s*(?:ksh|kes)?\s*\d+k?)\b/i,
  /\b(?:wanted\s*[:\s]|needed\s*[:\s]|urgently wanted)\b/i,

  // Swahili & Sheng cues (essential for natural Kenyan WhatsApp communications)
  /\b(?:(?:ni|tu)?natafuta|tafuta)\b/i,                                  // looking for
  /\b(?:(?:ni|tu)?nahitaji|hitaji)\b/i,                                   // need
  /\b(?:kuna (?:yeyote|mwenye|mtu|yule)|kuna)\b/i,                       // is there / is there anyone
  /\b(?:nani (?:ako na|ana|anayejua)|mwenye (?:ako na|ana))\b/i,          // who has / who knows
  /\b(?:yeyote (?:ako na|mwenye)|mko na|uko na)\b/i,                     // anyone with / do you have
  /\b(?:kama (?:kuna|uko na)|iko available|iko wazi)\b/i,                // if there is / is it available
  /\b(?:naomba (?:kupata|msaada)|nisaidie (?:kupata|kutafuta))\b/i,       // requesting / help me find
  /\b(?:nicheki|nitext|nidm|nipigie)\b/i,                                // reach out to me / check me
  /\b(?:kulala|kupanga|kushinda|kukaa)\b/i                               // sleep / rent / stay
];

// Seller advertisement markers to avoid alerting on host promotions or agent adverts
const SELLER_ADVERT_PATTERNS = [
  /\b(?:we (?:offer|have (?:available|units?|apartments?|vacant)|manage))\b/i,
  /\b(?:our (?:apartments?|units?|rates?|prices?|properties|villas?))\b/i,
  /\b(?:welcome to (?:our|the)?\s*[\w\s]+(?:apartments?|residence|court|suites?|villas?))\b/i,
  /\b(?:book your stay with us|enjoy your stay with us|experience luxury at)\b/i,
  /\b(?:daily rate\s*[:=-]|rates?\s*[:=-]\s*(?:ksh|kes)?\s*\d+|price\s*[:=-]\s*(?:ksh|kes)?\s*\d+|rent\s*[:=-]\s*(?:ksh|kes)?\s*\d+)/i,
  /\b(?:paybill|till\s*(?:no|number)?|lipa na mpesa)\b/i,
  /\b(?:now (?:letting|renting|selling)|ready for occupation|units? ready|vacant units?)\b/i,
  /\b(?:plot[s]? for sale|land for sale|house[s]? for sale|property for sale|title deed ready)\b/i,
  /\b(?:amenities\s*[:=-]|features\s*[:=-]|features include\s*[:=-]|free high[\s-]speed wi[\s-]?fi|swimming pool[\s,]+free wifi)/i
];

// Cross-Group Lead Deduplicator: guarantees ONLY ONE PROMPT is delivered per unique inquiry,
// regardless of how many groups the message is posted to.
class LeadDeduplicator {
  constructor(ttlMs = 6 * 60 * 60 * 1000) { // 6 hours deduplication window
    this.ttlMs = ttlMs;
    this.recentLeads = new Map();
    this.maxEntries = 10000;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.recentLeads.entries()) {
      if (now - entry.timestamp > this.ttlMs) {
        this.recentLeads.delete(key);
      }
    }
    if (this.recentLeads.size > this.maxEntries) {
      const excess = this.recentLeads.size - this.maxEntries;
      const keys = Array.from(this.recentLeads.keys()).slice(0, excess);
      for (const k of keys) this.recentLeads.delete(k);
    }
  }

  normalizeForDedupe(text) {
    return (text || '')
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[’‘`´"']/g, '')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  checkAndRecord(senderPhone, rawText, groupName) {
    this.cleanup();
    const now = Date.now();
    const normalized = this.normalizeForDedupe(rawText);

    // Vector 1: Same sender phone + normalized message snippet (catches same person posting in 5-20 groups)
    const hasValidPhone = senderPhone && senderPhone !== 'Unknown' && senderPhone.length >= 7;
    const senderKey = hasValidPhone ? `sender:${senderPhone}:${normalized.slice(0, 80)}` : null;

    // Vector 2: Exact/near-exact inquiry content across groups (catches forwarded broadcasts)
    const contentKey = normalized.length >= 15 ? `content:${normalized.slice(0, 100)}` : null;

    let existing = null;
    let matchType = null;

    if (senderKey && this.recentLeads.has(senderKey)) {
      existing = this.recentLeads.get(senderKey);
      matchType = 'sender_cross_post';
    } else if (contentKey && this.recentLeads.has(contentKey)) {
      existing = this.recentLeads.get(contentKey);
      matchType = 'broadcast_cross_post';
    }

    if (existing) {
      existing.groups.add(groupName);
      existing.duplicateCount = (existing.duplicateCount || 1) + 1;
      return {
        isDuplicate: true,
        firstGroupName: existing.firstGroupName,
        firstSeenAt: existing.timestamp,
        duplicateCount: existing.duplicateCount,
        allGroups: Array.from(existing.groups),
        matchType
      };
    }

    // New unique inquiry
    const entry = {
      timestamp: now,
      firstGroupName: groupName,
      groups: new Set([groupName]),
      senderPhone,
      duplicateCount: 1
    };

    if (senderKey) this.recentLeads.set(senderKey, entry);
    if (contentKey) this.recentLeads.set(contentKey, entry);

    return {
      isDuplicate: false,
      firstGroupName: groupName,
      allGroups: [groupName],
      duplicateCount: 1
    };
  }
}

const leadDeduplicator = new LeadDeduplicator();

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
const processedMessageIds = new Set();
const MAX_PROCESSED_MESSAGE_IDS = 10000;

const broadcast = (data) => {
  const payload = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
};

// Send a short-stay guest enquiry alert to the chosen WhatsApp number using the active Baileys session.
async function sendWhatsAppAlert(lead) {
  if (!sock || status !== 'CONNECTED') {
    console.warn('[WhatsApp alert] Cannot send: WhatsApp session is not connected.');
    return false;
  }

  const priorityLabel = '🏡 POTENTIAL NYALI / BAMBURI INQUIRY';

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
    console.log(`[WhatsApp alert] Guest enquiry alert sent to ${recipient}.`);
    return true;
  } catch (err) {
    console.error('[WhatsApp alert] Failed to send lead:', err.message);
    return false;
  }
}

// Broad human inquiry detection covering English, Swahili, Sheng, casual phrasing, and abbreviations for Nyali and Bamburi
function checkMessageForKeywords(messageText) {
  if (typeof messageText !== 'string' || !messageText.trim()) return null;

  const text = messageText
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  // A message must mention Nyali or Bamburi.
  const matchedAreas = AREA_PATTERNS.filter(area => area.pattern.test(text));
  if (matchedAreas.length === 0) return null;

  // Never alert on land/plot sales.
  if (/\b(?:plots?\s+for\s+sale|land\s+for\s+sale|acres?\s+for\s+sale|title\s+deed\s+ready)\b/i.test(text)) {
    return null;
  }

  // Reject obvious promotions/listings before looking for inquiry words.
  // These are intentionally strong seller-side signals.
  const HARD_AD_PATTERNS = [
    /\b(?:we\s+(?:offer|have|provide|manage|rent\s+out|let\s+out))\b/i,
    /\b(?:our\s+(?:apartments?|units?|houses?|villas?|properties|rates?|prices?|guests?|rooms?))\b/i,
    /\b(?:available\s+(?:now|today|for\s+(?:booking|rent|occupation|short[\s-]?stay)))\b/i,
    /\b(?:now\s+(?:available|booking|letting|renting)|book\s+now|book\s+today|book\s+with\s+us)\b/i,
    /\b(?:contact\s+(?:me|us|the\s+host)|call\s+(?:me|us|now)|whatsapp\s+(?:me|us)|dm\s+(?:me|us)\s+for)\b/i,
    /\b(?:daily\s+rate|nightly\s+rate|rates?\s*[:=-]\s*(?:ksh|kes|usd|\$)?\s*\d+|price\s*[:=-]\s*(?:ksh|kes|usd|\$)?\s*\d+|from\s+(?:ksh|kes|usd|\$)\s*\d+)\b/i,
    /\b(?:paybill|till\s*(?:no|number)?|lipa\s+na\s+mpesa)\b/i,
    /\b(?:welcome\s+to\s+our|experience\s+(?:luxury|comfort)|enjoy\s+(?:luxury|your\s+stay)|perfect\s+for\s+(?:families|holidays|your\s+stay))\b/i,
    /\b(?:fully\s+furnished|swimming\s+pool|free\s+wifi|free\s+wi-fi|secure\s+parking|air\s*condition(?:ed|ing))\b/i
  ];

  const hasHardAdSignal = HARD_AD_PATTERNS.some(pattern => pattern.test(text));

  // Seller/agent wording should disqualify the message even if it also contains
  // a generic phrase such as "looking for" or "available".
  const hasSellerIntent = /\b(?:i\s+am\s+advertising|advert(?:ise|ising|isement)|listing\s+available|property\s+listing|host\s+here|agent\s+here|landlord\s+here|we\s+are\s+located|check\s+out\s+this|limited\s+offer|special\s+offer|discount\s+available|vacancy\s+available)\b/i.test(text);

  // Positive signals must indicate that the author is seeking accommodation.
  const explicitInquiryPatterns = [
    /\b(?:i(?:'m| am)?\s+(?:looking\s+for|searching\s+for|in\s+need\s+of|seeking))\b/i,
    /\b(?:i\s+(?:need|want|require)\s+(?:an?\s+)?(?:airbnb|bnb|apartment|house|room|accommodation|place|unit|stay))\b/i,
    /\b(?:natafuta|ninatafuta|nahitaji|ninahitaji|naomba\s+(?:kupata|nyumba|chumba|malazi))\b/i,
    /\b(?:anyone\s+(?:know|has|have|with)|does\s+anyone\s+have|who\s+(?:has|knows|can\s+recommend)|can\s+anyone\s+recommend)\b/i,
    /\b(?:is\s+there\s+(?:an?\s+)?(?:airbnb|bnb|apartment|room|house|accommodation|place)|are\s+there\s+(?:any\s+)?(?:airbnbs?|apartments?|rooms?|houses?|units?))\b/i,
    /\b(?:need\s+(?:a|an|some)?\s*(?:place\s+to\s+stay|accommodation|room|house|apartment|airbnb|bnb))\b/i,
    /\b(?:looking\s+to\s+(?:book|rent|stay|get))\b/i,
    /\b(?:check[\s-]?in\s+(?:today|tonight|tomorrow)|for\s+\d+\s*(?:nights?|days?)|budget\s*(?:is|of|around)?\s*(?:ksh|kes)?\s*\d+k?)\b/i,
    /\b(?:kuna\s+(?:yeyote|mwenye|mtu|nyumba|chumba)|nani\s+(?:ako\s+na|ana|anayejua)|mko\s+na|uko\s+na|iko\s+available)\b/i
  ];
  const hasExplicitInquiry = explicitInquiryPatterns.some(pattern => pattern.test(text));

  // A short, telegraphic query can qualify only if it looks like a request
  // (question mark or a stay date/budget cue), not merely a property listing.
  const hasAccommodation = ACCOMMODATION_PATTERNS.some(pattern => pattern.test(text));
  const hasRequestCue =
    text.includes('?') ||
    /\b(?:tonight|today|tomorrow|weekend|next\s+week|check[\s-]?in|nights?|days?|budget|ksh|kes|urgent|urgently|available\?)\b/i.test(text);

  // Any strong advertising signal rejects the message unless the wording is
  // clearly a request from a guest AND does not contain seller-intent language.
  if (hasSellerIntent) return null;
  if (hasHardAdSignal && !hasExplicitInquiry) return null;

  const isDirectRequest = hasAccommodation && hasRequestCue && !hasHardAdSignal;
  if (!hasExplicitInquiry && !isDirectRequest) return null;

  const isShortStay = /\b(?:airbnb|bnb|short[\s-]?stay|holiday|vacation|staycation|nightly|per night|\d+\s*nights?|weekend stay)\b/i.test(text);
  const isFurnished = /\b(?:furnished|serviced)\b/i.test(text);

  let ruleName = 'House / Apartment inquiry';
  if (isShortStay) {
    ruleName = 'Short-stay / Airbnb guest enquiry';
  } else if (isFurnished) {
    ruleName = 'Furnished rental enquiry';
  }

  const areaNames = matchedAreas.map(area => area.name);
  const matchedKeywords = [
    ...areaNames,
    isShortStay ? 'Short-stay / Airbnb' : (isFurnished ? 'Furnished unit' : 'Residential rental'),
    hasExplicitInquiry ? 'Explicit guest inquiry' : 'Direct stay request'
  ];

  return {
    ruleName,
    priority: 'CRITICAL',
    matchedKeywords,
    matchedAreas: areaNames,
    categories: [ruleName],
    leadType: `Potential ${areaNames.join(' / ')} Client / Guest`
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
      if (m.type !== 'notify') return; // Ignore history/backfill events.
      if (!Array.isArray(m.messages) || m.messages.length === 0) return;

      for (const msg of m.messages) {
        try {
          if (!msg?.message || msg.key?.fromMe) continue;

          const remoteJid = msg.key?.remoteJid;
          const messageId = msg.key?.id;
          if (remoteJid && messageId) {
            const dedupeKey = `${remoteJid}:${messageId}`;
            if (processedMessageIds.has(dedupeKey)) continue;
            // Record after a lead matches, so non-lead messages don't fill the cache.
          }

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

          // Cross-group deduplication check:
          // If the same user or identical inquiry was already posted in another group recently,
          // suppress extra prompts so the user ONLY receives one prompt.
          const dedupeResult = leadDeduplicator.checkAndRecord(senderPhone, text, groupName);
          if (dedupeResult.isDuplicate) {
            console.log(`\n⏭️ [Deduplicator] Suppressed duplicate inquiry from ${senderName} (${senderPhone}) in group "${groupName}".`);
            console.log(`   (Original prompt was already sent from group "${dedupeResult.firstGroupName}" | duplicate #${dedupeResult.duplicateCount})\n`);
            continue; // SKIP extra prompt! Only ONE prompt is sent!
          }

          if (remoteJid && messageId) {
            const dedupeKey = `${remoteJid}:${messageId}`;
            if (processedMessageIds.has(dedupeKey)) continue;
            processedMessageIds.add(dedupeKey);
            if (processedMessageIds.size > MAX_PROCESSED_MESSAGE_IDS) {
              const oldestKey = processedMessageIds.values().next().value;
              processedMessageIds.delete(oldestKey);
            }
          }

          console.log(`\n🏠 GUEST ENQUIRY MATCHED in [${groupName}]!`);
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
          <p style="color: #8696a0; font-size: 13px;">Any matching Nyali / Bamburi property leads will be sent to WhatsApp number 0724345098.</p>
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
      ? 'Test alert sent to WhatsApp number 0724345098.'
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
