import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  QrCode, 
  CheckCircle2, 
  RefreshCw, 
  ShieldCheck, 
  Radio, 
  X, 
  MessageSquare, 
  Smartphone,
  LogOut
} from 'lucide-react';

export default function GroupsManager({ 
  groups, 
  setGroups, 
  waStatus, 
  connectedUser, 
  onOpenQrModal,
  onDisconnect 
}) {
  return (
    <div className="space-y-6">
      {/* WhatsApp Connection Status Card */}
      <div className="glass-panel p-5 bg-[#182229] border-[#00a884]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg ${
            waStatus === 'CONNECTED' ? 'bg-[#00a884]/20 border border-[#00a884]/40 text-[#00a884]' : 'bg-amber-950/40 border border-amber-500/40 text-amber-400'
          }`}>
            <Smartphone className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-white text-base sm:text-lg">WhatsApp Socket Connection</h3>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                waStatus === 'CONNECTED' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30' : 'bg-amber-950 text-amber-300 border-amber-500/30'
              }`}>
                {waStatus}
              </span>
            </div>
            <p className="text-xs text-[#8696a0] mt-0.5">
              {waStatus === 'CONNECTED' 
                ? `Active Session: ${connectedUser ? connectedUser.name || connectedUser.id : 'Linked Device'}`
                : 'Not connected to real WhatsApp account. Scan QR code to sync real group chats.'}
            </p>
          </div>
        </div>

        <div>
          {waStatus === 'CONNECTED' ? (
            <button
              onClick={onDisconnect}
              className="btn btn-secondary text-xs text-rose-400 border-rose-500/30 hover:bg-rose-950/40"
            >
              <LogOut className="w-3.5 h-3.5" /> Disconnect Session
            </button>
          ) : (
            <button
              onClick={onOpenQrModal}
              className="btn btn-primary text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-[#00a884]/20"
            >
              <QrCode className="w-4 h-4" /> Scan QR Code to Link
            </button>
          )}
        </div>
      </div>

      {/* Monitored Groups Grid */}
      <div className="space-y-3">
        <h4 className="font-bold text-white text-base flex items-center gap-2">
          <Users className="w-5 h-5 text-[#00a884]" /> Synced WhatsApp Groups ({groups.length})
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map(group => (
            <div 
              key={group.id}
              className="glass-panel glass-panel-hover p-5 flex flex-col justify-between"
            >
              <div>
                {/* Group Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#00a884] to-[#128c7e] flex items-center justify-center text-white font-bold shadow-md">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base truncate max-w-[170px]">{group.name}</h4>
                      <p className="text-xs text-[#8696a0] font-mono flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#00a884]" />
                        {group.platform || 'WhatsApp Group'}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                    ACTIVE
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 mb-4 line-clamp-2 leading-relaxed">
                  {group.description || 'Monitored WhatsApp group stream.'}
                </p>

                {/* Stat Grid */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#0b141a] border border-[#202c33] text-xs mb-4">
                  <div>
                    <span className="text-[#8696a0] text-[10px] font-bold uppercase block">Members</span>
                    <span className="font-extrabold text-white">{group.membersCount ? group.membersCount.toLocaleString() : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[#8696a0] text-[10px] font-bold uppercase block">Est Volume</span>
                    <span className="font-mono text-[#00a884] font-semibold">{group.dailyVolume || 120} msgs/day</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-[#202c33] text-xs">
                <span className="text-[#8696a0] text-[11px] font-mono">
                  ID: {group.id.slice(0, 12)}...
                </span>

                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#182229] text-slate-300 border border-[#202c33]">
                  {group.sensitivity || 'HIGH'} SENSITIVITY
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
