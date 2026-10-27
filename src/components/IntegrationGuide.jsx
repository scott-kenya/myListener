import React from 'react';
import { 
  BookOpen, 
  Code, 
  Terminal, 
  ShieldCheck, 
  Cpu, 
  Layers, 
  Copy, 
  Check, 
  ExternalLink,
  Smartphone
} from 'lucide-react';

export default function IntegrationGuide() {
  const [copiedIndex, setCopiedIndex] = React.useState(null);

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const baileysSnippet = `// Production WhatsApp Group Listener Bridge (Node.js + @whiskeysockets/baileys)
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const axios = require('axios');

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on('creds.update', saveCreds);

    // Listen to incoming messages in all joined groups
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const isGroup = msg.key.remoteJid.endsWith('@g.us');
        if (!isGroup) return; // Only process group messages

        const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
        const groupName = groupMetadata.subject;
        const sender = msg.pushName || msg.key.participant;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

        console.log(\`[WhatsApp Group: \${groupName}] \${sender}: \${text}\`);

        // Send payload to GroupPulse AI Ingestion Gateway
        await axios.post('http://localhost:3000/api/ingest', {
            groupName,
            sender,
            senderPhone: msg.key.participant,
            text,
            timestamp: new Date().toISOString()
        });
    });
}

connectToWhatsApp();`;

  const webhookSnippet = `# Python FastAPI Backend Webhook Handler for WhatsApp Keyword Listener
from fastapi import FastAPI, Request
import requests

app = FastAPI()

PRESCRIBED_KEYWORDS = ["pricing", "quote", "security leak", "hacked", "hiring"]

@app.post("/webhook/whatsapp")
async def whatsapp_webhook(request: Request):
    data = await request.json()
    entry = data.get('entry', [])[0]
    changes = entry.get('changes', [])[0]['value']
    
    if 'messages' in changes:
        message = changes['messages'][0]
        text = message.get('text', {}).get('body', '')
        sender = message.get('from')
        
        # Keyword evaluation logic
        matched = [kw for kw in PRESCRIBED_KEYWORDS if kw.lower() in text.lower()]
        
        if matched:
            print(f"🚨 ALERT MATCHED! Keywords: {matched} in message: {text}")
            # Dispatch alert to Slack / Telegram / Webhook
            
    return {"status": "success"}`;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass-panel p-5">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-400" /> WhatsApp Real-World API & Gateway Integration Guide
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Learn how to deploy a production-grade WhatsApp group listening engine using open-source session bridges or Meta's official WhatsApp Business Platform API.
        </p>
      </div>

      {/* Deployment Architecture Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Method 1: Baileys Node.js Bridge */}
        <div className="glass-panel p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                NODE
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Method A: Baileys WhatsApp Session Bridge</h4>
                <p className="text-xs text-slate-400">Best for monitoring personal or team WhatsApp groups via QR code authentication.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Baileys creates a lightweight Node.js WebSocket socket that acts as a paired WhatsApp Web device. It decrypts E2EE messages in real-time and streams group events to your listener backend.
            </p>

            <div className="relative">
              <button 
                onClick={() => copyToClipboard(baileysSnippet, 1)}
                className="absolute top-2 right-2 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 z-10"
              >
                {copiedIndex === 1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedIndex === 1 ? 'Copied' : 'Copy'}
              </button>
              <pre className="p-4 rounded-lg bg-slate-950 border border-white/10 font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-72 leading-relaxed">
                {baileysSnippet}
              </pre>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300">
            <strong>Key Benefit:</strong> Works with any standard WhatsApp group where your paired phone account is a member.
          </div>
        </div>

        {/* Method 2: Meta Official WhatsApp Business API */}
        <div className="glass-panel p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-sky-950 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-xs">
                META
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Method B: Meta WhatsApp Business Cloud API</h4>
                <p className="text-xs text-slate-400">Best for official customer communities, enterprise webhooks, & verified business accounts.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Configure Webhook endpoints in the Meta Developer Portal (`https://developers.facebook.com`). Meta sends HTTP POST JSON payloads whenever messages arrive.
            </p>

            <div className="relative">
              <button 
                onClick={() => copyToClipboard(webhookSnippet, 2)}
                className="absolute top-2 right-2 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 z-10"
              >
                {copiedIndex === 2 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedIndex === 2 ? 'Copied' : 'Copy'}
              </button>
              <pre className="p-4 rounded-lg bg-slate-950 border border-white/10 font-mono text-[11px] text-sky-300 overflow-x-auto max-h-72 leading-relaxed">
                {webhookSnippet}
              </pre>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-sky-950/20 border border-sky-500/20 text-xs text-sky-300">
            <strong>Key Benefit:</strong> Official Meta enterprise support, 99.99% uptime SLA, and native scalable webhooks.
          </div>
        </div>
      </div>

      {/* Compliance & Privacy Section */}
      <div className="glass-panel p-5 space-y-3">
        <h4 className="font-bold text-white text-base flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" /> Privacy, E2EE Security, & Group Compliance
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-slate-950/60 border border-white/5 space-y-1">
            <h5 className="font-bold text-white">1. Group Member Consent</h5>
            <p className="text-slate-400 leading-relaxed">
              Ensure group descriptions or welcome notices inform members that prescribed keyword monitoring for customer support or security is active.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/60 border border-white/5 space-y-1">
            <h5 className="font-bold text-white">2. Local Pattern Filtering</h5>
            <p className="text-slate-400 leading-relaxed">
              Run keyword evaluation on-device or within your private VPC so non-matching general chat messages are immediately discarded without persistent storage.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/60 border border-white/5 space-y-1">
            <h5 className="font-bold text-white">3. Rate Limiting & Backoff</h5>
            <p className="text-slate-400 leading-relaxed">
              Implement anti-spam queues on your dispatch webhooks to prevent alert flooding during high-volume viral group conversations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
