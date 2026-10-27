import React from 'react';
import { 
  Menu, 
  Volume2, 
  VolumeX, 
  QrCode, 
  CheckCircle2, 
  Radio, 
  Sliders, 
  Users,
  Smartphone
} from 'lucide-react';
import { setMutedState, playAlertSound } from '../utils/audioAlerts';

export default function Header({ 
  setMobileOpen, 
  activeTab, 
  rulesCount, 
  groupsCount, 
  isAudioMuted, 
  setIsAudioMuted,
  setActiveTab,
  waStatus,
  connectedUser,
  onOpenQrModal
}) {
  const toggleAudio = () => {
    const newState = !isAudioMuted;
    setMutedState(newState);
    setIsAudioMuted(newState);
    if (!newState) {
      playAlertSound('HIGH');
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Live Monitor Stream';
      case 'rules': return 'Prescribed Keyword Rules';
      case 'groups': return 'WhatsApp Groups Manager';
      case 'simulator': return 'Real-Time Sandbox';
      case 'analytics': return 'Keyword Trends & Analytics';
      case 'integrations': return 'Alert Destinations & Webhooks';
      case 'guide': return 'WhatsApp API Setup Guide';
      default: return 'GroupPulse AI';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#111b21]/95 backdrop-blur-md border-b border-[#202c33] px-4 py-3 md:px-6">
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button 
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-lg bg-[#202c33] text-[#8696a0] hover:text-white"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h2 className="text-base md:text-xl font-extrabold text-white tracking-tight truncate">
              {getTitle()}
            </h2>
            <p className="text-xs text-[#8696a0] hidden sm:block">
              Real-time WhatsApp group keyword ingestion & alert dispatcher
            </p>
          </div>
        </div>

        {/* Right Side: QR Connect Status & Audio */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Real WhatsApp QR Connection Pill */}
          <button
            onClick={onOpenQrModal}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all
              ${waStatus === 'CONNECTED' 
                ? 'bg-[#00a884]/15 border-[#00a884]/40 text-[#00a884] hover:bg-[#00a884]/25' 
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/40 animate-pulse'}
            `}
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">
              {waStatus === 'CONNECTED' ? `WhatsApp: ${connectedUser ? connectedUser.name || 'Connected' : 'Active'}` : 'Connect Real WhatsApp'}
            </span>
            <span className="sm:hidden">
              {waStatus === 'CONNECTED' ? 'Connected' : 'QR Scan'}
            </span>
          </button>

          {/* Audio Alert Toggle */}
          <button
            onClick={toggleAudio}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all
              ${isAudioMuted 
                ? 'bg-rose-950/30 border-rose-500/30 text-rose-300 hover:bg-rose-900/40' 
                : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/40'}
            `}
            title={isAudioMuted ? 'Unmute alert audio chimes' : 'Mute alert audio chimes'}
          >
            {isAudioMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-rose-400" />
                <span className="hidden sm:inline">Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-[#00a884] animate-pulse" />
                <span className="hidden sm:inline">Sound On</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
