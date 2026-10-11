import React from 'react';
import { History, CheckCircle, XCircle, Image as ImageIcon, FileText } from 'lucide-react';

export default function DispatchLogs({ logs, liveProgress, isDispatching }) {
  return (
    <div className="church-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 sm:p-8 bg-white border border-[#E8DFD3]">
      <div className="flex items-center gap-3 sm:gap-3.5 mb-4 sm:mb-5">
        <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#F6F1EA] text-[#8E691A] border border-[#E8DFD3]">
          <History className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-display font-bold text-[#382A1E] flex items-center gap-2">
            Histórico & Logs de Envio
          </h2>
          <p className="text-[11px] sm:text-xs text-[#7A6859]">
            Acompanhe o andamento dos disparos e o registro de cada entrega
          </p>
        </div>
      </div>

      {/* Live Sending Progress Banner */}
      {isDispatching && liveProgress && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#EBF7EE] border border-[#C2E4C9] mb-4 sm:mb-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-[#2D6A4F] mb-2">
            <span>Enviando para: <strong>{liveProgress.currentRecipient || '...'}</strong></span>
            <span>{liveProgress.current} de {liveProgress.total} ({liveProgress.percentage}%)</span>
          </div>
          <div className="w-full bg-white rounded-full h-2.5 overflow-hidden border border-[#C2E4C9]">
            <div
              className="bg-[#2D6A4F] h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${liveProgress.percentage}%` }}
            ></div>
          </div>
          <p className="text-[11px] text-[#2D6A4F] mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2D6A4F] animate-pulse"></span>
            Aguardando intervalo seguro anti-bloqueio entre mensagens...
          </p>
        </div>
      )}

      {/* Logs Table */}
      <div className="rounded-2xl border border-[#E8DFD3] bg-[#FAF8F5] overflow-hidden">
        <div className="max-h-64 overflow-y-auto overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[500px]">
            <thead>
              <tr className="border-b border-[#E8DFD3] bg-[#FAF8F5] text-[#7A6859] font-semibold">
                <th className="py-3 px-4">Destinatário</th>
                <th className="py-3 px-4">Versículo</th>
                <th className="py-3 px-4">Mídia</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Horário</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DFD3] text-[#382A1E] bg-white">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-[#A8988B] bg-[#FAF8F5]">
                    Nenhum disparo registrado ainda.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const dateFormatted = log.created_at
                    ? new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : '--:--';

                  return (
                    <tr key={log.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3 px-4 font-medium text-[#382A1E]">
                        {log.recipient_name || log.recipient_jid}
                      </td>
                      <td className="py-3 px-4 text-[#8E691A] font-semibold">
                        {log.verse_ref || 'Versículo'}
                      </td>
                      <td className="py-3 px-4">
                        {log.has_image ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#7A6859]">
                            <ImageIcon className="w-3.5 h-3.5 text-[#C59B27]" /> Imagem
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#A8988B]">
                            <FileText className="w-3.5 h-3.5" /> Texto
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {log.status === 'success' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#2D6A4F] bg-[#EBF7EE] border border-[#C2E4C9] px-2 py-0.5 rounded-full font-medium">
                            <CheckCircle className="w-3 h-3" /> Enviado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#B93838] bg-[#FDF2F2] border border-[#F5CACA] px-2 py-0.5 rounded-full font-medium" title={log.error_message}>
                            <XCircle className="w-3 h-3" /> Falha
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#8E7B6C] font-mono text-[11px]">
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
