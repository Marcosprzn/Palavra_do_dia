import React from 'react';
import { Eye, CheckCheck, MoreVertical, Phone, Video, ArrowLeft } from 'lucide-react';

export default function LiveWhatsAppPreview({ verseData, caption, imagePath }) {
  const currentVerse = verseData?.verse;
  const now = new Date();
  const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const resolvedImageUrl = imagePath
    ? (imagePath.startsWith('/') ? imagePath : `/${imagePath.replace(/\\/g, '/')}`)
    : null;

  return (
    <div className="glass-panel rounded-2xl p-6 relative flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Eye className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Pré-visualização ao Vivo
          </h2>
          <p className="text-xs text-slate-400">
            Veja exatamente como a mensagem chegará no WhatsApp dos seus contatos
          </p>
        </div>
      </div>

      {/* Simulated Phone WhatsApp Container */}
      <div className="rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-[#0b141a] flex flex-col flex-1 max-w-sm mx-auto w-full">
        {/* WhatsApp Chat Header */}
        <div className="bg-[#202c33] px-3.5 py-2.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <ArrowLeft className="w-4 h-4 text-slate-400" />
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
              ✝️
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-100">Palavra do Dia</h4>
              <p className="text-[10px] text-emerald-400 font-medium">online</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <Video className="w-3.5 h-3.5" />
            <Phone className="w-3.5 h-3.5" />
            <MoreVertical className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* WhatsApp Chat Body */}
        <div
          className="p-4 flex-1 flex flex-col justify-end min-h-[300px]"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px)`,
            backgroundSize: '16px 16px',
            backgroundColor: '#0b141a'
          }}
        >
          {/* Outgoing Message Bubble */}
          <div className="self-end max-w-[92%] rounded-2xl rounded-tr-none bg-[#005c4b] text-slate-100 shadow-md overflow-hidden text-xs">
            {/* Attached Image inside bubble */}
            {resolvedImageUrl && (
              <div className="p-1">
                <img
                  src={resolvedImageUrl}
                  alt="Anexo de Imagem"
                  className="w-full rounded-xl object-cover max-h-56"
                  onError={(e) => {
                    const fn = imagePath.split(/[\\/]/).pop();
                    e.target.src = `/uploads/${fn}`;
                  }}
                />
              </div>
            )}

            {/* Caption & Verse Content */}
            <div className="p-3">
              {caption && caption.trim() !== '' && (
                <p className="mb-2.5 text-slate-100 whitespace-pre-wrap leading-relaxed">
                  {caption}
                </p>
              )}

              {currentVerse && (
                <div className="space-y-1">
                  <p className="font-bold text-emerald-200">
                    📖 {currentVerse.reference}
                  </p>
                  <p className="italic text-slate-100 leading-relaxed font-serif">
                    "{currentVerse.text}"
                  </p>
                </div>
              )}

              <p className="mt-2 text-[11px] text-emerald-300 font-medium">
                ✨ <em>Palavra do Dia</em>
              </p>

              {/* Message Timestamp & Double Blue Ticks */}
              <div className="flex items-center justify-end gap-1 mt-1.5 text-[10px] text-slate-300">
                <span>{timeString}</span>
                <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
