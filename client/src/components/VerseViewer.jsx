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
    <div className="glass-panel rounded-2xl p-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Versículo do Dia
              {currentVerse?.theme && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {currentVerse.theme}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              Sorteado automaticamente ou selecionado manualmente para os envios de hoje
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRoll}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
            title="Sortear outro versículo aleatório"
          >
            <Dices className={`w-4 h-4 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
            Sortear Outro
          </button>

          <button
            onClick={() => {
              setSearchOpen(true);
              if (searchResults.length === 0) {
                fetch('/api/verse/search?q=').then(r => r.json()).then(setSearchResults);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-all cursor-pointer"
          >
            <Search className="w-4 h-4" />
            Buscar
          </button>
        </div>
      </div>

      {/* Main Verse Card Display */}
      <div className="p-5 rounded-xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-800/40 border border-slate-800 mb-5 relative">
        <div className="text-emerald-400 font-bold text-sm tracking-wide mb-2 flex items-center gap-2">
          <span>📖</span>
          <span>{currentVerse?.reference || 'Carregando versículo...'}</span>
        </div>
        <p className="text-base text-slate-200 leading-relaxed italic font-serif">
          "{currentVerse?.text || 'Buscando a palavra de Deus...'}"
        </p>
      </div>

      {/* Custom Caption / Greeting Textarea */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
            Mensagem / Saudação Personalizada (Opcional):
          </span>
          <span className="text-[11px] text-slate-400 font-normal">
            Aparece acima do versículo no WhatsApp
          </span>
        </label>
        <div className="relative">
          <textarea
            value={captionInput}
            onChange={(e) => setCaptionInput(e.target.value)}
            placeholder="Ex: Bom dia abençoado a todos! Que o seu dia seja repleto de paz e vitórias."
            rows={2}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-slate-100 placeholder:text-slate-500 resize-none outline-none transition-all"
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleSaveCaption}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              savedCaptionFeedback
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            {savedCaptionFeedback ? <Check className="w-3.5 h-3.5" /> : null}
            {savedCaptionFeedback ? 'Salvo!' : 'Salvar Saudação'}
          </button>
        </div>
      </div>

      {/* Verse Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Search className="w-4 h-4 text-indigo-400" />
                Buscar Versículo na Bíblia
              </h3>
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSearch} className="p-4 border-b border-slate-800/80 flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar por tema, livro ou palavra (ex: amor, paz, Salmos)..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 outline-none focus:border-indigo-500"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
              >
                Buscar
              </button>
            </form>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {searching ? (
                <div className="text-center py-8 text-xs text-slate-400">Pesquisando versículos...</div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">Nenhum versículo encontrado para essa busca.</div>
              ) : (
                searchResults.map((v) => (
                  <div
                    key={v.id || v.reference}
                    onClick={() => handleSelect(v)}
                    className="p-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-indigo-500/50 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-indigo-400 group-hover:text-indigo-300">
                        {v.reference}
                      </span>
                      {v.theme && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                          {v.theme}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 italic line-clamp-2">
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
