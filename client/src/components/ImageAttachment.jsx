import React, { useRef, useState } from 'react';
import { Image as ImageIcon, UploadCloud, Trash2, Eye, CheckCircle2 } from 'lucide-react';

export default function ImageAttachment({ imagePath, onUploadSuccess, onRemoveImage }) {
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
    <div className="glass-panel rounded-2xl p-6 relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Anexo de Imagem
              {imagePath && (
                <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" /> Anexada
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              Anexe uma imagem para acompanhar o versículo como legenda no WhatsApp
            </p>
          </div>
        </div>

        {imagePath && (
          <button
            onClick={onRemoveImage}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remover
          </button>
        )}
      </div>

      {imagePath ? (
        <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900 group">
          <img
            src={imagePath.startsWith('/') ? imagePath : `/${imagePath.replace(/\\/g, '/')}`}
            alt="Imagem Anexada"
            className="w-full h-48 object-cover rounded-xl"
            onError={(e) => {
              // Fallback if full local path
              const filename = imagePath.split(/[\\/]/).pop();
              e.target.src = `/uploads/${filename}`;
            }}
          />
          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium border border-slate-600 transition-all"
            >
              Trocar Imagem
            </button>
            <button
              onClick={onRemoveImage}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium transition-all"
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
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
            dragOver
              ? 'border-emerald-500 bg-emerald-500/5'
              : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'
          }`}
        >
          <div className="p-3.5 rounded-full bg-slate-800/80 text-slate-400 mb-3 group-hover:text-emerald-400 transition-colors">
            <UploadCloud className={`w-6 h-6 ${uploading ? 'animate-bounce text-emerald-400' : ''}`} />
          </div>
          <p className="text-xs font-semibold text-slate-200 mb-1">
            {uploading ? 'Enviando imagem...' : 'Clique para selecionar ou arraste uma imagem aqui'}
          </p>
          <p className="text-[11px] text-slate-500">
            Formatos suportados: JPG, PNG, WEBP (Máx. 15MB)
          </p>
        </div>
      )}

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
