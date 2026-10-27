import React, { useState } from 'react';
import { 
  MessageSquareCode, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  ShieldAlert, 
  Radio, 
  Zap,
  Info
} from 'lucide-react';
import { evaluateMessageAgainstRules, highlightKeywords } from '../utils/matcherEngine';
import { playAlertSound } from '../utils/audioAlerts';

export default function LiveSimulator({ groups, rules, alerts, setAlerts, setActiveTab }) {
  const [selectedGroup, setSelectedGroup] = useState(groups[0]?.name || 'Nyali & Bamburi Real Estate Deals');
  const [senderName, setSenderName] = useState('John Kariuki');
  const [senderPhone, setSenderPhone] = useState('+254 712 345678');
  const [messageText, setMessageText] = useState('');
  const [lastEvaluation, setLastEvaluation] = useState(null);

  // Nyali & Bamburi Lead Test Presets
  const presets = [
    {
      label: '🏡 Test: "looking for house in nyali"',
      text: 'Good morning guys, I am looking for house in nyali 3 bedroom with parking space.',
      group: 'Nyali & Bamburi Real Estate Deals'
    },
    {
      label: '🏡 Test: "looking for house in bamburi"',
      text: 'Hello team, looking for house in bamburi 2 bedroom near main road. Budget 30k.',
      group: 'Nyali & Bamburi Real Estate Deals'
    },
    {
      label: '🏨 Test: "urgently looking for bnb in nyali"',
      text: 'Hi everyone, I am urgently looking for bnb in nyali for 2 nights starting tonight!',
      group: 'Mombasa BNB & Vacation Stays'
    },
    {
      label: '🏨 Test: "urgently looking for bnb in bamburi"',
      text: 'Help needed! Urgently looking for bnb in bamburi for a family arriving this evening.',
      group: 'Mombasa BNB & Vacation Stays'
    },
    {
      label: '⏱️ Test: "who is available now in nyali"',
      text: 'Quick check: who is available now in nyali? Need a 1 bedroom studio for immediate checkin.',
      group: 'Mombasa BNB & Vacation Stays'
    },
    {
      label: '⏱️ Test: "who is available now bamburi"',
      text: 'Please confirm: who is available now bamburi? Need a stay for weekend guest.',
      group: 'Coast Property Agents & Hosts'
    }
  ];

  const handleApplyPreset = (preset) => {
    setMessageText(preset.text);
    if (preset.group) setSelectedGroup(preset.group);
  };

  const handleDispatchMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    // Evaluate message against active rules
    const result = evaluateMessageAgainstRules(messageText, rules, selectedGroup);

    setLastEvaluation({
      text: messageText,
      group: selectedGroup,
      sender: senderName,
      time: new Date().toLocaleTimeString(),
      ...result
    });

    if (result.isMatch) {
      playAlertSound(result.highestPriority);

      const newAlert = {
        id: 'alt-' + Date.now(),
        groupName: selectedGroup,
        author: senderName,
        authorPhone: senderPhone,
        timestamp: 'Just now',
        rawTime: new Date().toISOString(),
        text: messageText,
        matchedKeywords: result.matchedKeywords,
        ruleName: result.matchedRules.map(r => r.name).join(', '),
        priority: result.highestPriority,
        sentiment: result.sentiment,
        status: 'UNREAD',
        flagged: result.highestPriority === 'CRITICAL'
      };

      setAlerts(prev => [newAlert, ...prev]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass-panel p-5 bg-[#182229] border-[#00a884]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
            <MessageSquareCode className="w-5 h-5 text-[#00a884]" /> Nyali & Bamburi Lead Sandbox Simulator
          </h3>
          <p className="text-xs text-[#8696a0] mt-1 max-w-xl">
            Test sending sample client messages to verify how prescribed property & BNB lead rules trigger audio and visual alerts.
          </p>
        </div>

        <button 
          onClick={() => setActiveTab('dashboard')}
          className="btn btn-secondary text-xs font-bold flex items-center gap-1.5 self-stretch sm:self-auto"
        >
          View Live Stream Feed →
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-5 space-y-4">
          <h4 className="font-bold text-white text-base flex items-center gap-2 border-b border-[#202c33] pb-3">
            <Zap className="w-4 h-4 text-amber-400" /> Dispatch Test Message
          </h4>

          {/* Quick Presets */}
          <div>
            <span className="text-xs font-bold text-[#8696a0] block mb-2">Test Nyali & Bamburi Presets:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyPreset(p)}
                  className="px-3 py-2 rounded-xl bg-[#0b141a] hover:bg-[#182229] border border-[#202c33] hover:border-[#00a884]/40 text-left text-xs font-semibold text-white transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleDispatchMessage} className="space-y-4 pt-2">
            <div className="input-group">
              <label className="input-label">Target WhatsApp Group</label>
              <select 
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="form-select font-bold text-white"
              >
                {groups.map(g => (
                  <option key={g.id} value={g.name}>{g.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="input-group">
                <label className="input-label">Sender Name</label>
                <input 
                  type="text" 
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Sender Phone</label>
                <input 
                  type="text" 
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  className="form-input font-mono"
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Message Text</label>
              <textarea 
                rows="4"
                placeholder="Type or paste sample WhatsApp message to test..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="form-textarea font-sans text-sm font-medium"
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#00a884]/20"
            >
              <Send className="w-4 h-4" /> Evaluate & Dispatch Message to Stream
            </button>
          </form>
        </div>

        {/* Right Column: Output (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-white text-base flex items-center gap-2 border-b border-[#202c33] pb-3">
              <Radio className="w-4 h-4 text-[#00a884] animate-pulse" /> Live Rule Engine Result
            </h4>

            {!lastEvaluation ? (
              <div className="py-12 text-center text-[#8696a0] space-y-2">
                <Info className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs">No simulation executed yet.</p>
                <p className="text-[11px] text-slate-500">Select a preset on the left and click Dispatch to evaluate.</p>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {/* Result Banner */}
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                  lastEvaluation.isMatch 
                    ? lastEvaluation.highestPriority === 'CRITICAL' ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                    : 'bg-emerald-950/40 border-[#00a884]/40 text-[#06cf9c]'
                    : 'bg-[#0b141a] border-[#202c33] text-[#8696a0]'
                }`}>
                  {lastEvaluation.isMatch ? (
                    <ShieldAlert className="w-6 h-6 flex-shrink-0 text-[#00a884] animate-bounce" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-slate-400" />
                  )}

                  <div>
                    <h5 className="font-extrabold text-sm">
                      {lastEvaluation.isMatch ? `LEAD MATCHED: ${lastEvaluation.highestPriority} Priority` : 'Message Passed (No Keyword Match)'}
                    </h5>
                    <p className="text-xs opacity-90 mt-0.5">
                      {lastEvaluation.isMatch 
                        ? `Matched ${lastEvaluation.matchedRules.length} prescribed rule(s) and audio chime played.` 
                        : 'No active prescribed phrases detected in message.'}
                    </p>
                  </div>
                </div>

                {/* Text Highlight Preview */}
                <div className="p-3.5 rounded-xl bg-[#0b141a] border border-[#202c33] space-y-2">
                  <div className="text-[11px] text-[#8696a0] flex items-center justify-between">
                    <span>Target: <strong className="text-white">{lastEvaluation.group}</strong></span>
                    <span>{lastEvaluation.time}</span>
                  </div>
                  <div className="text-sm font-sans text-slate-100 leading-relaxed">
                    <span dangerouslySetInnerHTML={{ __html: highlightKeywords(lastEvaluation.text, lastEvaluation.matchedKeywords) }} />
                  </div>
                </div>

                {/* Matched Rules */}
                {lastEvaluation.isMatch && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-[#8696a0] block">Matched Rules:</span>
                    {lastEvaluation.matchedRules.map((r, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-[#182229] border border-[#202c33] flex items-center justify-between text-xs">
                        <span className="font-extrabold text-white">{r.name}</span>
                        <span className="text-[10px] font-mono font-bold text-[#06cf9c] uppercase bg-[#00a884]/20 px-2 py-0.5 rounded border border-[#00a884]/30">
                          {r.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
