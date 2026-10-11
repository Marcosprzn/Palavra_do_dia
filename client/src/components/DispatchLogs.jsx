import React from 'react';
import { History, CheckCircle, XCircle, Image as ImageIcon, FileText } from 'lucide-react';

export default function DispatchLogs({ logs, liveProgress, isDispatching }) {
  return (
    <div className="glass-panel rounded-2xl p-6 relative">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
          <History className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Histórico & Logs de Envio
          </h2>
          <p className="text-xs text-slate-400">
            Acompanhe em tempo real o progresso dos disparos e o status de entrega
          </p>
        </div>
      </div>

      {/* Live Sending Progress Banner */}
      {isDispatching && liveProgress && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 mb-4 animate-pulse-subtle">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-300 mb-2">
            <span>Enviando para: <strong>{liveProgress.currentRecipient || '...'}</strong></span>
            <span>{liveProgress.current} de {liveProgress.total} ({liveProgress.percentage}%)</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${liveProgress.percentage}%` }}
            ></div>
          </div>
          <p className="text-[11px] text-emerald-400/80 mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            Aguardando intervalo seguro humanizado anti-ban entre disparos...
          </p>
        </div>
      )}

      {/* Logs Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
        <div className="max-h-56 overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Destinatário</th>
                <th className="py-2.5 px-3">Versículo</th>
                <th className="py-2.5 px-3">Mídia</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Horário</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-slate-300">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500">
                    Nenhum disparo registrado ainda.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const dateFormatted = log.created_at
                    ? new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : '--:--';

                  return (
                    <tr key={log.id} className="hover:bg-slate-900/40">
                      <td className="py-2.5 px-3 font-medium text-slate-100">
                        {log.recipient_name || log.recipient_jid}
                      </td>
                      <td className="py-2.5 px-3 text-emerald-400 font-semibold">
                        {log.verse_ref || 'Versículo'}
                      </td>
                      <td className="py-2.5 px-3">
                        {log.has_image ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-sky-400">
                            <ImageIcon className="w-3 h-3" /> Imagem
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                            <FileText className="w-3 h-3" /> Texto
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {log.status === 'success' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                            <CheckCircle className="w-3.5 h-3.5" /> Enviado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-400 font-medium" title={log.error_message}>
                            <XCircle className="w-3.5 h-3.5" /> Falha
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                        {dateFormatted}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
