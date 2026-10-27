import React, { useState } from 'react';
import { 
  Radio, 
  ShieldAlert, 
  Sliders, 
  Users, 
  Search, 
  Filter, 
  CheckCircle2, 
  Star, 
  MessageSquare, 
  Send, 
  Sparkles, 
  Clock, 
  ChevronRight, 
  Trash2,
  QrCode,
  Smartphone,
  Info
} from 'lucide-react';
import { highlightKeywords } from '../utils/matcherEngine';

export default function Dashboard({ 
  alerts, 
  setAlerts, 
  rules, 
  groups, 
  setActiveTab,
  onOpenDetailModal,
  waStatus,
  connectedUser,
  onOpenQrModal
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('ALL');

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = 
      alert.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.matchedKeywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesPriority = priorityFilter === 'ALL' || alert.priority === priorityFilter;
    const matchesGroup = selectedGroupFilter === 'ALL' || alert.groupName === selectedGroupFilter;

    return matchesSearch && matchesPriority && matchesGroup;
  });

  const criticalCount = alerts.filter(a => a.priority === 'CRITICAL').length;
  const unreadCount = alerts.filter(a => a.status === 'UNREAD').length;

  const toggleReadStatus = (id) => {
    setAlerts(prev => prev.map(a => 
      a.id === id ? { ...a, status: a.status === 'UNREAD' ? 'READ' : 'UNREAD' } : a
    ));
  };

  const toggleFlagStatus = (id) => {
    setAlerts(prev => prev.map(a => 
      a.id === id ? { ...a, flagged: !a.flagged } : a
    ));
  };

  const clearAlerts = () => {
    if (window.confirm('Clear all alert logs from the live monitor stream?')) {
      setAlerts([]);
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'CRITICAL': return 'badge-critical';
      case 'HIGH': return 'badge-high';
      case 'MEDIUM': return 'badge-medium';
      default: return 'badge-low';
    }
  };

  return (
    <div className="space-y-6">
      {/* Real WhatsApp Link Banner (if not connected yet) */}
      {waStatus !== 'CONNECTED' && (
        <div className="glass-panel p-5 bg-gradient-to-r from-[#111b21] via-[#128c7e]/20 to-[#111b21] border-[#00a884]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#00a884]/20 border border-[#00a884]/40 flex items-center justify-center text-[#00a884]">
              <QrCode className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base sm:text-lg">
                Connect Your Real WhatsApp Account
              </h3>
              <p className="text-xs text-[#8696a0] mt-0.5">
                Scan QR code with your phone to listen live to your actual WhatsApp group chats.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenQrModal}
            className="btn btn-primary text-xs sm:text-sm font-bold flex items-center gap-2 self-stretch sm:self-auto shadow-lg shadow-[#00a884]/20"
          >
            <Smartphone className="w-4 h-4" /> Scan QR Code Now →
          </button>
        </div>
      )}

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Monitored Groups */}
        <div 
          onClick={() => setActiveTab('groups')}
          className="glass-panel glass-panel-hover p-4 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-[#8696a0] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">WhatsApp Groups</span>
            <Users className="w-5 h-5 text-[#00a884]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{groups.length}</span>
            <span className="text-xs text-[#00a884] flex items-center font-semibold">
              <span className="live-dot mr-1.5" /> Synced
            </span>
          </div>
        </div>

        {/* Prescribed Rules */}
        <div 
          onClick={() => setActiveTab('rules')}
          className="glass-panel glass-panel-hover p-4 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-[#8696a0] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Prescribed Rules</span>
            <Sliders className="w-5 h-5 text-teal-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{rules.filter(r => r.enabled).length}</span>
            <span className="text-xs text-[#8696a0] font-medium">of {rules.length} active</span>
          </div>
        </div>

        {/* Unread Alerts */}
        <div className="glass-panel p-4 flex flex-col justify-between border-[#00a884]/30 bg-[#00a884]/5">
          <div className="flex items-center justify-between text-[#8696a0] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Unread Hits</span>
            <Radio className="w-5 h-5 text-[#00a884] animate-pulse" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#06cf9c]">{unreadCount}</span>
            <span className="text-xs text-[#8696a0] font-medium">pending</span>
          </div>
        </div>

        {/* Critical Risk */}
        <div className="glass-panel p-4 flex flex-col justify-between border-rose-500/30 bg-rose-950/10">
          <div className="flex items-center justify-between text-[#8696a0] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Critical Risk</span>
            <ShieldAlert className="w-5 h-5 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-400">{criticalCount}</span>
            <span className="text-xs text-rose-300 font-medium">high priority</span>
          </div>
        </div>
      </div>

      {/* Main Stream Controls */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8696a0]" />
            <input
              type="text"
              placeholder="Search by keyword, author, or group..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10 pr-4 py-2 text-sm"
            />
          </div>

          {/* Group Filter Dropdown */}
          <select
            value={selectedGroupFilter}
            onChange={(e) => setSelectedGroupFilter(e.target.value)}
            className="form-select sm:w-56 py-2 text-sm"
          >
            <option value="ALL">All WhatsApp Groups</option>
            {groups.map(g => (
              <option key={g.id} value={g.name}>{g.name}</option>
            ))}
          </select>

          {/* Clear Action */}
          {alerts.length > 0 && (
            <button
              onClick={clearAlerts}
              className="btn btn-secondary text-xs py-2 text-[#8696a0] hover:text-rose-400"
              title="Clear all alerts"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear Feed</span>
            </button>
          )}
        </div>

        {/* Priority Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar">
          <span className="text-xs text-[#8696a0] font-semibold mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>

          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(p => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`
                px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap
                ${priorityFilter === p
                  ? 'bg-[#00a884] text-slate-950 shadow-md'
                  : 'bg-[#182229] text-[#8696a0] hover:text-white border border-[#202c33]'}
              `}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Live Stream List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="live-dot" /> Live WhatsApp Feed Stream ({filteredAlerts.length})
          </h3>

          <button 
            onClick={() => setActiveTab('simulator')}
            className="text-xs font-semibold text-[#00a884] hover:underline flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" /> Test Sandbox
          </button>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="glass-panel p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#182229] mx-auto flex items-center justify-center text-[#8696a0]">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-base">No Matched Alerts Found</h4>
            <p className="text-xs text-[#8696a0] max-w-sm mx-auto">
              No incoming WhatsApp group posts match your current search filters.
            </p>
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <div 
              key={alert.id}
              className={`
                glass-panel p-4 sm:p-5 transition-all duration-200 border-l-4 relative
                ${alert.priority === 'CRITICAL' ? 'border-l-rose-500' :
                  alert.priority === 'HIGH' ? 'border-l-amber-500' :
                  alert.priority === 'MEDIUM' ? 'border-l-cyan-500' : 'border-l-purple-500'}
                ${alert.status === 'UNREAD' ? 'bg-[#182229] shadow-lg' : 'opacity-90'}
              `}
            >
              {/* Card Top Row: Group Badge, Priority, Timestamp */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="badge badge-wa flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#00a884]" />
                    {alert.groupName}
                  </span>

                  <span className={`badge ${getPriorityBadgeClass(alert.priority)}`}>
                    {alert.priority}
                  </span>

                  {alert.sentiment && (
                    <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-[#0b141a] text-[#8696a0] border border-[#202c33]">
                      {alert.sentiment}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-[#8696a0]">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    {alert.timestamp}
                  </span>

                  <button
                    onClick={() => toggleFlagStatus(alert.id)}
                    className={`p-1 hover:text-amber-400 transition-colors ${alert.flagged ? 'text-amber-400' : 'text-slate-500'}`}
                    title={alert.flagged ? 'Unflag alert' : 'Flag alert'}
                  >
                    <Star className="w-4 h-4 fill-current" />
                  </button>
                </div>
              </div>

              {/* Author & Rule Info */}
              <div className="mb-2">
                <div className="text-xs text-[#8696a0] flex items-center gap-2">
                  <span className="font-bold text-white">{alert.author}</span>
                  {alert.authorPhone && <span className="text-[#8696a0] font-mono">({alert.authorPhone})</span>}
                </div>
                <div className="text-[11px] text-[#00a884] font-mono mt-0.5">
                  Rule Trigger: <span className="underline font-semibold">{alert.ruleName}</span>
                </div>
              </div>

              {/* Message Body with Keyword Highlight */}
              <div className="p-3.5 rounded-xl bg-[#0b141a] border border-[#202c33] my-3 text-sm sm:text-base text-slate-100 leading-relaxed font-sans">
                <span dangerouslySetInnerHTML={{ __html: highlightKeywords(alert.text, alert.matchedKeywords) }} />
              </div>

              {/* Bottom Row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-[#202c33]">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-[#8696a0] font-semibold">Matched Keywords:</span>
                  {alert.matchedKeywords.map((kw, idx) => (
                    <span key={idx} className="px-2.5 py-0.5 rounded bg-[#00a884]/20 text-[#06cf9c] text-xs font-mono font-bold border border-[#00a884]/30">
                      #{kw}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => toggleReadStatus(alert.id)}
                    className={`btn btn-sm ${alert.status === 'UNREAD' ? 'btn-secondary text-[#00a884] border-[#00a884]/40' : 'btn-secondary text-[#8696a0]'}`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {alert.status === 'UNREAD' ? 'Mark Read' : 'Read'}
                  </button>

                  <button
                    onClick={() => onOpenDetailModal(alert)}
                    className="btn btn-secondary btn-sm text-white"
                  >
                    Inspect <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
