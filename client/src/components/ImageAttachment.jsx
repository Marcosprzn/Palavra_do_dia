import React, { useRef, useState } from 'react';
import { Image as ImageIcon, UploadCloud, Trash2, CheckCircle2, Lock, Unlock } from 'lucide-react';

export default function ImageAttachment({
  imagePath,
  keepImageAttached,
  onUploadSuccess,
  onRemoveImage,
  onToggleKeepImage
}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const uploadFile = async (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem (JPG, PNG, WEBP).');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        onUploadSuccess(data.fileUrl || data.filePath);
      } else {
        alert(data.error || 'Erro ao fazer upload da imagem.');
      }
    } catch (err) {
      console.error('Erro no upload da imagem:', err);
      alert('Falha na comunicação ao enviar imagem.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  return (
    <div className="church-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 sm:p-8 bg-white border border-[#E8DFD3]">
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div className="flex items-center gap-3 sm:gap-3.5">
          <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#F6F1EA] text-[#8E691A] border border-[#E8DFD3]">
            <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-display font-bold text-[#382A1E] flex items-center gap-2 flex-wrap">
              Anexo de Imagem
              {imagePath && (
                <span className="flex items-center gap-1 text-[11px] font-sans font-medium px-2.5 py-0.5 rounded-full bg-[#EBF7EE] text-[#2D6A4F] border border-[#C2E4C9]">
                  <CheckCircle2 className="w-3 h-3" /> Anexada
                </span>
              )}
            </h2>
            <p className="text-xs text-[#7A6859]">
              Anexe uma imagem para acompanhar a mensagem como legenda no WhatsApp
            </p>
          </div>
        </div>

        {imagePath && (
          <button
            onClick={onRemoveImage}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#FDF2F2] hover:bg-[#FCE8E8] text-[#B93838] border border-[#F5CACA] transition-all cursor-pointer shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remover
          </button>
        )}
      </div>

      {imagePath ? (
        <div className="relative rounded-2xl overflow-hidden border border-[#E8DFD3] bg-[#FAF8F5] group shadow-xs">
          <img
            src={imagePath.startsWith('/') ? imagePath : `/${imagePath.replace(/\\/g, '/')}`}
            alt="Imagem Anexada"
            className="w-full h-52 object-cover rounded-2xl transition-transform duration-300 group-hover:scale-[1.01]"
            onError={(e) => {
              const filename = imagePath.split(/[\\/]/).pop();
              e.target.src = `/uploads/${filename}`;
            }}
          />
          <div className="absolute inset-0 bg-[#382A1E]/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-xs">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-white text-[#382A1E] rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer hover:bg-[#FAF8F5]"
            >
              Trocar Imagem
            </button>
            <button
              onClick={onRemoveImage}
              className="px-4 py-2 bg-[#B93838] hover:bg-[#9E2A2A] text-white rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              Excluir
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
            dragOver
              ? 'border-[#C59B27] bg-[#FDF9EF]'
              : 'border-[#E0D5C7] hover:border-[#C59B27] bg-[#FAF8F5] hover:bg-[#F6F1EA]'
          }`}
        >
          <div className="p-3.5 rounded-2xl bg-white text-[#8E691A] border border-[#E8DFD3] mb-3 shadow-xs">
            <UploadCloud className={`w-6 h-6 ${uploading ? 'animate-bounce text-[#C59B27]' : ''}`} />
          </div>
          <p className="text-xs font-semibold text-[#382A1E] mb-1">
            {uploading ? 'Enviando imagem...' : 'Clique para selecionar ou arraste uma foto aqui'}
          </p>
          <p className="text-[11px] text-[#A8988B]">
            Formatos aceitos: JPG, PNG, WEBP (Devocional / Imagem da Igreja)
          </p>
        </div>
      )}

      {/* Lock / Auto-Delete Setting Toggle (Apple-style switch) */}
      <div className="mt-5 p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8DFD3] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`p-2.5 rounded-xl border transition-colors ${
            keepImageAttached
              ? 'bg-[#FFF8EA] text-[#A27318] border-[#F0DCB3]'
              : 'bg-white text-[#7A6859] border-[#E8DFD3]'
          }`}>
            {keepImageAttached ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#382A1E] flex items-center gap-2">
              {keepImageAttached ? 'Imagem Travada / Fixa' : 'Trocar Imagem Todo Dia'}
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                keepImageAttached
                  ? 'bg-[#FFF8EA] text-[#A27318] border border-[#F0DCB3]'
                  : 'bg-[#EBF7EE] text-[#2D6A4F] border border-[#C2E4C9]'
              }`}>
                {keepImageAttached ? 'Fixa em todos os envios' : 'Excluir após envio diário'}
              </span>
            </h4>
            <p className="text-[11px] text-[#7A6859] mt-0.5">
              {keepImageAttached
                ? 'A mesma imagem permanecerá em todos os envios futuros.'
                : 'A imagem é apagada automaticamente após o disparo para você anexar a nova foto do dia seguinte.'}
            </p>
          </div>
        </div>

        {/* Apple-style Toggle Switch */}
        <button
          type="button"
          onClick={() => onToggleKeepImage(!keepImageAttached)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            keepImageAttached ? 'bg-[#C59B27]' : 'bg-[#D9CFC4]'
          }`}
          title="Alternar entre travar imagem ou excluir automaticamente após o envio"
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
              keepImageAttached ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
