import React, { useState } from 'react';
import { Clock, Send, Check, Play, AlertTriangle } from 'lucide-react';

export default function ScheduleCard({
  scheduleTime,
  isDispatching,
  activeRecipientsCount,
  onUpdateSchedule,
  onTriggerDispatch
}) {
  const [timeInput, setTimeInput] = useState(scheduleTime || '06:00');
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);

  const handleSave = async () => {
    await onUpdateSchedule(timeInput);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleConfirmDispatch = () => {
    setConfirmModal(false);
    onTriggerDispatch();
  };

  return (
    <div className="glass-panel rounded-2xl p-6 relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Horário & Disparo
            </h2>
            <p className="text-xs text-slate-400">
              Configure o horário diário automático ou execute um envio agora mesmo
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        {/* Daily Schedule Configuration */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">
            Horário do Envio Automático Diário:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={timeInput}
              onChange={(e) => setTimeInput(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm outline-none focus:border-amber-500"
            />
            <button
              onClick={handleSave}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                savedFeedback
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {savedFeedback ? <Check className="w-4 h-4" /> : null}
              {savedFeedback ? 'Salvo!' : 'Salvar Horário'}
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Padrão <strong>06:00</strong> da manhã. Dispara todos os dias sem precisar abrir o app.
          </p>
        </div>

        {/* Immediate Dispatch Button */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-900/60 border border-emerald-500/30 space-y-2 flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400">Envio Imediato:</span>
            <span className="text-[11px] text-slate-400">
              {activeRecipientsCount} destinatário(s) selecionado(s)
            </span>
          </div>

          <button
            onClick={() => setConfirmModal(true)}
            disabled={isDispatching || activeRecipientsCount === 0}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDispatching ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Enviando mensagens...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Disparar Agora (Manual)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-base text-white">Confirmar Disparo Manual?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Você está prestes a enviar o versículo do dia para <strong>{activeRecipientsCount}</strong> contatos selecionados. As mensagens serão enviadas com intervalo humanizado seguro anti-ban.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDispatch}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Sim, Iniciar Envio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
