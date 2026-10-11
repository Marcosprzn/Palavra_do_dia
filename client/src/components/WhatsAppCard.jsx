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
      <div className="church-card rounded-3xl p-6 sm:p-8 relative overflow-hidden bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl flex items-center justify-center transition-all ${
              isConnected
                ? 'bg-[#EBF7EE] text-[#2D6A4F] border border-[#C2E4C9]'
                : isQrReady
                ? 'bg-[#FFF8EA] text-[#A27318] border border-[#F0DCB3]'
                : 'bg-[#F6F1EA] text-[#7A6859] border border-[#E8DFD3]'
            }`}>
              <Smartphone className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-display font-bold text-[#382A1E]">
                  Aparelho WhatsApp
                </h2>
                {isConnected ? (
                  <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-[#EBF7EE] text-[#2D6A4F] border border-[#C2E4C9] font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#2D6A4F] animate-pulse"></span>
                    Conectado e Operando
                  </span>
                ) : isQrReady ? (
                  <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-[#FFF8EA] text-[#A27318] border border-[#F0DCB3] font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#D4A33B] animate-pulse"></span>
                    Aguardando Leitura do QR Code
                  </span>
                ) : (
                  <span className="text-xs px-3 py-1 rounded-full bg-[#F6F1EA] text-[#7A6859] border border-[#E8DFD3] font-medium">
                    Desconectado
                  </span>
                )}
              </div>
              <p className="text-xs text-[#7A6859] mt-1.5 leading-relaxed">
                {isConnected
                  ? 'Sua sessão está ativa e segura no Supabase, pronta para os disparos devocionais diários.'
                  : 'Pareie o seu WhatsApp escaneando o QR Code abaixo com a câmera do aplicativo.'}
              </p>
            </div>
          </div>

          <div>
            {isConnected ? (
              <button
                onClick={() => setConfirmLogout(true)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-[#FDF2F2] hover:bg-[#FCE8E8] text-[#B93838] border border-[#F5CACA] transition-all cursor-pointer shadow-xs"
              >
                <LogOut className="w-4 h-4" />
                Desconectar WhatsApp
              </button>
            ) : (
              <button
                onClick={onConnect}
                disabled={loading || isConnecting}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-[#382A1E] hover:bg-[#251B12] text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
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
          <div className="md:col-span-2 church-card rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#FDFBF7] to-white border border-[#E8DFD3]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EBF7EE] border border-[#C2E4C9] flex items-center justify-center text-[#2D6A4F] flex-shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-base sm:text-lg font-bold text-[#382A1E] flex items-center gap-2">
                  WhatsApp Conectado com Sucesso!
                  <Sparkles className="w-4 h-4 text-[#C59B27]" />
                </h3>
                <p className="text-xs text-[#7A6859] leading-relaxed">
                  O sistema está autenticado. Os envios das passagens bíblicas ocorrerão no horário programado para os contatos habilitados.
                </p>

                <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8DFD3]">
                    <span className="text-[11px] text-[#8E7B6C] block mb-0.5">Perfil Conectado</span>
                    <span className="text-xs font-bold text-[#382A1E]">{status.user?.name || 'WhatsApp User'}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8DFD3]">
                    <span className="text-[11px] text-[#8E7B6C] block mb-0.5">Número Identificador (JID)</span>
                    <span className="text-xs font-mono font-bold text-[#2D6A4F]">{status.user?.id || 'Desconhecido'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-[#E8DFD3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-[#7A6859]">
                <Wifi className="w-4 h-4 text-[#2D6A4F]" />
                <span>Sessão persistida em nuvem</span>
              </div>

              <button
                onClick={() => setConfirmLogout(true)}
                className="px-3 py-1.5 text-xs font-medium text-[#B93838] hover:bg-[#FDF2F2] rounded-xl transition-all self-start sm:self-auto cursor-pointer"
              >
                Trocar de número ou desconectar
              </button>
            </div>
          </div>

          <div className="church-card rounded-3xl p-6 flex flex-col justify-between bg-white border border-[#E8DFD3]">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#F6F1EA] text-[#8E691A] border border-[#E8DFD3]">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#382A1E]">Contatos Sincronizados</h4>
                  <p className="text-[11px] text-[#7A6859]">Da sua agenda do WhatsApp</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8DFD3] text-center">
                <span className="text-3xl font-extrabold text-[#382A1E] block font-display">
                  {contactsCount || 0}
                </span>
                <span className="text-[11px] text-[#7A6859]">destinatários na lista</span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E8DFD3] text-[11px] text-[#7A6859] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#C59B27] flex-shrink-0" />
              <span>Intervalo humanizado anti-bloqueio</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW WHEN QR CODE IS READY (NOT CONNECTED) */}
      {!isConnected && (
        <div className="church-card rounded-3xl p-6 sm:p-10 bg-white border border-[#E8DFD3]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Step-by-step Instructions */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <h3 className="text-lg sm:text-xl font-display font-bold text-[#382A1E] mb-2">
                  Como conectar o seu WhatsApp:
                </h3>
                <p className="text-xs text-[#7A6859] leading-relaxed">
                  Siga os passos abaixo no seu smartphone para sincronizar e autorizar os envios diários.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8DFD3]">
                  <div className="w-7 h-7 rounded-xl bg-[#F4EFE6] text-[#8E691A] border border-[#E8DFD3] flex items-center justify-center text-xs font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#382A1E]">Abra o WhatsApp no seu smartphone</h5>
                    <p className="text-[11px] text-[#7A6859]">Certifique-se de estar conectado à internet.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8DFD3]">
                  <div className="w-7 h-7 rounded-xl bg-[#F4EFE6] text-[#8E691A] border border-[#E8DFD3] flex items-center justify-center text-xs font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#382A1E]">Acesse Aparelhos Conectados</h5>
                    <p className="text-[11px] text-[#7A6859]">No Android toque nos 3 pontinhos (⋮). No iPhone toque em Configurações.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8DFD3]">
                  <div className="w-7 h-7 rounded-xl bg-[#F4EFE6] text-[#8E691A] border border-[#E8DFD3] flex items-center justify-center text-xs font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#382A1E]">Toque em "Conectar um aparelho"</h5>
                    <p className="text-[11px] text-[#7A6859]">Aponte a câmera para o QR Code exibido ao lado.</p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FFF8EA] border border-[#F0DCB3] flex items-center gap-3 text-xs text-[#8E691A]">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#C59B27]" />
                <span>O QR Code atualiza automaticamente em caso de expiração da chave.</span>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-3xl bg-[#FAF8F5] border border-[#E8DFD3] shadow-xs relative">
              {isQrReady && status.qrCode ? (
                <div className="text-center space-y-4">
                  <div className="p-4 bg-white rounded-3xl shadow-md inline-block border-2 border-[#E8DFD3]">
                    <img
                      src={status.qrCode}
                      alt="QR Code WhatsApp"
                      className="w-60 h-60 sm:w-68 sm:h-68 object-contain rounded-xl"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs text-[#2D6A4F] font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#2D6A4F] animate-pulse"></span>
                    QR Code ativo para leitura
                  </div>
                </div>
              ) : isConnecting ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#F4EFE6] border border-[#E8DFD3] flex items-center justify-center text-[#8E691A] mx-auto animate-pulse">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                  <h4 className="text-sm font-bold text-[#382A1E]">Gerando QR Code...</h4>
                  <p className="text-xs text-[#7A6859] max-w-xs">
                    Iniciando conexão segura com a API do WhatsApp.
                  </p>
                </div>
              ) : (
                <div className="py-16 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#F4EFE6] border border-[#E8DFD3] flex items-center justify-center text-[#8E691A] mx-auto">
                    <QrCode className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-[#382A1E]">QR Code Não Iniciado</h4>
                  <p className="text-xs text-[#7A6859] max-w-xs mb-3">
                    Clique no botão abaixo para gerar um novo QR Code e conectar seu WhatsApp.
                  </p>
                  <button
                    onClick={onConnect}
                    disabled={loading}
                    className="px-5 py-2.5 bg-[#382A1E] hover:bg-[#251B12] text-white rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-[#382A1E]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8DFD3] rounded-3xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-[#B93838]">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-bold text-base text-[#382A1E]">Desconectar WhatsApp?</h3>
            </div>
            <p className="text-xs text-[#7A6859] leading-relaxed">
              Tem certeza que deseja desconectar o WhatsApp? A sessão salva será encerrada e você precisará escanear o QR Code novamente para realizar novos envios.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmLogout(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#FAF8F5] hover:bg-[#F4EFE6] text-[#7A6859] border border-[#E8DFD3] transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogoutClick}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#B93838] hover:bg-[#9E2A2A] text-white transition-all cursor-pointer shadow-xs"
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
