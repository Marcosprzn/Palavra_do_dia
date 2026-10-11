import React, { useState } from 'react';
import { Users, Search, CheckSquare, Square, Check, Filter, RefreshCw, Info, Trash2, UserPlus, X } from 'lucide-react';

function formatPhoneDisplay(jid) {
  if (!jid) return '';
  const digits = jid.replace('@s.whatsapp.net', '').replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) {
    const ddd = digits.slice(2, 4);
    const rest = digits.slice(4);
    if (rest.length === 9) {
      return `+55 (${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
    } else if (rest.length === 8) {
      return `+55 (${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
    }
  }
  return `+${digits}`;
}

export default function RecipientPicker({
  recipients,
  onSaveRecipients,
  onDeleteRecipient,
  onAddRecipient,
  onRefresh,
  loading
}) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'active' | 'inactive'
  const [localList, setLocalList] = useState(recipients || []);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Add Contact Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [addingError, setAddingError] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Deleting State (by JID)
  const [deletingJid, setDeletingJid] = useState(null);

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

  const handleRefreshClick = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setRefreshing(false), 800);
    }
  };

  const handleDelete = async (e, jid) => {
    e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja remover este destinatário da lista?')) {
      return;
    }
    setDeletingJid(jid);
    try {
      if (onDeleteRecipient) {
        await onDeleteRecipient(jid);
      }
      setLocalList(prev => prev.filter(r => r.jid !== jid));
    } finally {
      setDeletingJid(null);
    }
  };

  const handleAddNewContact = async (e) => {
    e.preventDefault();
    setAddingError('');
    const cleanPhone = newPhone.replace(/\D/g, '');
    if (cleanPhone.length < 8) {
      setAddingError('Informe um número de WhatsApp válido com DDD (ex: 11 99999-8888).');
      return;
    }

    setIsAdding(true);
    try {
      if (onAddRecipient) {
        const res = await onAddRecipient({ name: newName.trim(), phone: cleanPhone });
        if (res && res.error) {
          setAddingError(res.error);
          return;
        }
      }
      setNewName('');
      setNewPhone('');
      setShowAddForm(false);
    } catch (err) {
      setAddingError(err.message || 'Erro ao adicionar contato.');
    } finally {
      setIsAdding(false);
    }
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
                {activeCount} de {localList.length} marcados para envio
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-[#7A6859]">
              Apenas contatos individuais salvos no WhatsApp. Canais, grupos e bots foram removidos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto flex-wrap">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-2.5 sm:px-3 sm:py-2 text-xs font-semibold rounded-xl bg-[#FAF8F5] hover:bg-[#F4EFE6] text-[#382A1E] border border-[#E8DFD3] transition-all cursor-pointer shadow-xs flex items-center gap-1.5 flex-shrink-0"
            title="Adicionar contato manualmente"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#C59B27]" />
            <span>Adicionar Contato</span>
          </button>

          {onRefresh && (
            <button
              onClick={handleRefreshClick}
              disabled={loading || refreshing}
              title="Sincronizar novamente com a agenda do WhatsApp"
              className="p-2.5 sm:px-3 sm:py-2 text-xs font-semibold rounded-xl bg-[#FAF8F5] hover:bg-[#F4EFE6] text-[#382A1E] border border-[#E8DFD3] transition-all cursor-pointer shadow-xs flex items-center gap-1.5 flex-shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#C59B27] ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sincronizar</span>
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={loading}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50 ${
              savedFeedback
                ? 'bg-[#2D6A4F] text-white'
                : 'bg-[#382A1E] hover:bg-[#251B12] text-white'
            }`}
          >
            {savedFeedback ? <Check className="w-4 h-4" /> : null}
            {savedFeedback ? 'Salvo com Sucesso!' : 'Salvar Destinatários'}
          </button>
        </div>
      </div>

      {/* Manual Add Contact Form Modal/Drawer */}
      {showAddForm && (
        <form onSubmit={handleAddNewContact} className="p-4 sm:p-5 mb-5 rounded-2xl bg-[#FAF8F5] border border-[#E8DFD3] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-semibold text-[#382A1E] flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-[#C59B27]" />
              Novo Destinatário Manual
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-[#8E7B6C] hover:text-[#382A1E] p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#7A6859] mb-1">
                Nome do Contato
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Pastor Carlos, Irmã Maria"
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8DFD3] text-xs text-[#382A1E] outline-none focus:border-[#C59B27]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#7A6859] mb-1">
                WhatsApp com DDD <span className="text-[#C59B27]">*</span>
              </label>
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="Ex: 11 98888-7777 ou 5511988887777"
                required
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8DFD3] text-xs text-[#382A1E] outline-none focus:border-[#C59B27]"
              />
            </div>
          </div>

          {addingError && (
            <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
              {addingError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#7A6859] hover:bg-[#EFE9DF] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isAdding}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#382A1E] hover:bg-[#251B12] text-white cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isAdding ? 'Adicionando...' : 'Adicionar e Marcar'}
            </button>
          </div>
        </form>
      )}

      {/* Helpful Instructions Banner */}
      <div className="p-3 rounded-2xl bg-[#FDF9EF] border border-[#EBD69E] text-xs text-[#8E691A] flex items-start sm:items-center gap-2.5 mb-4">
        <Info className="w-4 h-4 flex-shrink-0 text-[#C59B27] mt-0.5 sm:mt-0" />
        <p className="leading-relaxed text-[11px] sm:text-xs">
          <strong>Como funciona:</strong> Seus contatos individuais chegam <strong>marcados por padrão</strong>. Desmarque quem não deve receber o versículo diário ou remova no ícone de lixeira. Clique em <strong>Salvar Destinatários</strong> ao terminar.
        </p>
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
        <div className="flex items-center gap-2 pt-1 text-xs overflow-x-auto no-scrollbar">
          <span className="text-[11px] text-[#8E7B6C] flex items-center gap-1 mr-1 flex-shrink-0">
            <Filter className="w-3 h-3" /> Filtrar:
          </span>
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
              filterType === 'all'
                ? 'bg-[#382A1E] text-white'
                : 'bg-[#FAF8F5] text-[#7A6859] hover:bg-[#F6F1EA] border border-[#E8DFD3]'
            }`}
          >
            Todos ({localList.length})
          </button>
          <button
            onClick={() => setFilterType('active')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
              filterType === 'active'
                ? 'bg-[#2D6A4F] text-white'
                : 'bg-[#FAF8F5] text-[#7A6859] hover:bg-[#F6F1EA] border border-[#E8DFD3]'
            }`}
          >
            Marcados ({activeCount})
          </button>
          <button
            onClick={() => setFilterType('inactive')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
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
      <div className="rounded-2xl border border-[#E8DFD3] bg-[#FAF8F5] max-h-96 overflow-y-auto divide-y divide-[#E8DFD3]">
        {filtered.length === 0 ? (
          <div className="text-center py-12 px-4 text-xs text-[#A8988B] space-y-1">
            {localList.length === 0 ? (
              <>
                <p className="font-semibold text-[#7A6859]">Nenhum contato individual na lista.</p>
                <p>Clique em "+ Adicionar Contato" para cadastrar ou conecte o WhatsApp para sincronizar automaticamente.</p>
              </>
            ) : (
              <p>Nenhum contato encontrado com o filtro ou busca aplicado.</p>
            )}
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.jid}
              onClick={() => toggleRecipient(item.jid)}
              className="p-3.5 flex items-center justify-between hover:bg-white cursor-pointer transition-colors select-none group"
            >
              <div className="flex items-center gap-3.5 min-w-0 pr-2">
                <div className="flex-shrink-0">
                  {item.active ? (
                    <CheckSquare className="w-5 h-5 text-[#2D6A4F]" />
                  ) : (
                    <Square className="w-5 h-5 text-[#C5B8AB]" />
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-[#382A1E] truncate">
                    {item.name || formatPhoneDisplay(item.jid)}
                  </h4>
                  <p className="text-[10px] text-[#8E7B6C] font-mono truncate">
                    {formatPhoneDisplay(item.jid)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-shrink-0">
                <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full transition-all whitespace-nowrap ${
                  item.active
                    ? 'text-[#2D6A4F] bg-[#EBF7EE] border border-[#C2E4C9]'
                    : 'text-[#8E7B6C] bg-white border border-[#E8DFD3]'
                }`}>
                  {item.active ? 'Enviar' : 'Não Enviar'}
                </span>

                <button
                  onClick={(e) => handleDelete(e, item.jid)}
                  disabled={deletingJid === item.jid}
                  title="Excluir este contato da lista"
                  className="p-1.5 rounded-lg text-[#A8988B] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
