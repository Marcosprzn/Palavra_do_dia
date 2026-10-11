import React, { useState } from 'react';
import { Clock, Send, Check, AlertTriangle } from 'lucide-react';

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
    <div className="church-card rounded-3xl p-6 sm:p-8 bg-white border border-[#E8DFD3]">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-[#F6F1EA] text-[#8E691A] border border-[#E8DFD3]">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold text-[#382A1E] flex items-center gap-2">
              Horário & Disparo
            </h2>
            <p className="text-xs text-[#7A6859]">
              Configure o horário diário automático ou execute um envio agora mesmo
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
        {/* Daily Schedule Configuration */}
        <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8DFD3] space-y-3 flex flex-col justify-between">
          <div>
            <label className="text-xs font-semibold text-[#382A1E] block mb-1">
              Horário do Envio Automático Diário:
            </label>
            <p className="text-[11px] text-[#7A6859]">
              Dispara todos os dias sem precisar manter o navegador aberto.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="time"
              value={timeInput}
              onChange={(e) => setTimeInput(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-white border border-[#E8DFD3] text-[#382A1E] font-mono text-sm outline-none focus:border-[#C59B27] shadow-xs"
            />
            <button
              onClick={handleSave}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs ${
                savedFeedback
                  ? 'bg-[#2D6A4F] text-white'
                  : 'bg-white hover:bg-[#F6F1EA] text-[#382A1E] border border-[#E8DFD3]'
              }`}
            >
              {savedFeedback ? <Check className="w-4 h-4" /> : null}
              {savedFeedback ? 'Salvo!' : 'Salvar'}
            </button>
          </div>
        </div>

        {/* Immediate Dispatch Button */}
        <div className="p-5 rounded-2xl bg-[#FDFBF7] border border-[#E8DFD3] space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8E691A]">Envio Imediato:</span>
            <span className="text-[11px] text-[#7A6859]">
              {activeRecipientsCount} contato(s) ativo(s)
            </span>
          </div>

          <p className="text-[11px] text-[#7A6859]">
            Envie a mensagem agora mesmo com intervalo anti-ban para a lista.
          </p>

          <button
            onClick={() => setConfirmModal(true)}
            disabled={isDispatching || activeRecipientsCount === 0}
            className="w-full py-3 px-4 rounded-xl bg-[#382A1E] hover:bg-[#251B12] text-white font-semibold text-xs tracking-wide shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDispatching ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Enviando mensagens...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-[#C59B27]" />
                Disparar Agora (Manual)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-[#382A1E]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8DFD3] rounded-3xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-3 text-[#A27318] mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-base text-[#382A1E]">Confirmar Disparo Manual?</h3>
            </div>
            <p className="text-xs text-[#7A6859] leading-relaxed mb-4">
              Você está prestes a enviar o versículo do dia para <strong>{activeRecipientsCount}</strong> contatos selecionados. As mensagens serão enviadas de forma individual e com intervalo humanizado anti-bloqueio.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#FAF8F5] hover:bg-[#F4EFE6] text-[#7A6859] border border-[#E8DFD3] transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDispatch}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#382A1E] hover:bg-[#251B12] text-white transition-all cursor-pointer shadow-xs"
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
