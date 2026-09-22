'use client';

import React from 'react';
import { Shield, Sparkles, Flame, Trophy, Award } from 'lucide-react';
import { type CharacterProfile, calculateLevel } from '@/lib/rpg-store';

interface CharacterHeaderProps {
  profile: CharacterProfile;
}

export function CharacterHeader({ profile }: CharacterHeaderProps) {
  const levelInfo = calculateLevel(profile.totalXp);

  return (
    <div className="bg-[#0A0A0A] border border-[rgba(242,242,237,0.12)] rounded-lg p-5 shadow-2xl relative overflow-hidden backdrop-blur-md">
      {/* Tactical Glow Effect */}
      <div className="absolute top-0 right-0 w-96 h-32 bg-gradient-to-l from-[#1C2E24]/30 to-transparent pointer-events-none blur-2xl" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Identity & Rank */}
        <div className="flex items-start md:items-center gap-4">
          <div className="w-14 h-14 rounded-lg bg-[#121312] border-2 border-[#335943] flex items-center justify-center text-[#F2F2ED] shadow-inner shrink-0 relative">
            <Trophy className="w-7 h-7 text-[#AEB4AE]" />
            <div className="absolute -bottom-2 -right-2 bg-[#1C2E24] border border-[#335943] text-[10px] font-mono font-bold px-1.5 py-0.5 rounded text-[#F2F2ED]">
              NV.{levelInfo.level}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-[#F2F2ED]">
                {profile.name}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#1C2E24] text-[#F2F2ED] border border-[#335943]">
                <Award className="w-3.5 h-3.5 text-[#335943]" />
                {levelInfo.title}
              </span>
            </div>
            <p className="text-xs md:text-sm text-[#AEB4AE] mt-0.5 flex items-center gap-2">
              <span>{profile.archetype}</span>
              <span className="text-[#3A403A]">•</span>
              <span className="font-mono text-[#AEB4AE] flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                Streak: <strong className="text-[#F2F2ED]">{profile.dailyStreak} dias</strong>
              </span>
            </p>
          </div>
        </div>

        {/* XP Progress Bar & Counter */}
        <div className="w-full md:w-80 bg-[#121312] border border-[rgba(242,242,237,0.08)] rounded-md p-3">
          <div className="flex justify-between items-center text-xs font-mono mb-1.5">
            <span className="text-[#AEB4AE] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#335943]" />
              EXPERIÊNCIA
            </span>
            <span className="text-[#F2F2ED] font-bold">
              {profile.totalXp.toLocaleString('pt-BR')}{' '}
              <span className="text-[#8E948E] font-normal">/ {levelInfo.nextLevelXp.toLocaleString('pt-BR')} XP</span>
            </span>
          </div>

          <div className="w-full h-2.5 bg-[#050505] rounded-full overflow-hidden border border-[rgba(242,242,237,0.05)] relative">
            <div
              className="h-full bg-gradient-to-r from-[#1C2E24] via-[#335943] to-[#44755A] rounded-full transition-all duration-700 ease-out"
              style={{ width: `${levelInfo.progressPercentage}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono text-[#8E948E] mt-1">
            <span>Nível {levelInfo.level}</span>
            <span>{levelInfo.progressPercentage.toFixed(1)}% para Nível {levelInfo.level + 1}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
