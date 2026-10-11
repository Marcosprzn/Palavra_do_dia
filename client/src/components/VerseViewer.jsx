import React, { useState } from 'react';
import { BookOpen, Dices, Search, MessageSquare, Check, X } from 'lucide-react';

export default function VerseViewer({
  verseData,
  caption,
  onRoll,
  onSelectVerse,
  onUpdateCaption,
  loading
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [captionInput, setCaptionInput] = useState(caption || '');
  const [savedCaptionFeedback, setSavedCaptionFeedback] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearching(true);
    try {
      const res = await fetch(`/api/verse/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error('Erro na busca de versículos:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (v) => {
    onSelectVerse(v);
    setSearchOpen(false);
  };

  const handleSaveCaption = async () => {
    await onUpdateCaption(captionInput);
    setSavedCaptionFeedback(true);
    setTimeout(() => setSavedCaptionFeedback(false), 2000);
  };

  const currentVerse = verseData?.verse;

  return (
    <div className="church-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 sm:p-8 bg-white border border-[#E8DFD3]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-3 sm:gap-3.5">
          <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#F6F1EA] text-[#8E691A] border border-[#E8DFD3]">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-display font-bold text-[#382A1E] flex items-center gap-2 flex-wrap">
              Versículo do Dia
              {currentVerse?.theme && (
                <span className="text-[10px] sm:text-[11px] font-sans font-semibold px-2 sm:px-2.5 py-0.5 rounded-full bg-[#F5EDE0] text-[#8E691A] border border-[#E8D9BD]">
                  {currentVerse.theme}
                </span>
              )}
            </h2>
            <p className="text-[11px] sm:text-xs text-[#7A6859]">
              Palavra sagrada selecionada para os envios de hoje
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onRoll}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#FAF8F5] hover:bg-[#F4EFE6] text-[#382A1E] border border-[#E8DFD3] transition-all cursor-pointer disabled:opacity-50 shadow-xs"
            title="Sortear outro versículo aleatório"
          >
            <Dices className={`w-4 h-4 text-[#C59B27] ${loading ? 'animate-spin' : ''}`} />
            Sortear Outro
          </button>

          <button
            onClick={() => {
              setSearchOpen(true);
              if (searchResults.length === 0) {
                fetch('/api/verse/search?q=').then(r => r.json()).then(setSearchResults);
              }
            }}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#F5EDE0] hover:bg-[#EFE3CF] text-[#8E691A] border border-[#E8D9BD] transition-all cursor-pointer shadow-xs"
          >
            <Search className="w-4 h-4" />
            Buscar
          </button>
        </div>
      </div>

      {/* Main Verse Card Display - Parchment / Warm Devotional Card */}
      <div className="scripture-card rounded-2xl p-4 sm:p-6 sm:p-7 mb-5 sm:mb-6 relative border border-[#E4D8C5]">
        <div className="text-[#9A7718] font-bold text-xs sm:text-sm tracking-wide mb-2.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5 sm:gap-2">
            <BookOpen className="w-4 h-4 text-[#8E691A]" />
            <span className="font-sans uppercase text-xs tracking-wider font-semibold">
              {currentVerse?.reference || 'Carregando versículo...'}
            </span>
          </span>
          <span className="text-[10px] text-[#A8988B] font-sans hidden xs:inline">Almeida Revista e Corrigida</span>
        </div>
        <p className="text-base sm:text-lg text-[#382A1E] leading-relaxed font-serif italic selection:bg-[#F5EDE0]">
          "{currentVerse?.text || 'Buscando a palavra de Deus...'}"
        </p>
      </div>

      {/* Custom Caption / Greeting Textarea */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-[#382A1E] flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-[#8E7B6C]" />
            Saudação / Mensagem Personalizada (Opcional):
          </span>
          <span className="text-[11px] text-[#8E7B6C] font-normal">
            Enviada antes do versículo no WhatsApp
          </span>
        </label>
        <div className="relative">
          <textarea
            value={captionInput}
            onChange={(e) => setCaptionInput(e.target.value)}
            placeholder="Ex: Que a paz do Senhor Jesus esteja com você e sua família nesta manhã abençoada."
            rows={2}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8DFD3] focus:border-[#C59B27] focus:bg-white text-xs text-[#382A1E] placeholder:text-[#A8988B] resize-none outline-none transition-all shadow-xs"
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleSaveCaption}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs ${
              savedCaptionFeedback
                ? 'bg-[#2D6A4F] text-white'
                : 'bg-[#382A1E] hover:bg-[#251B12] text-white'
            }`}
          >
            {savedCaptionFeedback ? <Check className="w-3.5 h-3.5" /> : null}
            {savedCaptionFeedback ? 'Salvo!' : 'Salvar Saudação'}
          </button>
        </div>
      </div>

      {/* Verse Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-[#382A1E]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8DFD3] rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-xl">
            <div className="p-5 border-b border-[#E8DFD3] flex items-center justify-between">
              <h3 className="font-display font-bold text-[#382A1E] text-base flex items-center gap-2">
                <Search className="w-4 h-4 text-[#8E691A]" />
                Buscar Versículo na Bíblia
              </h3>
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1 rounded-xl text-[#7A6859] hover:text-[#382A1E] hover:bg-[#FAF8F5] transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSearch} className="p-4 border-b border-[#E8DFD3] flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar por tema, livro ou termo (ex: amor, fé, esperança, Salmos)..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8DFD3] text-xs text-[#382A1E] placeholder:text-[#A8988B] outline-none focus:border-[#C59B27] focus:bg-white"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#382A1E] hover:bg-[#251B12] text-white text-xs font-semibold rounded-xl cursor-pointer transition-all shadow-xs"
              >
                Buscar
              </button>
            </form>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {searching ? (
                <div className="text-center py-8 text-xs text-[#7A6859]">Pesquisando nas sagradas escrituras...</div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#A8988B]">Nenhum versículo encontrado para essa pesquisa.</div>
              ) : (
                searchResults.map((v) => (
                  <div
                    key={v.id || v.reference}
                    onClick={() => handleSelect(v)}
                    className="p-3.5 rounded-2xl bg-[#FAF8F5] hover:bg-[#F5EDE0] border border-[#E8DFD3] hover:border-[#E8D9BD] cursor-pointer transition-all group shadow-xs"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-[#8E691A] group-hover:text-[#6D5114]">
                        {v.reference}
                      </span>
                      {v.theme && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-[#7A6859] border border-[#E8DFD3]">
                          {v.theme}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#382A1E] font-serif italic line-clamp-2 leading-relaxed">
                      "{v.text}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
