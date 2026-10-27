import React from 'react';
import { 
  LayoutDashboard, 
  Sliders, 
  Users, 
  MessageSquareCode, 
  BarChart3, 
  Webhook, 
  BookOpen, 
  X, 
  Radio, 
  Smartphone,
  CheckCircle2,
  QrCode
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  mobileOpen, 
  setMobileOpen, 
  unreadCount,
  waStatus,
  connectedUser,
  onOpenQrModal
}) {
  const navItems = [
    { id: 'dashboard', label: 'Live Monitor Feed', icon: LayoutDashboard, badge: unreadCount > 0 ? unreadCount : null },
    { id: 'rules', label: 'Prescribed Rules', icon: Sliders },
    { id: 'groups', label: 'WhatsApp Groups', icon: Users },
    { id: 'simulator', label: 'Test Sandbox', icon: MessageSquareCode, isHot: true },
    { id: 'analytics', label: 'Analytics & Trends', icon: BarChart3 },
    { id: 'integrations', label: 'Alert Webhooks', icon: Webhook },
    { id: 'guide', label: 'API Setup Guide', icon: BookOpen },
  ];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    if (mobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 md:hidden" 
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#111b21] border-r border-[#202c33]
        flex flex-col transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:z-auto
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Header */}
        <div className="p-5 border-b border-[#202c33] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00a884] to-[#128c7e] flex items-center justify-center shadow-lg shadow-[#00a884]/20">
              <Radio className="w-6 h-6 text-white font-bold animate-pulse" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-white tracking-tight flex items-center gap-1.5">
                GroupPulse <span className="text-[#00a884] text-xs px-1.5 py-0.5 rounded bg-[#00a884]/10 border border-[#00a884]/30">LIVE</span>
              </h1>
              <p className="text-xs text-[#8696a0]">WhatsApp Group Listener</p>
            </div>
          </div>

          <button 
            onClick={() => setMobileOpen(false)} 
            className="md:hidden text-[#8696a0] hover:text-white p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`
                  w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold
                  transition-all duration-200 group
                  ${isActive 
                    ? 'bg-[#00a884]/15 text-[#00a884] border border-[#00a884]/30 shadow-sm' 
                    : 'text-[#8696a0] hover:text-white hover:bg-white/5'}
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-[#00a884]' : 'text-[#8696a0] group-hover:text-white'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="bg-[#00a884] text-slate-950 text-xs font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Live WhatsApp QR Status Banner */}
        <div className="p-4 border-t border-[#202c33] bg-[#0b141a]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${waStatus === 'CONNECTED' ? 'bg-[#00a884] animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-xs font-bold text-white">WhatsApp Status</span>
            </div>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
              waStatus === 'CONNECTED' 
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-950 text-amber-300 border-amber-500/30'
            }`}>
              {waStatus}
            </span>
          </div>

          {waStatus === 'CONNECTED' ? (
            <p className="text-[11px] text-[#8696a0] truncate font-mono">
              Linked: {connectedUser ? connectedUser.name || connectedUser.id : 'Active WhatsApp'}
            </p>
          ) : (
            <button 
              onClick={onOpenQrModal}
              className="btn btn-primary w-full text-xs font-bold py-2 mt-1 flex items-center justify-center gap-1.5"
            >
              <QrCode className="w-4 h-4" /> Scan QR to Connect
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
