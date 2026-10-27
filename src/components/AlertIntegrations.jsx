import React, { useState } from 'react';
import { 
  Webhook, 
  Send, 
  CheckCircle2, 
  Copy, 
  Code, 
  Lock, 
  MessageCircle, 
  Mail, 
  Smartphone, 
  Sliders,
  X
} from 'lucide-react';

export default function AlertIntegrations({ integrations, setIntegrations }) {
  const [testPayloadModal, setTestPayloadModal] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const toggleIntegration = (key) => {
    setIntegrations(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        enabled: !prev[key].enabled
      }
    }));
  };

  const handleTestWebhook = (destinationName) => {
    const samplePayload = {
      event: 'whatsapp.keyword.alert',
      timestamp: new Date().toISOString(),
      rule: {
        id: 'rule-1',
        name: 'Urgent Pricing & Quote Request',
        priority: 'HIGH'
      },
      whatsapp: {
        groupName: 'Tech Founders & CEOs Hub',
        author: 'Elena Rostova (CTO @ CloudScale)',
        authorPhone: '+1 (555) 019-2834',
        message: 'Looking for a cloud migration tool. Can someone send pricing or a custom quote?'
      },
      matchedKeywords: ['pricing', 'quote'],
      sentiment: 'URGENT'
    };

    setTestResult({
      destination: destinationName,
      status: 200,
      responseTime: '84ms',
      payload: samplePayload
    });

    setTestPayloadModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass-panel p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Webhook className="w-5 h-5 text-emerald-400" /> Alert Destinations & Webhook Dispatchers
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Automatically relay matched WhatsApp keyword alerts to Slack, Telegram, Email, Twilio SMS, or your custom REST HTTP API endpoint.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Destination 1: Slack Integration */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-center text-emerald-400 font-bold">
                #
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Slack Incoming Webhook</h4>
                <p className="text-xs text-slate-400">Post instant rich message cards into Slack channels.</p>
              </div>
            </div>

            <label className="switch">
              <input 
                type="checkbox" 
                checked={integrations.slack.enabled} 
                onChange={() => toggleIntegration('slack')}
              />
              <span className="slider" />
            </label>
          </div>

          <div className="space-y-3 pt-2">
            <div className="input-group">
              <label className="input-label">Webhook URL</label>
              <input 
                type="text" 
                value={integrations.slack.webhookUrl}
                onChange={(e) => setIntegrations(prev => ({ ...prev, slack: { ...prev.slack, webhookUrl: e.target.value } }))}
                className="form-input font-mono text-xs"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Target Channel</label>
              <input 
                type="text" 
                value={integrations.slack.channel}
                onChange={(e) => setIntegrations(prev => ({ ...prev, slack: { ...prev.slack, channel: e.target.value } }))}
                className="form-input font-mono text-xs"
              />
            </div>

            <button 
              onClick={() => handleTestWebhook('Slack Channel (#whatsapp-alerts-live)')}
              className="btn btn-secondary text-xs w-full flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Dispatch Test Slack Alert
            </button>
          </div>
        </div>

        {/* Destination 2: Telegram Bot */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-950/60 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Telegram Bot Dispatcher</h4>
                <p className="text-xs text-slate-400">Push instant Telegram bot messages to group chats.</p>
              </div>
            </div>

            <label className="switch">
              <input 
                type="checkbox" 
                checked={integrations.telegram.enabled} 
                onChange={() => toggleIntegration('telegram')}
              />
              <span className="slider" />
            </label>
          </div>

          <div className="space-y-3 pt-2">
            <div className="input-group">
              <label className="input-label">Bot Token</label>
              <input 
                type="password" 
                value={integrations.telegram.botToken}
                onChange={(e) => setIntegrations(prev => ({ ...prev, telegram: { ...prev.telegram, botToken: e.target.value } }))}
                className="form-input font-mono text-xs"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Chat ID / Group ID</label>
              <input 
                type="text" 
                value={integrations.telegram.chatId}
                onChange={(e) => setIntegrations(prev => ({ ...prev, telegram: { ...prev.telegram, chatId: e.target.value } }))}
                className="form-input font-mono text-xs"
              />
            </div>

            <button 
              onClick={() => handleTestWebhook('Telegram Bot Group')}
              className="btn btn-secondary text-xs w-full flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Dispatch Test Telegram Alert
            </button>
          </div>
        </div>

        {/* Destination 3: Custom REST Webhook */}
        <div className="glass-panel p-5 space-y-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                <Code className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Custom Backend REST Webhook (JSON POST)</h4>
                <p className="text-xs text-slate-400">Stream HTTP POST payloads directly to your company API server with HMAC signatures.</p>
              </div>
            </div>

            <label className="switch">
              <input 
                type="checkbox" 
                checked={integrations.customWebhook.enabled} 
                onChange={() => toggleIntegration('customWebhook')}
              />
              <span className="slider" />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="input-group">
              <label className="input-label">Endpoint URL</label>
              <input 
                type="text" 
                value={integrations.customWebhook.endpointUrl}
                onChange={(e) => setIntegrations(prev => ({ ...prev, customWebhook: { ...prev.customWebhook, endpointUrl: e.target.value } }))}
                className="form-input font-mono text-xs"
              />
            </div>

            <div className="input-group">
              <label className="input-label">HMAC Signing Secret</label>
              <input 
                type="password" 
                value={integrations.customWebhook.secretKey}
                onChange={(e) => setIntegrations(prev => ({ ...prev, customWebhook: { ...prev.customWebhook, secretKey: e.target.value } }))}
                className="form-input font-mono text-xs"
              />
            </div>
          </div>

          <button 
            onClick={() => handleTestWebhook('Custom REST Webhook')}
            className="btn btn-primary text-xs w-full font-bold flex items-center justify-center gap-1.5"
          >
            <Send className="w-4 h-4" /> Dispatch Test HTTP JSON Webhook Payload
          </button>
        </div>
      </div>

      {/* Test Payload JSON Modal */}
      {testPayloadModal && testResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-xl p-6 bg-[#0c1222] border-white/20 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Webhook Test Dispatched Successfully
              </h3>
              <button onClick={() => setTestPayloadModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
              <span>Destination: <strong>{testResult.destination}</strong></span>
              <span className="font-mono font-bold">Status: {testResult.status} OK ({testResult.responseTime})</span>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 block">HTTP Request JSON Body:</span>
              <pre className="p-4 rounded-lg bg-slate-950 border border-white/10 font-mono text-xs text-emerald-300 overflow-x-auto max-h-60 leading-relaxed">
                {JSON.stringify(testResult.payload, null, 2)}
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <button onClick={() => setTestPayloadModal(false)} className="btn btn-secondary text-xs">
                Close Modal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
