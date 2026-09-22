'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Header } from '@/components/Header';
import { CharacterHeader } from '@/components/rpg/CharacterHeader';
import { AttributeMatrix } from '@/components/rpg/AttributeMatrix';
import { ForgeTimer } from '@/components/rpg/ForgeTimer';
import { QuestBoard } from '@/components/rpg/QuestBoard';
import { AlforriaTracker } from '@/components/rpg/AlforriaTracker';
import { TelosCard } from '@/components/rpg/TelosCard';
import {
  loadRPGState,
  saveRPGState,
  completeQuest,
  completeForgeSession,
  type RPGState,
  type AttributeKey,
  type FinancialTarget,
} from '@/lib/rpg-store';
import { Compass, Sparkles, RefreshCw } from 'lucide-react';

export default function PilotPage() {
  const [state, setState] = useState<RPGState | null>(null);
  const [xpAnimation, setXpAnimation] = useState<number | null>(null);

  useEffect(() => {
    const loaded = loadRPGState();
    setState(loaded);
  }, []);

  const handleCompleteQuest = (questId: string) => {
    if (!state) return;
    const quest = state.quests.find((q) => q.id === questId);
    const updated = completeQuest(state, questId);
    setState(updated);
    saveRPGState(updated);

    if (quest) {
      setXpAnimation(quest.xpReward);
      setTimeout(() => setXpAnimation(null), 3000);
    }
  };

  const handleAddQuest = (title: string, category: AttributeKey, xpReward: number) => {
    if (!state) return;
    const newQuest = {
      id: `quest-${Date.now()}`,
      title,
      category,
      xpReward,
      completed: false,
      createdDate: new Date().toISOString().split('T')[0],
    };

    const updated: RPGState = {
      ...state,
      quests: [newQuest, ...state.quests],
    };

    setState(updated);
    saveRPGState(updated);
  };

  const handleDeleteQuest = (questId: string) => {
    if (!state) return;
    const updated: RPGState = {
      ...state,
      quests: state.quests.filter((q) => q.id !== questId),
    };
    setState(updated);
    saveRPGState(updated);
  };

  const handleCompleteForge = (durationMinutes: number, objective: string) => {
    if (!state) return;
    const updated = completeForgeSession(state, durationMinutes, objective);
    setState(updated);
    saveRPGState(updated);

    setXpAnimation(100);
    setTimeout(() => setXpAnimation(null), 3000);
  };

  const handleUpdateFinancial = (newTarget: FinancialTarget) => {
    if (!state) return;
    const updated: RPGState = {
      ...state,
      financial: newTarget,
    };
    setState(updated);
    saveRPGState(updated);
  };

  if (!state) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64 text-[#AEB4AE] font-mono">
          <RefreshCw className="w-6 h-6 animate-spin text-[#335943] mr-2" />
          Inicializando Cockpit Tático...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Floating XP Toast */}
      {xpAnimation && (
        <div className="fixed bottom-8 right-8 z-50 bg-[#1C2E24] border-2 border-emerald-500 text-emerald-300 font-mono font-bold px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-5 h-5 text-emerald-400 fill-emerald-400" />
          <span>+{xpAnimation} XP Conquistados!</span>
        </div>
      )}

      <Header
        title="Life RPG Command"
        subtitle="Cockpit de Evolução Diária do Fundador. Gamificação de hábitos, deep work e blindagem de patrimônio."
      />

      <div className="space-y-6 mt-6">
        {/* 1. Profile Header & XP Bar */}
        <CharacterHeader profile={state.profile} />

        {/* 2. Combat Attribute Matrix */}
        <AttributeMatrix attributes={state.attributes} />

        {/* 3. Operational Split: Deep Work Timer & Quest Board */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ForgeTimer
            onCompleteSession={handleCompleteForge}
            recentSessions={state.forgeSessions}
          />
          <QuestBoard
            quests={state.quests}
            onCompleteQuest={handleCompleteQuest}
            onAddQuest={handleAddQuest}
            onDeleteQuest={handleDeleteQuest}
          />
        </div>

        {/* 4. Strategic Trackers: Alforria (Financial) & Telos (3-Year Vision) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AlforriaTracker
              financial={state.financial}
              onUpdateFinancial={handleUpdateFinancial}
            />
          </div>
          <div className="lg:col-span-1">
            <TelosCard />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
