import React from 'react';
import { 
  X, 
  QrCode, 
  Smartphone, 
  CheckCircle2, 
  RefreshCw, 
  ShieldCheck, 
  LogOut,
  Radio
} from 'lucide-react';

export default function QRCodeModal({ 
  waStatus, 
  qrDataUrl, 
  connectedUser, 
  onClose, 
  onDisconnect 
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md p-6 bg-[#111b21] border-emerald-500/30 shadow-2xl space-y-5 text-center relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-left">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-lg">Connect Real WhatsApp</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content based on waStatus */}
        {waStatus === 'CONNECTED' ? (
          <div className="space-y-4 py-4">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 mx-auto flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h4 className="font-extrabold text-xl text-white">WhatsApp Connected!</h4>
              <p className="text-sm text-emerald-400 font-mono mt-1 font-semibold">
                Linked Account: {connectedUser ? connectedUser.name || connectedUser.id : 'Active WhatsApp Device'}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Listening to real incoming messages in your WhatsApp groups in real-time.
              </p>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-center gap-3">
              <button onClick={onClose} className="btn btn-primary text-xs font-bold px-6">
                Done & View Stream
              </button>
              <button 
                onClick={onDisconnect} 
                className="btn btn-secondary text-xs text-rose-400 border-rose-500/30 hover:bg-rose-950/40"
              >
                <LogOut className="w-3.5 h-3.5" /> Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <p className="text-xs text-slate-300 leading-relaxed">
              Scan this QR Code with WhatsApp on your phone to link your WhatsApp groups live:
            </p>

            {/* QR Display Container */}
            <div className="w-56 h-56 mx-auto p-3 bg-white rounded-2xl shadow-2xl border-4 border-emerald-500/60 flex items-center justify-center relative">
              {qrDataUrl ? (
                <img 
                  src={qrDataUrl} 
                  alt="WhatsApp QR Code" 
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-600 space-y-2">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                  <span className="text-xs font-semibold text-slate-700">Generating WhatsApp QR...</span>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="p-3 rounded-lg bg-slate-900/90 border border-white/10 text-left text-xs space-y-1.5 text-slate-300">
              <div className="font-bold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Instructions to Scan:
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-300 font-sans">
                <li>Open <strong>WhatsApp</strong> on your phone</li>
                <li>Tap <strong>Menu (⋮)</strong> or <strong>Settings</strong> ⚙️</li>
                <li>Select <strong>Linked Devices</strong> → <strong>Link a Device</strong></li>
                <li>Point camera at the QR code above</li>
              </ol>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-emerald-400">
              <span className="live-dot" />
              Listening for WhatsApp Web socket handshake...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
