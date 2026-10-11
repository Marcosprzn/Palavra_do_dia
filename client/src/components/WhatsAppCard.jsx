import React from 'react';
import { Smartphone, CheckCircle2, AlertCircle, RefreshCw, LogOut, QrCode } from 'lucide-react';

export default function WhatsAppCard({ status, onConnect, onLogout, loading }) {
  const isConnected = status?.state === 'connected';
  const isQrReady = status?.state === 'qr_ready';
  const isConnecting = status?.state === 'connecting';

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl flex items-center justify-center ${
            isConnected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
            isQrReady ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
            'bg-slate-800 text-slate-400 border border-slate-700'
          }`}>
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Conexão WhatsApp
              {isConnected && (
                <span className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Conectado
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              {isConnected
                ? `Logado como ${status.user?.name || 'WhatsApp User'} (${status.user?.id || ''})`
                : 'Escaneie o QR Code para sincronizar e enviar mensagens'}
            </p>
          </div>
        </div>

        {isConnected ? (
          <button
            onClick={onLogout}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Desconectar
          </button>
        ) : (
          <button
            onClick={onConnect}
            disabled={loading || isConnecting}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isConnecting ? 'animate-spin' : ''}`} />
            {isConnecting ? 'Conectando...' : 'Reconectar'}
          </button>
        )}
      </div>

      {/* QR Code Container */}
      {isQrReady && status.qrCode && (
        <div className="mt-4 p-5 rounded-xl bg-slate-900/90 border border-amber-500/30 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-3">
            <QrCode className="w-4 h-4" />
            Abra o WhatsApp &gt; Dispositivos Conectados &gt; Conectar um aparelho
          </div>
          <div className="p-3 bg-white rounded-2xl shadow-2xl shadow-emerald-500/10 inline-block">
            <img
              src={status.qrCode}
              alt="QR Code WhatsApp"
              className="w-56 h-56 object-contain rounded-lg"
            />
          </div>
          <p className="text-xs text-slate-400 mt-3 max-w-sm">
            O QR Code atualiza automaticamente caso expire. Aproxime a câmera do seu celular para parear.
          </p>
        </div>
      )}

      {/* Connecting status */}
      {isConnecting && !status.qrCode && (
        <div className="mt-4 p-6 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-center gap-3 text-sm text-slate-300">
          <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
          Inicializando sessão do WhatsApp e gerando QR Code...
        </div>
      )}

      {/* Disconnected advice */}
      {!isConnected && !isQrReady && !isConnecting && (
        <div className="mt-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3 text-xs text-slate-400">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>WhatsApp não conectado. Clique em <strong>Reconectar</strong> para gerar o QR Code.</span>
        </div>
      )}
    </div>
  );
}
