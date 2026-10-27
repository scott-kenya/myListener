import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Send, 
  Copy, 
  Check, 
  Clock, 
  Users, 
  Radio, 
  ShieldAlert,
  Code
} from 'lucide-react';
import { highlightKeywords } from '../utils/matcherEngine';

export default function AlertDetailModal({ alert, onClose, onToggleRead }) {
  const [copied, setCopied] = useState(false);

  if (!alert) return null;

  const copyJsonPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(alert, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-xl p-6 bg-[#0c1222] border-white/20 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className={`badge ${
              alert.priority === 'CRITICAL' ? 'badge-critical' :
              alert.priority === 'HIGH' ? 'badge-high' :
              alert.priority === 'MEDIUM' ? 'badge-medium' : 'badge-low'
            }`}>
              {alert.priority}
            </span>
            <h3 className="font-bold text-white text-lg">Alert Event Record</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-950/60 border border-white/5 text-xs">
          <div>
            <span className="text-slate-500 text-[10px] font-semibold uppercase block">WhatsApp Group</span>
            <span className="font-bold text-emerald-400 text-sm flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {alert.groupName}
            </span>
          </div>

          <div>
            <span className="text-slate-500 text-[10px] font-semibold uppercase block">Sender Identity</span>
            <span className="font-bold text-white text-sm">{alert.author}</span>
            {alert.authorPhone && <span className="text-slate-400 font-mono block text-[11px]">{alert.authorPhone}</span>}
          </div>

          <div>
            <span className="text-slate-500 text-[10px] font-semibold uppercase block">Triggered Rule</span>
            <span className="font-semibold text-slate-200">{alert.ruleName}</span>
          </div>

          <div>
            <span className="text-slate-500 text-[10px] font-semibold uppercase block">Ingested Time</span>
            <span className="font-mono text-slate-300">{alert.timestamp} ({alert.rawTime ? alert.rawTime.split('T')[1].slice(0, 8) : ''})</span>
          </div>
        </div>

        {/* Message Highlight Display */}
        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">Raw WhatsApp Message Text:</span>
          <div className="p-4 rounded-lg bg-slate-950 border border-white/10 text-sm sm:text-base text-slate-100 font-sans leading-relaxed">
            <span dangerouslySetInnerHTML={{ __html: highlightKeywords(alert.text, alert.matchedKeywords) }} />
          </div>
        </div>

        {/* Matched Keywords Tags */}
        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">Extracted Keywords:</span>
          <div className="flex flex-wrap gap-1.5">
            {alert.matchedKeywords.map((kw, idx) => (
              <span key={idx} className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30">
                #{kw}
              </span>
            ))}
          </div>
        </div>

        {/* JSON Payload Viewer */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <Code className="w-3.5 h-3.5 text-emerald-400" /> Event Webhook JSON Payload
            </span>
            <button 
              onClick={copyJsonPayload}
              className="text-[11px] text-slate-300 hover:text-emerald-400 flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied JSON' : 'Copy JSON'}
            </button>
          </div>

          <pre className="p-3.5 rounded-lg bg-slate-950 border border-white/10 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-48 leading-relaxed">
            {JSON.stringify(alert, null, 2)}
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
          <button 
            onClick={() => { onToggleRead(alert.id); onClose(); }} 
            className="btn btn-secondary text-xs"
          >
            {alert.status === 'UNREAD' ? 'Mark as Read' : 'Mark as Unread'}
          </button>

          <button onClick={onClose} className="btn btn-primary text-xs font-bold">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
