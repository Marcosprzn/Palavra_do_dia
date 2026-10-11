import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Sparkles, MessageCircleHeart, ShieldCheck } from 'lucide-react';

import WhatsAppCard from './components/WhatsAppCard';
import VerseViewer from './components/VerseViewer';
import ImageAttachment from './components/ImageAttachment';
import LiveWhatsAppPreview from './components/LiveWhatsAppPreview';
import ScheduleCard from './components/ScheduleCard';
import RecipientPicker from './components/RecipientPicker';
import DispatchLogs from './components/DispatchLogs';

export default function App() {
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
      if (statusData.whatsapp) setWaStatus(statusData.whatsapp);
      if (statusData.scheduler?.schedule_time) setScheduleTime(statusData.scheduler.schedule_time);

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

  const activeRecipientsCount = recipients.filter(r => r.active).length;

  return (
    <div className="min-h-screen pb-16">
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

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Proteção Anti-Ban:</span>
              <span className="text-emerald-400 font-bold">Ativa</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Controls and Settings (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* WhatsApp Connection Card */}
            <WhatsAppCard
              status={waStatus}
              onConnect={handleConnectWhatsApp}
              onLogout={handleLogoutWhatsApp}
              loading={loadingAction}
            />

            {/* Verse Selection & Custom Greeting */}
            <VerseViewer
              verseData={verseData}
              caption={verseData?.custom_caption}
              onRoll={handleRollVerse}
              onSelectVerse={handleSelectVerse}
              onUpdateCaption={handleUpdateCaption}
              loading={loadingAction}
            />

            {/* Manual Image Attachment */}
            <ImageAttachment
              imagePath={verseData?.image_path}
              onUploadSuccess={handleUploadSuccess}
              onRemoveImage={handleRemoveImage}
            />

            {/* Schedule & Immediate Dispatch */}
            <ScheduleCard
              scheduleTime={scheduleTime}
              isDispatching={isDispatching}
              activeRecipientsCount={activeRecipientsCount}
              onUpdateSchedule={handleUpdateSchedule}
              onTriggerDispatch={handleTriggerDispatch}
            />

            {/* Recipients Picker */}
            <RecipientPicker
              recipients={recipients}
              onSaveRecipients={handleSaveRecipients}
              loading={loadingAction}
            />
          </div>

          {/* Right Column: Live WhatsApp Preview & Dispatch History (5 cols) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
            {/* Live WhatsApp Preview */}
            <LiveWhatsAppPreview
              verseData={verseData}
              caption={verseData?.custom_caption}
              imagePath={verseData?.image_path}
            />

            {/* Live Dispatch Logs */}
            <DispatchLogs
              logs={logs}
              liveProgress={liveProgress}
              isDispatching={isDispatching}
            />
          </div>

        </div>
      </main>
    </div>
  );
}
