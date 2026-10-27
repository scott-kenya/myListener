import React, { useState } from 'react';
import { 
  Plus, 
  Sliders, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  AlertTriangle, 
  Sparkles,
  Zap,
  Home,
  CheckCircle2
} from 'lucide-react';

export default function KeywordRules({ rules, setRules, groups }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [matchType, setMatchType] = useState('ANY_KEYWORD');
  const [priority, setPriority] = useState('HIGH');
  const [description, setDescription] = useState('');

  // Quick Preset Lead Phrases covering English and Swahili inquiries
  const presetLeadPhrases = [
    { label: '🏨 "airbnb in nyali"', phrase: 'airbnb in nyali', name: 'Nyali Airbnb Lead', priority: 'CRITICAL' },
    { label: '🏨 "airbnb in bamburi"', phrase: 'airbnb in bamburi', name: 'Bamburi Airbnb Lead', priority: 'CRITICAL' },
    { label: '🇰🇪 "natafuta airbnb nyali"', phrase: 'natafuta airbnb nyali', name: 'Swahili Nyali Airbnb', priority: 'CRITICAL' },
    { label: '🇰🇪 "natafuta airbnb bamburi"', phrase: 'natafuta airbnb bamburi', name: 'Swahili Bamburi Airbnb', priority: 'CRITICAL' },
    { label: '🇰🇪 "kuna airbnb nyali"', phrase: 'kuna airbnb nyali', name: 'Nyali BnB Inquiry (Swahili)', priority: 'HIGH' },
    { label: '🇰🇪 "kuna airbnb bamburi"', phrase: 'kuna airbnb bamburi', name: 'Bamburi BnB Inquiry (Swahili)', priority: 'HIGH' },
    { label: '🏡 "looking for house in nyali"', phrase: 'looking for house in nyali', name: 'Nyali House Lead', priority: 'HIGH' },
    { label: '🏡 "looking for house in bamburi"', phrase: 'looking for house in bamburi', name: 'Bamburi House Lead', priority: 'HIGH' },
    { label: '🛋️ "furnished apartment in nyali"', phrase: 'furnished apartment in nyali', name: 'Nyali Furnished Unit', priority: 'HIGH' },
    { label: '🛋️ "furnished apartment in bamburi"', phrase: 'furnished apartment in bamburi', name: 'Bamburi Furnished Unit', priority: 'HIGH' },
    { label: '⏱️ "who is available now in nyali"', phrase: 'who is available now in nyali', name: 'Nyali Host Availability', priority: 'HIGH' },
    { label: '⏱️ "who is available now bamburi"', phrase: 'who is available now bamburi', name: 'Bamburi Host Availability', priority: 'HIGH' },
  ];

  const handleAddQuickPreset = (preset) => {
    // Check if phrase already exists
    const exists = rules.some(r => r.keywords.some(k => k.toLowerCase() === preset.phrase.toLowerCase()));
    if (exists) {
      alert(`The keyword phrase "${preset.phrase}" is already prescribed in your rules!`);
      return;
    }

    const newRule = {
      id: 'rule-' + Date.now(),
      name: preset.name,
      keywords: [preset.phrase],
      matchType: 'ANY_KEYWORD',
      priority: preset.priority,
      enabled: true,
      targetGroups: ['ALL'],
      excludedWords: [],
      triggerCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      description: `Monitors WhatsApp groups for: "${preset.phrase}"`
    };

    setRules(prev => [newRule, ...prev]);
  };

  const openCreateModal = () => {
    setEditingRuleId(null);
    setName('');
    setKeywordsInput('');
    setMatchType('ANY_KEYWORD');
    setPriority('HIGH');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (rule) => {
    setEditingRuleId(rule.id);
    setName(rule.name);
    setKeywordsInput(rule.keywords.join(', '));
    setMatchType(rule.matchType || 'ANY_KEYWORD');
    setPriority(rule.priority);
    setDescription(rule.description || '');
    setIsModalOpen(true);
  };

  const handleSaveRule = (e) => {
    e.preventDefault();
    if (!name.trim() || !keywordsInput.trim()) {
      alert('Please enter a rule name and at least one keyword phrase.');
      return;
    }

    const keywords = keywordsInput.split(',').map(k => k.trim()).filter(Boolean);

    if (editingRuleId) {
      setRules(prev => prev.map(r => r.id === editingRuleId ? {
        ...r,
        name,
        keywords,
        matchType,
        priority,
        description
      } : r));
    } else {
      const newRule = {
        id: 'rule-' + Date.now(),
        name,
        keywords,
        matchType,
        priority,
        enabled: true,
        targetGroups: ['ALL'],
        excludedWords: [],
        triggerCount: 0,
        createdAt: new Date().toISOString().split('T')[0],
        description
      };
      setRules(prev => [newRule, ...prev]);
    }

    setIsModalOpen(false);
  };

  const toggleRuleEnabled = (id) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const deleteRule = (id) => {
    if (window.confirm('Delete this keyword prescription rule?')) {
      setRules(prev => prev.filter(r => r.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-5 bg-[#182229] border-[#00a884]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#00a884]" /> Prescribe WhatsApp Listening Rules
          </h3>
          <p className="text-xs text-[#8696a0] mt-1 max-w-xl">
            Specify the exact phrases, property keywords, or BNB inquiries you want to listen for in your WhatsApp groups.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="btn btn-primary text-xs sm:text-sm font-bold flex items-center gap-2 self-stretch sm:self-auto shadow-lg shadow-[#00a884]/20"
        >
          <Plus className="w-4 h-4" /> Prescribe Custom Rule
        </button>
      </div>

      {/* Quick 1-Click Lead Presets Section */}
      <div className="glass-panel p-5 bg-[#0b141a] border-[#202c33] space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" /> Quick 1-Click Property & BNB Lead Presets
          </h4>
          <span className="text-[11px] text-[#8696a0]">Tap to instantly prescribe:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {presetLeadPhrases.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleAddQuickPreset(preset)}
              className="p-3 rounded-xl bg-[#182229] hover:bg-[#202c33] border border-[#202c33] hover:border-[#00a884]/40 text-left text-xs font-semibold text-white transition-all flex items-center justify-between group"
            >
              <span className="truncate mr-2">{preset.label}</span>
              <span className="text-[#00a884] font-bold text-xs group-hover:scale-110 transition-transform">
                + Add
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Prescribed Rules List */}
      <div className="space-y-3">
        <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">
          Active Prescribed Rules ({rules.length})
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map(rule => (
            <div 
              key={rule.id}
              className={`
                glass-panel p-5 transition-all duration-200 flex flex-col justify-between
                ${rule.enabled ? 'bg-[#111b21] border-[#202c33]' : 'opacity-60 bg-[#0b141a] border-dashed border-[#202c33]'}
              `}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-extrabold text-white text-base">{rule.name}</h4>
                      <span className={`badge ${
                        rule.priority === 'CRITICAL' ? 'badge-critical' :
                        rule.priority === 'HIGH' ? 'badge-high' :
                        rule.priority === 'MEDIUM' ? 'badge-medium' : 'badge-low'
                      }`}>
                        {rule.priority}
                      </span>
                    </div>
                    <p className="text-xs text-[#8696a0]">{rule.description || 'Monitors WhatsApp groups for specified phrases.'}</p>
                  </div>

                  {/* Switch */}
                  <label className="switch flex-shrink-0" title={rule.enabled ? 'Rule Active' : 'Rule Paused'}>
                    <input 
                      type="checkbox" 
                      checked={rule.enabled} 
                      onChange={() => toggleRuleEnabled(rule.id)}
                    />
                    <span className="slider" />
                  </label>
                </div>

                {/* Prescribed Keyword Chips */}
                <div className="mb-4 space-y-2">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-[#8696a0] block">
                    Prescribed Phrases ({rule.keywords.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {rule.keywords.map((kw, idx) => (
                      <span 
                        key={idx}
                        className="px-3 py-1.5 rounded-lg bg-[#00a884]/20 text-[#06cf9c] font-sans text-xs font-extrabold border border-[#00a884]/30"
                      >
                        "{kw}"
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-[#202c33] text-xs text-[#8696a0]">
                <span className="font-mono text-[#00a884] font-bold">
                  {rule.triggerCount || 0} Alerts Triggered
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(rule)}
                    className="p-1.5 rounded-lg bg-[#182229] hover:bg-[#202c33] text-white"
                    title="Edit Rule"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="p-1.5 rounded-lg bg-[#182229] hover:bg-rose-950/40 text-slate-400 hover:text-rose-400"
                    title="Delete Rule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg p-6 bg-[#111b21] border-[#00a884]/40 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#202c33] pb-3">
              <h3 className="font-extrabold text-white text-lg">
                {editingRuleId ? 'Edit Prescribed Rule' : 'Prescribe New Keyword Rule'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#8696a0] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4">
              <div className="input-group">
                <label className="input-label">Rule Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Nyali & Bamburi Rental Requests" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Prescribed Phrase / Keywords (Comma Separated)</label>
                <textarea 
                  rows="3"
                  placeholder="looking for house in nyali, urgently looking for bnb in bamburi, who is available now nyali"
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  className="form-textarea font-sans text-sm font-medium"
                  required
                />
                <p className="text-[11px] text-[#8696a0]">Separate phrases with commas.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="input-group">
                  <label className="input-label">Match Strategy</label>
                  <select 
                    value={matchType} 
                    onChange={(e) => setMatchType(e.target.value)}
                    className="form-select"
                  >
                    <option value="ANY_KEYWORD">Contains ANY Phrase</option>
                    <option value="ALL_KEYWORDS">Must Contain ALL Phrases</option>
                    <option value="EXACT_PHRASE">Exact Match Phrase</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Priority Level</label>
                  <select 
                    value={priority} 
                    onChange={(e) => setPriority(e.target.value)}
                    className="form-select font-bold"
                  >
                    <option value="CRITICAL">🔴 CRITICAL (Urgent Alert)</option>
                    <option value="HIGH">🟠 HIGH Priority</option>
                    <option value="MEDIUM">🔵 MEDIUM Priority</option>
                    <option value="LOW">🟣 LOW Priority</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Description / Purpose</label>
                <input 
                  type="text" 
                  placeholder="Brief note..." 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#202c33]">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="btn btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary text-xs font-bold"
                >
                  Save Prescription Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
