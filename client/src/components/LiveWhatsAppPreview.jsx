import React from 'react';
import { Eye, CheckCheck, MoreVertical, Phone, Video, ArrowLeft, BookOpen } from 'lucide-react';
import ChurchCross from './icons/ChurchCross';

export default function LiveWhatsAppPreview({ verseData, caption, imagePath }) {
  const currentVerse = verseData?.verse;
  const now = new Date();
  const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const resolvedImageUrl = imagePath
    ? (imagePath.startsWith('/') ? imagePath : `/${imagePath.replace(/\\/g, '/')}`)
    : null;

  return (
    <div className="church-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 sm:p-8 bg-white border border-[#E8DFD3] flex flex-col">
      <div className="flex items-center gap-3 sm:gap-3.5 mb-4 sm:mb-5">
        <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#F6F1EA] text-[#8E691A] border border-[#E8DFD3]">
          <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-display font-bold text-[#382A1E] flex items-center gap-2">
            Pré-visualização
          </h2>
          <p className="text-[11px] sm:text-xs text-[#7A6859]">
            Exibição no WhatsApp dos destinatários
          </p>
        </div>
      </div>

      {/* Simulated Phone WhatsApp Container - Authentic WhatsApp Chat in Light Theme */}
      <div className="rounded-2xl sm:rounded-3xl overflow-hidden border border-[#E8DFD3] shadow-sm bg-[#EFEAE2] flex flex-col flex-1 max-w-sm mx-auto w-full">
        {/* WhatsApp Chat Header */}
        <div className="bg-[#008069] px-3 sm:px-3.5 py-2.5 sm:py-3 flex items-center justify-between text-white shadow-xs">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <ArrowLeft className="w-4 h-4 text-white/90" />
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center text-white border border-white/30">
              <ChurchCross className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white leading-tight">Palavra do Dia</h4>
              <p className="text-[10px] text-white/80 font-normal">online</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-white/90">
            <Video className="w-3.5 h-3.5" />
            <Phone className="w-3.5 h-3.5" />
            <MoreVertical className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* WhatsApp Chat Body */}
        <div
          className="p-3.5 flex-1 flex flex-col justify-end min-h-[340px]"
          style={{
            backgroundImage: `radial-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px)`,
            backgroundSize: '16px 16px',
            backgroundColor: '#EFEAE2'
          }}
        >
          {/* Outgoing Message Bubble (WhatsApp Authentic Light Green Bubble: #E7FFDB) */}
          <div className="self-end max-w-[94%] rounded-2xl rounded-tr-none bg-[#E7FFDB] text-[#111B21] shadow-xs overflow-hidden text-xs border border-[#D5F0C6]">
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
              {/* Saudação matinal */}
              {!/^bom\s*dia/i.test((caption || '').trim()) && (
                <p className="mb-2 text-[#111B21] font-semibold text-xs flex items-center gap-1">
                  <span>☀️</span>
                  <span>Bom dia!</span>
                </p>
              )}

              {caption && caption.trim() !== '' && (
                <p className="mb-2.5 text-[#111B21] whitespace-pre-wrap leading-relaxed text-xs">
                  {caption}
                </p>
              )}

              {currentVerse && (
                <div className="space-y-1">
                  <p className="font-bold text-[#008069] text-xs">
                    📖 {currentVerse.reference}
                  </p>
                  <p className="italic text-[#111B21] leading-relaxed font-serif text-[13px]">
                    "{currentVerse.text}"
                  </p>
                </div>
              )}

              <p className="mt-2.5 text-[11px] text-[#008069] font-medium">
                ✨ <em>Palavra do Dia</em>
              </p>

              {/* Message Timestamp & Double Blue Ticks */}
              <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-[#667781]">
                <span>{timeString}</span>
                <CheckCheck className="w-3.5 h-3.5 text-[#53BDEB]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
