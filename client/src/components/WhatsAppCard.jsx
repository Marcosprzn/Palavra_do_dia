import React, { useState } from 'react';
import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  QrCode,
  ShieldCheck,
  Check,
  AlertTriangle,
  Users,
  Wifi,
  Sparkles
} from 'lucide-react';

export default function WhatsAppCard({ status, onConnect, onLogout, loading, contactsCount }) {
  const isConnected = status?.state === 'connected';
  const isQrReady = status?.state === 'qr_ready';
  const isConnecting = status?.state === 'connecting';
  const [confirmLogout, setConfirmLogout] = useState(false);

  const handleLogoutClick = () => {
    setConfirmLogout(false);
    onLogout();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl flex items-center justify-center ${
              isConnected
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                : isQrReady
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              <Smartphone className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-extrabold text-white">
                  Aparelho WhatsApp
                </h2>
                {isConnected ? (
                  <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    Conectado e Operando
                  </span>
                ) : isQrReady ? (
                  <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                    Aguardando Leitura do QR Code
                  </span>
                ) : (
                  <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-semibold">
                    Desconectado
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {isConnected
                  ? 'Sua sessão Baileys está ativa e pronta para disparar as mensagens diárias.'
                  : 'Pareie o seu WhatsApp escaneando o QR Code abaixo com a câmera do aplicativo.'}
              </p>
            </div>
          </div>

          <div>
            {isConnected ? (
              <button
                onClick={() => setConfirmLogout(true)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 transition-all cursor-pointer shadow-lg shadow-rose-950/40"
              >
                <LogOut className="w-4 h-4" />
                Desconectar WhatsApp
              </button>
            ) : (
              <button
                onClick={onConnect}
                disabled={loading || isConnecting}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/60 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isConnecting ? 'animate-spin' : ''}`} />
                {isConnecting ? 'Conectando...' : 'Gerar Novo QR Code'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* VIEW WHEN CONNECTED */}
      {isConnected && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 glass-panel rounded-3xl p-6 sm:p-8 border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-slate-900/60 to-slate-900/80">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  WhatsApp Conectado com Sucesso!
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  O sistema está autenticado e pronto. Seus envios automáticos diários ocorrerão no horário programado para os contatos selecionados.
                </p>

                <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Nome do Perfil</span>
                    <span className="text-xs font-bold text-slate-100">{status.user?.name || 'WhatsApp User'}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Número Identificador (JID)</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">{status.user?.id || 'Desconhecido'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Wifi className="w-4 h-4 text-emerald-400" />
                <span>Sessão persistente ativa</span>
              </div>

              <button
                onClick={() => setConfirmLogout(true)}
                className="px-4 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all self-start sm:self-auto cursor-pointer"
              >
                Trocar de número ou desconectar
              </button>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between border border-slate-800">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Contatos Sincronizados</h4>
                  <p className="text-[11px] text-slate-400">Puxados do WhatsApp</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-3xl font-extrabold text-white block">
                  {contactsCount || 0}
                </span>
                <span className="text-[11px] text-slate-400">destinatários na lista</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Intervalo humanizado anti-bloqueio ativado</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW WHEN QR CODE IS READY (NOT CONNECTED) */}
      {!isConnected && (
        <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-slate-800">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Step-by-step Instructions */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                  Como conectar o seu WhatsApp:
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Siga os passos abaixo no seu celular para autorizar o sistema a enviar os versículos do dia.
                </p>
              </div>

              <div className="space-y-3.5">
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-100">Abra o WhatsApp no seu smartphone</h5>
                    <p className="text-[11px] text-slate-400">Certifique-se de estar conectado à internet.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-100">Acesse Aparelhos Conectados</h5>
                    <p className="text-[11px] text-slate-400">No Android toque nos 3 pontinhos (⋮). No iPhone toque em Configurações.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-100">Toque em "Conectar um aparelho"</h5>
                    <p className="text-[11px] text-slate-400">Aponte a câmera para o QR Code exibido ao lado.</p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 text-xs text-amber-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
                <span>O QR Code atualiza automaticamente em caso de expiração.</span>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl relative">
              {isQrReady && status.qrCode ? (
                <div className="text-center space-y-4">
                  <div className="p-4 bg-white rounded-3xl shadow-2xl inline-block border-4 border-emerald-500/30">
                    <img
                      src={status.qrCode}
                      alt="QR Code WhatsApp"
                      className="w-64 h-64 sm:w-72 sm:h-72 object-contain rounded-xl"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    QR Code ativo para leitura
                  </div>
                </div>
              ) : isConnecting ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto animate-pulse">
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Gerando QR Code...</h4>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Iniciando motor Baileys e preparando conexão segura multi-device.
                  </p>
                </div>
              ) : (
                <div className="py-16 text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-white">QR Code Não Iniciado</h4>
                  <p className="text-xs text-slate-400 max-w-xs mb-3">
                    Clique no botão abaixo para gerar um novo QR Code e conectar seu WhatsApp.
                  </p>
                  <button
                    onClick={onConnect}
                    disabled={loading}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-950/60 cursor-pointer"
                  >
                    Gerar QR Code Agora
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Logout Modal */}
      {confirmLogout && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-bold text-base text-white">Desconectar WhatsApp?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Tem certeza que deseja desconectar o WhatsApp? A sessão salva será encerrada e você precisará escanear o QR Code novamente para realizar novos envios.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmLogout(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogoutClick}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-all cursor-pointer shadow-lg shadow-rose-950/50"
              >
                Sim, Desconectar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
