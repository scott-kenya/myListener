import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import KeywordRules from './components/KeywordRules';
import GroupsManager from './components/GroupsManager';
import LiveSimulator from './components/LiveSimulator';
import Analytics from './components/Analytics';
import AlertIntegrations from './components/AlertIntegrations';
import IntegrationGuide from './components/IntegrationGuide';
import AlertDetailModal from './components/AlertDetailModal';
import QRCodeModal from './components/QRCodeModal';

import { 
  INITIAL_GROUPS, 
  INITIAL_RULES, 
  INITIAL_ALERTS, 
  INITIAL_INTEGRATIONS 
} from './data/initialData';
import { getMutedState, playAlertSound } from './utils/audioAlerts';
import { evaluateMessageAgainstRules } from './utils/matcherEngine';

const getBackendHost = () => {
  if (import.meta.env.VITE_BACKEND_URL) return import.meta.env.VITE_BACKEND_URL;
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  return `${window.location.protocol}//${window.location.hostname}`;
};

const getWebSocketUrl = () => {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'ws://localhost:3002';
  }
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProtocol}//${window.location.hostname}`;
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(getMutedState());

  const [waStatus, setWaStatus] = useState('DISCONNECTED');
  const [waQrDataUrl, setWaQrDataUrl] = useState(null);
  const [connectedUser, setConnectedUser] = useState(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // State Management (Preloaded with NyalileadsBot credentials)
  const [rules, setRules] = useState(() => {
    const saved = localStorage.getItem('omni_rules_v4');
    return saved ? JSON.parse(saved) : INITIAL_RULES;
  });

  const [groups, setGroups] = useState(() => {
    const saved = localStorage.getItem('omni_groups_v4');
    return saved ? JSON.parse(saved) : INITIAL_GROUPS;
  });

  const [alerts, setAlerts] = useState(() => {
    const saved = localStorage.getItem('omni_alerts_v4');
    return saved ? JSON.parse(saved) : INITIAL_ALERTS;
  });

  const [integrations, setIntegrations] = useState(() => {
    const saved = localStorage.getItem('omni_integrations_v4');
    return saved ? JSON.parse(saved) : INITIAL_INTEGRATIONS;
  });

  const [selectedAlertDetail, setSelectedAlertDetail] = useState(null);

  useEffect(() => {
    localStorage.setItem('omni_rules_v4', JSON.stringify(rules));
  }, [rules]);

  useEffect(() => {
    localStorage.setItem('omni_groups_v4', JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem('omni_alerts_v4', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem('omni_integrations_v4', JSON.stringify(integrations));
  }, [integrations]);

  useEffect(() => {
    let ws = null;
    let reconnectTimer = null;

    const connectWebSocket = () => {
      try {
        const wsUrl = getWebSocketUrl();
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('Connected to WhatsApp Backend WebSocket:', wsUrl);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'STATUS') {
              setWaStatus(data.status);
              setWaQrDataUrl(data.qrDataUrl);
              setConnectedUser(data.connectedUser);

              if (data.groups && data.groups.length > 0) {
                setGroups(data.groups);
              }
            }

            if (data.type === 'REAL_MESSAGE') {
              const realMsg = data.message;
              
              // Evaluate against local custom rules if configured, or use backend matched lead signals
              const localResult = evaluateMessageAgainstRules(realMsg.text, rules, realMsg.groupName);
              const isMatch = localResult.isMatch || Boolean(realMsg.ruleName);

              if (isMatch) {
                const priority = (localResult.isMatch && localResult.highestPriority) 
                  ? localResult.highestPriority 
                  : (realMsg.priority || 'CRITICAL');
                const matchedKeywords = (localResult.isMatch && localResult.matchedKeywords?.length)
                  ? localResult.matchedKeywords
                  : (realMsg.matchedKeywords || ['Nyali / Bamburi Inquiry']);
                const ruleName = (localResult.isMatch && localResult.matchedRules?.length)
                  ? localResult.matchedRules.map(r => r.name).join(', ')
                  : (realMsg.ruleName || 'Short-stay / Property Enquiry');
                const sentiment = localResult.sentiment || 'POSITIVE';

                const alertId = realMsg.id || ('alt-' + Date.now());

                // Prevent duplicate alerts in state
                setAlerts(prev => {
                  const alreadyExists = prev.some(a => 
                    a.id === alertId || 
                    (a.text === realMsg.text && a.authorPhone === realMsg.authorPhone && Math.abs(new Date(a.rawTime || 0) - new Date()) < 3600000)
                  );
                  if (alreadyExists) return prev;

                  // Play audio alert only for the first occurrence
                  playAlertSound(priority);

                  if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification(`[${priority}] WhatsApp Lead: ${realMsg.groupName}`, {
                      body: `${realMsg.author}: ${realMsg.text}`
                    });
                  }

                  // Telegram Bot Push Dispatch
                  if (integrations.telegram && integrations.telegram.enabled && integrations.telegram.botToken) {
                    try {
                      const telegramText = encodeURIComponent(
                        `🚨 *LEAD MATCHED: ${priority}*\n` +
                        `📍 *Group:* ${realMsg.groupName}\n` +
                        `👤 *Sender:* ${realMsg.author} (${realMsg.authorPhone})\n` +
                        `💬 *Text:* "${realMsg.text}"\n` +
                        `🏷️ *Matched Phrases:* ${matchedKeywords.join(', ')}`
                      );
                      fetch(`https://api.telegram.org/bot${integrations.telegram.botToken}/sendMessage?chat_id=${integrations.telegram.chatId}&text=${telegramText}&parse_mode=Markdown`);
                    } catch (e) {
                      console.error('Telegram dispatch error:', e);
                    }
                  }

                  const newAlert = {
                    id: alertId,
                    groupName: realMsg.groupName,
                    author: realMsg.author,
                    authorPhone: realMsg.authorPhone,
                    timestamp: realMsg.timestamp,
                    rawTime: realMsg.rawTime || new Date().toISOString(),
                    text: realMsg.text,
                    matchedKeywords,
                    ruleName,
                    priority,
                    sentiment,
                    status: 'UNREAD',
                    flagged: priority === 'CRITICAL'
                  };

                  return [newAlert, ...prev];
                });
              }
            }
          } catch (err) {
            console.error('Error handling WebSocket message:', err);
          }
        };

        ws.onclose = () => {
          reconnectTimer = setTimeout(connectWebSocket, 3000);
        };
      } catch (err) {
        reconnectTimer = setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    const httpHost = getBackendHost();
    fetch(`${httpHost}/api/status`)
      .then(res => res.json())
      .then(data => {
        setWaStatus(data.status);
        setWaQrDataUrl(data.qrDataUrl);
        setConnectedUser(data.connectedUser);
        if (data.groups && data.groups.length > 0) {
          setGroups(data.groups);
        }
      })
      .catch(() => {});

    return () => {
      if (ws) ws.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [rules, integrations]);

  const startWhatsAppConnect = async () => {
    try {
      setIsQrModalOpen(true);
      const httpHost = getBackendHost();
      await fetch(`${httpHost}/api/connect`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to trigger WhatsApp connection:', err);
    }
  };

  const disconnectWhatsApp = async () => {
    try {
      const httpHost = getBackendHost();
      await fetch(`${httpHost}/api/disconnect`, { method: 'POST' });
      setWaStatus('DISCONNECTED');
      setWaQrDataUrl(null);
      setConnectedUser(null);
      setIsQrModalOpen(false);
    } catch (err) {
      console.error('Failed to disconnect WhatsApp:', err);
    }
  };

  const unreadAlertsCount = alerts.filter(a => a.status === 'UNREAD').length;

  const toggleAlertRead = (id) => {
    setAlerts(prev => prev.map(a => 
      a.id === id ? { ...a, status: a.status === 'UNREAD' ? 'READ' : 'UNREAD' } : a
    ));
  };

  return (
    <div className="app-container">
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        unreadCount={unreadAlertsCount}
        waStatus={waStatus}
        connectedUser={connectedUser}
        onOpenQrModal={startWhatsAppConnect}
      />

      <div className="main-content">
        <Header 
          setMobileOpen={setMobileOpen}
          activeTab={activeTab}
          rulesCount={rules.filter(r => r.enabled).length}
          groupsCount={groups.length}
          isAudioMuted={isAudioMuted}
          setIsAudioMuted={setIsAudioMuted}
          setActiveTab={setActiveTab}
          waStatus={waStatus}
          connectedUser={connectedUser}
          onOpenQrModal={startWhatsAppConnect}
        />

        <main className="page-body">
          {activeTab === 'dashboard' && (
            <Dashboard 
              alerts={alerts}
              setAlerts={setAlerts}
              rules={rules}
              groups={groups}
              setActiveTab={setActiveTab}
              onOpenDetailModal={(alert) => setSelectedAlertDetail(alert)}
              waStatus={waStatus}
              connectedUser={connectedUser}
              onOpenQrModal={startWhatsAppConnect}
            />
          )}

          {activeTab === 'rules' && (
            <KeywordRules 
              rules={rules}
              setRules={setRules}
              groups={groups}
            />
          )}

          {activeTab === 'groups' && (
            <GroupsManager 
              groups={groups}
              setGroups={setGroups}
              waStatus={waStatus}
              connectedUser={connectedUser}
              onOpenQrModal={startWhatsAppConnect}
              onDisconnect={disconnectWhatsApp}
            />
          )}

          {activeTab === 'simulator' && (
            <LiveSimulator 
              groups={groups}
              rules={rules}
              alerts={alerts}
              setAlerts={setAlerts}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'analytics' && (
            <Analytics 
              alerts={alerts}
              rules={rules}
              groups={groups}
            />
          )}

          {activeTab === 'integrations' && (
            <AlertIntegrations 
              integrations={integrations}
              setIntegrations={setIntegrations}
            />
          )}

          {activeTab === 'guide' && (
            <IntegrationGuide />
          )}
        </main>
      </div>

      {isQrModalOpen && (
        <QRCodeModal 
          waStatus={waStatus}
          qrDataUrl={waQrDataUrl}
          connectedUser={connectedUser}
          onClose={() => setIsQrModalOpen(false)}
          onDisconnect={disconnectWhatsApp}
        />
      )}

      {selectedAlertDetail && (
        <AlertDetailModal 
          alert={selectedAlertDetail}
          onClose={() => setSelectedAlertDetail(null)}
          onToggleRead={toggleAlertRead}
        />
      )}
    </div>
  );
}
