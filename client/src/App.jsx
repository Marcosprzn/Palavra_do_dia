import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import {
  Sparkles,
  MessageCircleHeart,
  ShieldCheck,
  Smartphone,
  BookOpen,
  Users,
  History,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

import WhatsAppCard from './components/WhatsAppCard';
import VerseViewer from './components/VerseViewer';
import ImageAttachment from './components/ImageAttachment';
import LiveWhatsAppPreview from './components/LiveWhatsAppPreview';
import ScheduleCard from './components/ScheduleCard';
import RecipientPicker from './components/RecipientPicker';
import DispatchLogs from './components/DispatchLogs';

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

  // Initialize Socket.io and fetch initial state
  useEffect(() => {
    const socket = io({
      transports: ['websocket', 'polling']
    });

    socket.on('connection_status', (status) => {
      setWaStatus(status);
      // If user connects while on whatsapp tab, they stay; if disconnected on load, show whatsapp tab
      if (status.state === 'qr_ready') {
        setActiveTab('whatsapp');
      }
    });

    socket.on('scheduler_status', (data) => {
      if (data?.schedule_time) setScheduleTime(data.schedule_time);
    });

    socket.on('contacts_synced', (contacts) => {
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

  // WhatsApp Actions
  const handleConnectWhatsApp = async () => {
    setLoadingAction(true);
    try {
      await fetch('/api/whatsapp/connect', { method: 'POST' });
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
      const res = await fetch('/api/verse/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption })
      });
      const data = await res.json();
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
    <div className="min-h-screen pb-20">
      {/* Top Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-950/50">
              <MessageCircleHeart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                Palavra do Dia
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  WhatsApp Automator
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Envio automático e diário do versículo bíblico com imagem
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick Status Clickable Badge */}
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                isConnected
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
              }`}
              title="Clique para abrir a aba do WhatsApp"
            >
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span>{isConnected ? 'WhatsApp Conectado' : 'Conectar WhatsApp'}</span>
            </button>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Anti-Ban: <strong className="text-emerald-400">Ativo</strong></span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-2">
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none pb-2">
            {/* Tab 1: WhatsApp */}
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'whatsapp'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Conexão WhatsApp</span>
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-300' : 'bg-amber-400'}`}></span>
            </button>

            {/* Tab 2: Message & Send */}
            <button
              onClick={() => setActiveTab('message')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'message'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Mensagem & Envio</span>
            </button>

            {/* Tab 3: Recipients */}
            <button
              onClick={() => setActiveTab('recipients')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'recipients'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Destinatários</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900 text-slate-300 border border-slate-700">
                {activeRecipientsCount}
              </span>
            </button>

            {/* Tab 4: Logs */}
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Histórico & Logs</span>
              {isDispatching && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* TAB 1: CONEXÃO WHATSAPP */}
        {activeTab === 'whatsapp' && (
          <div className="max-w-4xl mx-auto">
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
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
                onUploadSuccess={handleUploadSuccess}
                onRemoveImage={handleRemoveImage}
              />

              <ScheduleCard
                scheduleTime={scheduleTime}
                isDispatching={isDispatching}
                activeRecipientsCount={activeRecipientsCount}
                onUpdateSchedule={handleUpdateSchedule}
                onTriggerDispatch={handleTriggerDispatch}
              />
            </div>

            {/* Right Column: Live WhatsApp Preview */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-36">
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
          <div className="max-w-4xl mx-auto space-y-6">
            <RecipientPicker
              recipients={recipients}
              onSaveRecipients={handleSaveRecipients}
              loading={loadingAction}
            />
          </div>
        )}

        {/* TAB 4: HISTÓRICO & LOGS */}
        {activeTab === 'logs' && (
          <div className="max-w-4xl mx-auto space-y-6">
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
