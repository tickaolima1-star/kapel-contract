import { describe, it, expect } from 'vitest';
import {
  calculateLevel,
  calculateAlforriaProjection,
  addExperience,
  completeQuest,
  completeForgeSession,
  DEFAULT_RPG_STATE,
  type RPGState,
} from '@/lib/rpg-store';

describe('RPG Store & Logic Engine', () => {
  it('calcula o nível e o progresso corretamente com base no XP total', () => {
    // Level 1: 0 - 999 XP
    const lvl1 = calculateLevel(500);
    expect(lvl1.level).toBe(1);
    expect(lvl1.title).toBe('Iniciado / Explorador');
    expect(lvl1.nextLevelXp).toBe(1000);
    expect(lvl1.currentLevelBaseXp).toBe(0);
    expect(lvl1.progressPercentage).toBe(50);

    // Level 2: 1000 - 2499 XP (Initial Patrick State: 1050 XP)
    const lvl2 = calculateLevel(1050);
    expect(lvl2.level).toBe(2);
    expect(lvl2.title).toBe('Forjador de Ativos');
    expect(lvl2.nextLevelXp).toBe(2500);
    expect(lvl2.currentLevelBaseXp).toBe(1000);
    // (1050 - 1000) / (2500 - 1000) = 50 / 1500 = ~3.33%
    expect(lvl2.progressPercentage).toBeCloseTo(3.33, 1);

    // Level 3: 2500+ XP
    const lvl3 = calculateLevel(2500);
    expect(lvl3.level).toBe(3);
    expect(lvl3.title).toBe('Construtor Soberano');
  });

  it('adiciona experiência e incrementa o atributo associado', () => {
    const initialState: RPGState = { ...DEFAULT_RPG_STATE };
    const updated = addExperience(initialState, 150, 'code');

    expect(updated.profile.totalXp).toBe(1050 + 150);
    expect(updated.attributes.code.value).toBe(DEFAULT_RPG_STATE.attributes.code.value + 1);
  });

  it('completa uma quest com sucesso e atribui XP e atributo correspondente', () => {
    const initialState: RPGState = {
      ...DEFAULT_RPG_STATE,
      quests: [
        {
          id: 'q-test-1',
          title: 'Treino no Pôr do Sol',
          category: 'energy',
          xpReward: 50,
          completed: false,
          createdDate: '2026-09-22',
        },
      ],
    };

    const updated = completeQuest(initialState, 'q-test-1');
    const quest = updated.quests.find((q) => q.id === 'q-test-1');

    expect(quest?.completed).toBe(true);
    expect(updated.profile.totalXp).toBe(1050 + 50);
    expect(updated.attributes.energy.value).toBe(DEFAULT_RPG_STATE.attributes.energy.value + 1);
  });

  it('registra a conclusão de uma sessão de Forja Diária (Deep Work)', () => {
    const initialState: RPGState = { ...DEFAULT_RPG_STATE };
    const updated = completeForgeSession(initialState, 60, 'Engenharia de Software e KAPEL Command');

    expect(updated.profile.totalXp).toBe(1050 + 100);
    expect(updated.attributes.discipline.value).toBe(DEFAULT_RPG_STATE.attributes.discipline.value + 1);
    expect(updated.attributes.code.value).toBe(DEFAULT_RPG_STATE.attributes.code.value + 1);
    expect(updated.forgeSessions.length).toBe(DEFAULT_RPG_STATE.forgeSessions.length + 1);
    expect(updated.forgeSessions[0].durationMinutes).toBe(60);
  });

  it('calcula as projeções da Operação Alforria corretamente', () => {
    const projection = calculateAlforriaProjection(20000, 6500, 20000);
    expect(projection.debtTotal).toBe(20000);
    expect(projection.debtCurrent).toBe(20000);
    expect(projection.paidAmount).toBe(0);
    expect(projection.paidPercentage).toBe(0);
    expect(projection.monthsRemaining).toBe(4); // ceil(20000 / 6500) = 4 meses

    // Test with partial payment
    const partialProjection = calculateAlforriaProjection(20000, 6500, 10000);
    expect(partialProjection.paidAmount).toBe(10000);
    expect(partialProjection.paidPercentage).toBe(50);
    expect(partialProjection.monthsRemaining).toBe(2);
  });
});
