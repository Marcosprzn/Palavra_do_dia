import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import {
  Smartphone,
  BookOpen,
  Users,
  History,
  ShieldCheck,
  CheckCircle2,
  Bookmark
} from 'lucide-react';

import WhatsAppCard from './components/WhatsAppCard';
import VerseViewer from './components/VerseViewer';
import ImageAttachment from './components/ImageAttachment';
import LiveWhatsAppPreview from './components/LiveWhatsAppPreview';
import ScheduleCard from './components/ScheduleCard';
import RecipientPicker from './components/RecipientPicker';
import DispatchLogs from './components/DispatchLogs';
import ChurchCross from './components/icons/ChurchCross';

export default function App() {
  const [activeTab, setActiveTab] = useState('message'); // 'whatsapp' | 'message' | 'recipients' | 'logs'
  const [waStatus, setWaStatus] = useState({ state: 'connecting', qrCode: null, user: null });
  const [verseData, setVerseData] = useState(null);
  const [scheduleTime, setScheduleTime] = useState('06:00');
  const [recipients, setRecipients] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isDispatching, setIsDispatching] = useState(false);
  const [liveProgress, setLiveProgress] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [keepImageAttached, setKeepImageAttached] = useState(false);

  // Initialize Socket.io and fetch initial state
  useEffect(() => {
    const socket = io({
      transports: ['websocket', 'polling']
    });

    socket.on('connection_status', (status) => {
      setWaStatus(status);
      if (status.state === 'qr_ready') {
        setActiveTab('whatsapp');
      }
    });

    socket.on('scheduler_status', (data) => {
      if (data?.schedule_time) setScheduleTime(data.schedule_time);
    });

    socket.on('contacts_synced', () => {
      fetchRecipients();
    });

    socket.on('dispatch_start', () => {
      setIsDispatching(true);
      setLiveProgress({ current: 0, total: 0, percentage: 0 });
    });

    socket.on('dispatch_progress', (prog) => {
      setLiveProgress(prog);
      fetchLogs();
    });

    socket.on('dispatch_complete', () => {
      setIsDispatching(false);
      setLiveProgress(null);
      fetchLogs();
    });

    socket.on('image_auto_removed', () => {
      setVerseData(prev => ({ ...prev, image_path: null }));
    });

    // Initial API fetches
    fetchInitialData();

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchInitialData = async () => {
    try {
      // 1. Status
      const statusRes = await fetch('/api/status');
      const statusData = await statusRes.json();
      if (statusData.whatsapp) {
        setWaStatus(statusData.whatsapp);
        if (statusData.whatsapp.state !== 'connected') {
          setActiveTab('whatsapp');
        }
      }
      if (statusData.scheduler?.schedule_time) {
        setScheduleTime(statusData.scheduler.schedule_time);
      }

      // 2. Verse
      const verseRes = await fetch('/api/verse');
      const vData = await verseRes.json();
      setVerseData(vData);

      // 3. Recipients
      await fetchRecipients();

      // 4. Logs
      await fetchLogs();

      // 5. Image Lock Setting
      const lockRes = await fetch('/api/settings/image-lock');
      const lockData = await lockRes.json();
      if (lockData?.keep_image_attached !== undefined) {
        setKeepImageAttached(lockData.keep_image_attached);
      }
    } catch (err) {
      console.error('Erro ao carregar dados iniciais:', err);
    }
  };

  const fetchRecipients = async () => {
    try {
      const res = await fetch('/api/recipients');
      const data = await res.json();
      setRecipients(data);
    } catch (err) {
      console.error('Erro ao carregar destinatários:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs?limit=50');
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error('Erro ao carregar logs:', err);
    }
  };

  // Polling de fallback caso WebSockets oscilem ou desconectem no Render
  useEffect(() => {
    const pollInterval = waStatus.state === 'connecting' ? 2000 : 6000;
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/status');
        if (res.ok) {
          const data = await res.json();
          if (data.whatsapp) {
            setWaStatus(prev => {
              if (
                prev.state !== data.whatsapp.state ||
                prev.qrCode !== data.whatsapp.qrCode ||
                prev.user?.id !== data.whatsapp.user?.id
              ) {
                return data.whatsapp;
              }
              return prev;
            });
          }
        }
      } catch (e) {
        // Silencioso em caso de erro temporário
      }
    }, pollInterval);

    return () => clearInterval(interval);
  }, [waStatus.state]);

  // WhatsApp Actions
  const handleConnectWhatsApp = async () => {
    setLoadingAction(true);
    setWaStatus(prev => ({ ...prev, state: 'connecting' }));
    try {
      const res = await fetch('/api/whatsapp/connect', { method: 'POST' });
      const data = await res.json();
      if (data.qrCode) {
        setWaStatus({
          state: 'qr_ready',
          qrCode: data.qrCode,
          user: null
        });
      } else if (data.state) {
        setWaStatus({
          state: data.state,
          qrCode: data.qrCode || null,
          user: data.user || null
        });
      }
    } catch (err) {
      console.error('Erro ao conectar WhatsApp:', err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleLogoutWhatsApp = async () => {
    setLoadingAction(true);
    try {
      await fetch('/api/whatsapp/logout', { method: 'POST' });
      setActiveTab('whatsapp');
    } catch (err) {
      console.error('Erro ao desconectar WhatsApp:', err);
    } finally {
      setLoadingAction(false);
    }
  };

  // Verse Actions
  const handleRollVerse = async () => {
    setLoadingAction(true);
    try {
      const res = await fetch('/api/verse/roll', { method: 'POST' });
      const data = await res.json();
      setVerseData(data);
    } catch (err) {
      console.error('Erro ao sortear versículo:', err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSelectVerse = async (verseObj) => {
    try {
      const res = await fetch('/api/verse/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verse: verseObj })
      });
      const data = await res.json();
      setVerseData(data);
    } catch (err) {
      console.error('Erro ao selecionar versículo:', err);
    }
  };

  const handleUpdateCaption = async (caption) => {
    try {
      await fetch('/api/verse/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption })
      });
      setVerseData(prev => ({ ...prev, custom_caption: caption }));
    } catch (err) {
      console.error('Erro ao atualizar saudação:', err);
    }
  };

  // Image Actions
  const handleUploadSuccess = (imageUrl) => {
    setVerseData(prev => ({ ...prev, image_path: imageUrl }));
  };

  const handleRemoveImage = async () => {
    try {
      await fetch('/api/upload', { method: 'DELETE' });
      setVerseData(prev => ({ ...prev, image_path: null }));
    } catch (err) {
      console.error('Erro ao remover imagem:', err);
    }
  };

  const handleToggleKeepImage = async (newVal) => {
    setKeepImageAttached(newVal);
    try {
      await fetch('/api/settings/image-lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keep_image_attached: newVal })
      });
    } catch (err) {
      console.error('Erro ao atualizar opção de travar imagem:', err);
    }
  };

  // Schedule Actions
  const handleUpdateSchedule = async (newTime) => {
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule_time: newTime })
      });
      const data = await res.json();
      if (data.schedule_time) setScheduleTime(data.schedule_time);
    } catch (err) {
      console.error('Erro ao atualizar horário:', err);
    }
  };

  const handleTriggerDispatch = async () => {
    try {
      setIsDispatching(true);
      setActiveTab('logs');
      await fetch('/api/dispatch', { method: 'POST' });
    } catch (err) {
      console.error('Erro ao iniciar disparo manual:', err);
      setIsDispatching(false);
    }
  };

  // Recipients Actions
  const handleSaveRecipients = async (updatedList) => {
    try {
      await fetch('/api/recipients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipients: updatedList })
      });
      setRecipients(updatedList);
    } catch (err) {
      console.error('Erro ao salvar destinatários:', err);
    }
  };

  const isConnected = waStatus?.state === 'connected';
  const activeRecipientsCount = recipients.filter(r => r.active).length;

  return (
    <div className="min-h-screen pb-24 bg-[#FAF8F5] text-[#382A1E]">
      {/* Top Header Bar: Clean, Warm, Serene */}
      <header className="border-b border-[#E8DFD3] bg-[#FAF8F5]/90 backdrop-blur-md sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#F4EFE6] border border-[#E8DFD3] flex items-center justify-center text-[#C59B27] shadow-xs flex-shrink-0">
              <ChurchCross className="w-5 h-5 text-[#C59B27]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-display font-bold text-[#382A1E] tracking-tight flex items-center gap-1.5 sm:gap-2 truncate">
                Palavra do Dia
                <span className="text-[9px] sm:text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-[#F5EDE0] text-[#8E691A] border border-[#E8D9BD] hidden xs:inline-block">
                  Devocional
                </span>
              </h1>
              <p className="text-[11px] sm:text-xs text-[#7A6859] hidden sm:block">
                Envio sereno e diário das escrituras sagradas para seus contatos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Quick Status Clickable Badge */}
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-full border text-[11px] sm:text-xs font-medium transition-all cursor-pointer shadow-xs ${
                isConnected
                  ? 'bg-[#EBF7EE] border-[#C2E4C9] text-[#2D6A4F] hover:bg-[#E2F3E6]'
                  : 'bg-[#FFF8EA] border-[#F0DCB3] text-[#A27318] hover:bg-[#FDF3DE]'
              }`}
              title="Clique para abrir a aba do WhatsApp"
            >
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#2D6A4F]' : 'bg-[#D4A33B] animate-pulse'}`}></span>
              <span className="hidden xs:inline">{isConnected ? 'WhatsApp Conectado' : 'Conectar Aparelho'}</span>
              <span className="xs:hidden">{isConnected ? 'Conectado' : 'Conectar'}</span>
            </button>

            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F5EFE6] border border-[#E8DFD3] text-xs text-[#7A6859]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>Anti-Bloqueio</span>
            </div>
          </div>
        </div>

        {/* Apple-Style Segmented Navigation Tabs */}
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 pt-0.5 pb-2.5">
          <div className="flex p-1 rounded-2xl bg-[#EFE9DF] border border-[#E2D8C9] gap-1 overflow-x-auto no-scrollbar w-full">
            {/* Tab 1: WhatsApp */}
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
                activeTab === 'whatsapp'
                  ? 'bg-white text-[#382A1E] shadow-sm'
                  : 'text-[#7A6859] hover:text-[#382A1E] hover:bg-white/50'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[#2D6A4F]' : 'bg-[#C59B27]'}`}></span>
            </button>

            {/* Tab 2: Message & Send */}
            <button
              onClick={() => setActiveTab('message')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
                activeTab === 'message'
                  ? 'bg-white text-[#382A1E] shadow-sm'
                  : 'text-[#7A6859] hover:text-[#382A1E] hover:bg-white/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Mensagem & Envio</span>
            </button>

            {/* Tab 3: Recipients */}
            <button
              onClick={() => setActiveTab('recipients')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
                activeTab === 'recipients'
                  ? 'bg-white text-[#382A1E] shadow-sm'
                  : 'text-[#7A6859] hover:text-[#382A1E] hover:bg-white/50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Destinatários</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#FAF8F5] text-[#7A6859] border border-[#E8DFD3]">
                {activeRecipientsCount}
              </span>
            </button>

            {/* Tab 4: Logs */}
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
                activeTab === 'logs'
                  ? 'bg-white text-[#382A1E] shadow-sm'
                  : 'text-[#7A6859] hover:text-[#382A1E] hover:bg-white/50'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Histórico</span>
              {isDispatching && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#C59B27] animate-ping"></span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {/* TAB 1: CONEXÃO WHATSAPP */}
        {activeTab === 'whatsapp' && (
          <div className="max-w-3xl mx-auto">
            <WhatsAppCard
              status={waStatus}
              onConnect={handleConnectWhatsApp}
              onLogout={handleLogoutWhatsApp}
              loading={loadingAction}
              contactsCount={recipients.length}
            />
          </div>
        )}

        {/* TAB 2: MENSAGEM & ENVIO */}
        {activeTab === 'message' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
            {/* Left Column: Verse Viewer, Image Attachment, Schedule Card */}
            <div className="lg:col-span-7 space-y-6">
              <VerseViewer
                verseData={verseData}
                caption={verseData?.custom_caption}
                onRoll={handleRollVerse}
                onSelectVerse={handleSelectVerse}
                onUpdateCaption={handleUpdateCaption}
                loading={loadingAction}
              />

              <ImageAttachment
                imagePath={verseData?.image_path}
                keepImageAttached={keepImageAttached}
                onUploadSuccess={handleUploadSuccess}
                onRemoveImage={handleRemoveImage}
                onToggleKeepImage={handleToggleKeepImage}
              />

              <ScheduleCard
                scheduleTime={scheduleTime}
                isDispatching={isDispatching}
                activeRecipientsCount={activeRecipientsCount}
                onUpdateSchedule={handleUpdateSchedule}
                onTriggerDispatch={handleTriggerDispatch}
              />
            </div>

            {/* Right Column: Live Preview */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-32">
              <LiveWhatsAppPreview
                verseData={verseData}
                caption={verseData?.custom_caption}
                imagePath={verseData?.image_path}
              />
            </div>
          </div>
        )}

        {/* TAB 3: DESTINATÁRIOS */}
        {activeTab === 'recipients' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <RecipientPicker
              recipients={recipients}
              onSaveRecipients={handleSaveRecipients}
              onRefresh={fetchRecipients}
              loading={loadingAction}
            />
          </div>
        )}

        {/* TAB 4: HISTÓRICO & LOGS */}
        {activeTab === 'logs' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <DispatchLogs
              logs={logs}
              liveProgress={liveProgress}
              isDispatching={isDispatching}
            />
          </div>
        )}
      </main>
    </div>
  );
}
