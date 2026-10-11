import React, { useState } from 'react';
import { Users, Search, CheckSquare, Square, Check, Filter } from 'lucide-react';

export default function RecipientPicker({ recipients, onSaveRecipients, loading }) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'active' | 'inactive'
  const [localList, setLocalList] = useState(recipients || []);
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Sync if parent updates
  React.useEffect(() => {
    setLocalList(recipients || []);
  }, [recipients]);

  const toggleRecipient = (jid) => {
    setLocalList(prev => prev.map(r => r.jid === jid ? { ...r, active: !r.active } : r));
  };

  const selectAll = () => {
    setLocalList(prev => prev.map(r => ({ ...r, active: true })));
  };

  const deselectAll = () => {
    setLocalList(prev => prev.map(r => ({ ...r, active: false })));
  };

  const handleSave = async () => {
    await onSaveRecipients(localList);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const activeCount = localList.filter(r => r.active).length;
  const inactiveCount = localList.length - activeCount;

  const filtered = localList.filter(r => {
    const matchesSearch =
      (r.name && r.name.toLowerCase().includes(search.toLowerCase())) ||
      (r.jid && r.jid.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === 'active') return r.active;
    if (filterType === 'inactive') return !r.active;
    return true;
  });

  return (
    <div className="church-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 sm:p-8 bg-white border border-[#E8DFD3]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-3 sm:gap-3.5">
          <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#F6F1EA] text-[#8E691A] border border-[#E8DFD3]">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-display font-bold text-[#382A1E] flex items-center gap-2 flex-wrap">
              Destinatários do WhatsApp
              <span className="text-[10px] sm:text-xs font-sans font-medium px-2 sm:px-2.5 py-0.5 rounded-full bg-[#EBF7EE] text-[#2D6A4F] border border-[#C2E4C9]">
                {activeCount} de {localList.length} marcados
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-[#7A6859]">
              Espelho fiel dos contatos. Desmarque quem não deve receber e salve.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className={`flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50 w-full sm:w-auto ${
            savedFeedback
              ? 'bg-[#2D6A4F] text-white'
              : 'bg-[#382A1E] hover:bg-[#251B12] text-white'
          }`}
        >
          {savedFeedback ? <Check className="w-4 h-4" /> : null}
          {savedFeedback ? 'Salvo com Sucesso!' : 'Salvar Destinatários'}
        </button>
      </div>

      {/* Search Bar & Bulk Actions */}
      <div className="space-y-3 mb-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8E7B6C] absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por nome ou número de telefone..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8DFD3] text-xs text-[#382A1E] placeholder:text-[#A8988B] outline-none focus:border-[#C59B27] focus:bg-white shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="px-3 py-2 text-xs font-medium rounded-xl bg-[#FAF8F5] hover:bg-[#F4EFE6] text-[#382A1E] border border-[#E8DFD3] transition-all cursor-pointer shadow-xs whitespace-nowrap"
            >
              Marcar Todos
            </button>
            <button
              onClick={deselectAll}
              className="px-3 py-2 text-xs font-medium rounded-xl bg-[#FAF8F5] hover:bg-[#F4EFE6] text-[#382A1E] border border-[#E8DFD3] transition-all cursor-pointer shadow-xs whitespace-nowrap"
            >
              Desmarcar Todos
            </button>
          </div>
        </div>

        {/* Filter Pills (All / Active / Inactive) */}
        <div className="flex items-center gap-2 pt-1 text-xs">
          <span className="text-[11px] text-[#8E7B6C] flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Filtrar:
          </span>
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-[#382A1E] text-white'
                : 'bg-[#FAF8F5] text-[#7A6859] hover:bg-[#F6F1EA] border border-[#E8DFD3]'
            }`}
          >
            Todos ({localList.length})
          </button>
          <button
            onClick={() => setFilterType('active')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              filterType === 'active'
                ? 'bg-[#2D6A4F] text-white'
                : 'bg-[#FAF8F5] text-[#7A6859] hover:bg-[#F6F1EA] border border-[#E8DFD3]'
            }`}
          >
            Marcados ({activeCount})
          </button>
          <button
            onClick={() => setFilterType('inactive')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              filterType === 'inactive'
                ? 'bg-[#8E7B6C] text-white'
                : 'bg-[#FAF8F5] text-[#7A6859] hover:bg-[#F6F1EA] border border-[#E8DFD3]'
            }`}
          >
            Desmarcados ({inactiveCount})
          </button>
        </div>
      </div>

      {/* Recipients List Container */}
      <div className="rounded-2xl border border-[#E8DFD3] bg-[#FAF8F5] max-h-80 overflow-y-auto divide-y divide-[#E8DFD3]">
        {filtered.length === 0 ? (
          <div className="text-center py-12 px-4 text-xs text-[#A8988B] space-y-1">
            {localList.length === 0 ? (
              <>
                <p className="font-semibold text-[#7A6859]">Nenhum contato sincronizado ainda.</p>
                <p>Conecte o seu WhatsApp escaneando o QR Code na aba "Conexão WhatsApp" para carregar automaticamente seus contatos.</p>
              </>
            ) : (
              <p>Nenhum contato encontrado com o termo ou filtro aplicado.</p>
            )}
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.jid}
              onClick={() => toggleRecipient(item.jid)}
              className="p-3.5 flex items-center justify-between hover:bg-white cursor-pointer transition-colors select-none"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex-shrink-0">
                  {item.active ? (
                    <CheckSquare className="w-5 h-5 text-[#2D6A4F]" />
                  ) : (
                    <Square className="w-5 h-5 text-[#C5B8AB]" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#382A1E] flex items-center gap-2">
                    {item.name || item.jid.split('@')[0]}
                  </h4>
                  <p className="text-[10px] text-[#8E7B6C] font-mono">
                    {item.jid.replace('@s.whatsapp.net', '')}
                  </p>
                </div>
              </div>

              <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full transition-all ${
                item.active
                  ? 'text-[#2D6A4F] bg-[#EBF7EE] border border-[#C2E4C9]'
                  : 'text-[#8E7B6C] bg-white border border-[#E8DFD3]'
              }`}>
                {item.active ? 'Enviar Mensagem' : 'Não Enviar'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
