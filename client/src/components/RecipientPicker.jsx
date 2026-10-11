import React, { useState } from 'react';
import { Users, Search, CheckSquare, Square, User, UserCheck, Check } from 'lucide-react';

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
    <div className="glass-panel rounded-2xl p-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Destinatários do Envio
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                {activeCount} de {localList.length} ativos
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Contatos individuais que receberão o versículo (grupos são estritamente bloqueados).
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-lg disabled:opacity-50 ${
            savedFeedback
              ? 'bg-emerald-500 text-white'
              : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-950/40'
          }`}
        >
          {savedFeedback ? <Check className="w-4 h-4" /> : null}
          {savedFeedback ? 'Salvo!' : 'Salvar Destinatários'}
        </button>
      </div>

      {/* Search and Quick Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou número..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white placeholder:text-slate-500 outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={selectAll}
            className="px-3 py-2 text-[11px] font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
          >
            Selecionar Todos
          </button>
          <button
            onClick={deselectAll}
            className="px-3 py-2 text-[11px] font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
          >
            Desmarcar Todos
          </button>
        </div>
      </div>

      {/* Recipients List Container */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 max-h-64 overflow-y-auto divide-y divide-slate-800/50">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            {localList.length === 0
              ? 'Nenhum contato sincronizado ainda. Conecte o WhatsApp para carregar sua agenda.'
              : 'Nenhum destinatário encontrado com esse filtro.'}
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.jid}
              onClick={() => toggleRecipient(item.jid)}
              className="p-3 flex items-center justify-between hover:bg-slate-900/60 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="text-purple-400">
                  {item.active ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-100 flex items-center gap-2">
                    {item.name || item.jid.split('@')[0]}
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                      item.type === 'group'
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.type === 'group' ? 'Grupo' : 'Contato'}
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {item.jid.replace('@s.whatsapp.net', '').replace('@g.us', ' (ID Grupo)')}
                  </p>
                </div>
              </div>

              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                item.active ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-slate-900'
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
