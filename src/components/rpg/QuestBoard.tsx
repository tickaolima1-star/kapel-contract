'use client';

import React, { useState } from 'react';
import { CheckSquare, Plus, Trash2, Sparkles, Filter, CheckCircle2 } from 'lucide-react';
import { type QuestItem, type AttributeKey } from '@/lib/rpg-store';

interface QuestBoardProps {
  quests: QuestItem[];
  onCompleteQuest: (questId: string) => void;
  onAddQuest: (title: string, category: AttributeKey, xpReward: number) => void;
  onDeleteQuest: (questId: string) => void;
}

const CATEGORY_LABELS: Record<AttributeKey, { label: string; color: string }> = {
  mkt: { label: 'MKT & Vendas', color: 'text-rose-400 border-rose-900/40 bg-rose-950/20' },
  data: { label: 'Dados & Lógica', color: 'text-sky-400 border-sky-900/40 bg-sky-950/20' },
  discipline: { label: 'Disciplina & Foco', color: 'text-amber-400 border-amber-900/40 bg-amber-950/20' },
  energy: { label: 'Energia & Físico', color: 'text-emerald-400 border-emerald-900/40 bg-emerald-950/20' },
  code: { label: 'Código & Software', color: 'text-purple-400 border-purple-900/40 bg-purple-950/20' },
};

export function QuestBoard({
  quests,
  onCompleteQuest,
  onAddQuest,
  onDeleteQuest,
}: QuestBoardProps) {
  const [filter, setFilter] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<AttributeKey>('code');
  const [newXp, setNewXp] = useState(50);

  const completedCount = quests.filter((q) => q.completed).length;
  const totalCount = quests.length;

  const filteredQuests = quests.filter((q) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !q.completed;
    if (filter === 'completed') return q.completed;
    return q.category === filter;
  });

  const handleCreateQuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddQuest(newTitle.trim(), newCategory, Number(newXp) || 50);
    setNewTitle('');
    setShowAddForm(false);
  };

  return (
    <div className="bg-[#0A0A0A] border border-[rgba(242,242,237,0.1)] rounded-lg p-5 shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#F2F2ED] flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#335943]" />
              Quest Board do Dia
            </h2>
            <span className="text-[11px] font-mono text-[#AEB4AE] bg-[#121312] border border-[rgba(242,242,237,0.06)] px-2 py-0.5 rounded">
              {completedCount}/{totalCount} Concluídas
            </span>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-xs font-mono font-semibold text-[#F2F2ED] bg-[#1C2E24] hover:bg-[#263F31] border border-[#335943] px-2.5 py-1 rounded flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Quest
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none text-[11px] font-mono">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded border whitespace-nowrap transition-all ${
              filter === 'all'
                ? 'bg-[#1C2E24] text-[#F2F2ED] border-[#335943]'
                : 'bg-[#121312] text-[#8E948E] border-[rgba(242,242,237,0.06)] hover:text-[#F2F2ED]'
            }`}
          >
            Todas ({totalCount})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-2.5 py-1 rounded border whitespace-nowrap transition-all ${
              filter === 'pending'
                ? 'bg-[#1C2E24] text-[#F2F2ED] border-[#335943]'
                : 'bg-[#121312] text-[#8E948E] border-[rgba(242,242,237,0.06)] hover:text-[#F2F2ED]'
            }`}
          >
            Pendentes ({totalCount - completedCount})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-2.5 py-1 rounded border whitespace-nowrap transition-all ${
              filter === 'completed'
                ? 'bg-[#1C2E24] text-[#F2F2ED] border-[#335943]'
                : 'bg-[#121312] text-[#8E948E] border-[rgba(242,242,237,0.06)] hover:text-[#F2F2ED]'
            }`}
          >
            Concluídas ({completedCount})
          </button>
        </div>

        {/* Add Quest Modal/Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreateQuest}
            className="bg-[#121312] border border-[#335943] rounded-md p-3.5 mb-4 space-y-3 animate-fadeIn"
          >
            <h3 className="text-xs font-bold text-[#F2F2ED] uppercase tracking-wider">
              Criar Nova Missão
            </h3>

            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Ex: Refatorar API de Clientes / 45 min de Leitura"
              className="w-full bg-[#0A0A0A] border border-[rgba(242,242,237,0.1)] rounded px-3 py-1.5 text-xs text-[#F2F2ED] focus:outline-none focus:border-[#335943]"
              autoFocus
            />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono text-[#8E948E] block mb-1">
                  Atributo Alvo:
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as AttributeKey)}
                  className="w-full bg-[#0A0A0A] border border-[rgba(242,242,237,0.1)] rounded px-2.5 py-1.5 text-xs text-[#F2F2ED] focus:outline-none focus:border-[#335943] font-mono"
                >
                  <option value="code">Código & Software</option>
                  <option value="mkt">MKT & Vendas</option>
                  <option value="data">Dados & Lógica</option>
                  <option value="discipline">Disciplina & Foco</option>
                  <option value="energy">Energia & Físico</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#8E948E] block mb-1">
                  Recompensa XP:
                </label>
                <input
                  type="number"
                  value={newXp}
                  onChange={(e) => setNewXp(Number(e.target.value))}
                  min={10}
                  max={500}
                  step={10}
                  className="w-full bg-[#0A0A0A] border border-[rgba(242,242,237,0.1)] rounded px-2.5 py-1.5 text-xs text-[#F2F2ED] focus:outline-none focus:border-[#335943] font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1 text-xs text-[#8E948E] hover:text-[#F2F2ED] font-mono"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-[#1C2E24] hover:bg-[#263F31] border border-[#335943] text-[#F2F2ED] text-xs font-mono font-bold rounded"
              >
                Salvar Quest
              </button>
            </div>
          </form>
        )}

        {/* Quests List */}
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {filteredQuests.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#8E948E] font-mono border border-dashed border-[rgba(242,242,237,0.06)] rounded">
              Nenhuma missão encontrada para este filtro.
            </div>
          ) : (
            filteredQuests.map((quest) => {
              const catInfo = CATEGORY_LABELS[quest.category] || {
                label: quest.category,
                color: 'text-gray-300 border-gray-700 bg-gray-800/40',
              };

              return (
                <div
                  key={quest.id}
                  className={`border rounded-md p-3 transition-all flex items-center justify-between gap-3 group ${
                    quest.completed
                      ? 'bg-[#0E0F0E] border-[rgba(242,242,237,0.04)] opacity-60'
                      : 'bg-[#121312] border-[rgba(242,242,237,0.08)] hover:border-[#335943]'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={() => !quest.completed && onCompleteQuest(quest.id)}
                      disabled={quest.completed}
                      className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        quest.completed
                          ? 'bg-[#1C2E24] border-[#335943] text-emerald-400 cursor-default'
                          : 'border-[rgba(242,242,237,0.2)] hover:border-emerald-500 bg-[#0A0A0A]'
                      }`}
                    >
                      {quest.completed && <CheckCircle2 className="w-3.5 h-3.5 fill-current" />}
                    </button>

                    <div className="min-w-0">
                      <p
                        className={`text-xs font-medium leading-snug truncate ${
                          quest.completed
                            ? 'line-through text-[#8E948E]'
                            : 'text-[#F2F2ED] group-hover:text-white'
                        }`}
                      >
                        {quest.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${catInfo.color}`}
                        >
                          {catInfo.label}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" />
                          +{quest.xpReward} XP
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteQuest(quest.id)}
                    className="text-[#8E948E] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    title="Excluir Quest"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
