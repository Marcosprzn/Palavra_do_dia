import React, { useState } from 'react';
import { Users, Search, CheckSquare, Square, Check } from 'lucide-react';

export default function RecipientPicker({ recipients, onSaveRecipients, loading }) {
  const [search, setSearch] = useState('');
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

  const filtered = localList.filter(r =>
    (r.name && r.name.toLowerCase().includes(search.toLowerCase())) ||
    (r.jid && r.jid.toLowerCase().includes(search.toLowerCase()))
  );

  const activeCount = localList.filter(r => r.active).length;

  return (
    <div className="church-card rounded-3xl p-6 sm:p-8 bg-white border border-[#E8DFD3]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-[#F6F1EA] text-[#8E691A] border border-[#E8DFD3]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold text-[#382A1E] flex items-center gap-2">
              Destinatários do Envio
              <span className="text-xs font-sans font-medium px-2.5 py-0.5 rounded-full bg-[#FAF8F5] text-[#7A6859] border border-[#E8DFD3]">
                {activeCount} de {localList.length} ativos
              </span>
            </h2>
            <p className="text-xs text-[#7A6859]">
              Contatos individuais cadastrados (grupos do WhatsApp são bloqueados automaticamente).
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50 ${
            savedFeedback
              ? 'bg-[#2D6A4F] text-white'
              : 'bg-[#382A1E] hover:bg-[#251B12] text-white'
          }`}
        >
          {savedFeedback ? <Check className="w-4 h-4" /> : null}
          {savedFeedback ? 'Salvo!' : 'Salvar Destinatários'}
        </button>
      </div>

      {/* Search and Quick Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8E7B6C] absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou número..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8DFD3] text-xs text-[#382A1E] placeholder:text-[#A8988B] outline-none focus:border-[#C59B27] focus:bg-white shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={selectAll}
            className="px-3 py-2 text-xs font-medium rounded-xl bg-[#FAF8F5] hover:bg-[#F4EFE6] text-[#382A1E] border border-[#E8DFD3] transition-all cursor-pointer shadow-xs"
          >
            Selecionar Todos
          </button>
          <button
            onClick={deselectAll}
            className="px-3 py-2 text-xs font-medium rounded-xl bg-[#FAF8F5] hover:bg-[#F4EFE6] text-[#382A1E] border border-[#E8DFD3] transition-all cursor-pointer shadow-xs"
          >
            Desmarcar Todos
          </button>
        </div>
      </div>

      {/* Recipients List Container */}
      <div className="rounded-2xl border border-[#E8DFD3] bg-[#FAF8F5] max-h-72 overflow-y-auto divide-y divide-[#E8DFD3]">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-xs text-[#A8988B]">
            {localList.length === 0
              ? 'Nenhum contato sincronizado ainda. Conecte o WhatsApp para sincronizar sua lista.'
              : 'Nenhum destinatário encontrado com esse filtro.'}
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.jid}
              onClick={() => toggleRecipient(item.jid)}
              className="p-3.5 flex items-center justify-between hover:bg-white cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="text-[#382A1E]">
                  {item.active ? (
                    <CheckSquare className="w-4 h-4 text-[#2D6A4F]" />
                  ) : (
                    <Square className="w-4 h-4 text-[#C5B8AB]" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#382A1E] flex items-center gap-2">
                    {item.name || item.jid.split('@')[0]}
                    <span className={`text-[10px] px-2 py-0.2 rounded-full font-medium ${
                      item.type === 'group'
                        ? 'bg-[#FFF8EA] text-[#A27318] border border-[#F0DCB3]'
                        : 'bg-white text-[#7A6859] border border-[#E8DFD3]'
                    }`}>
                      {item.type === 'group' ? 'Grupo' : 'Contato'}
                    </span>
                  </h4>
                  <p className="text-[10px] text-[#8E7B6C] font-mono">
                    {item.jid.replace('@s.whatsapp.net', '').replace('@g.us', ' (ID Grupo)')}
                  </p>
                </div>
              </div>

              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                item.active
                  ? 'text-[#2D6A4F] bg-[#EBF7EE] border border-[#C2E4C9]'
                  : 'text-[#8E7B6C] bg-white border border-[#E8DFD3]'
              }`}>
                {item.active ? 'Ativo' : 'Ignorado'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
