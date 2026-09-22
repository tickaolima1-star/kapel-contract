export type AttributeKey = 'mkt' | 'data' | 'discipline' | 'energy' | 'code';

export interface CombatAttribute {
  key: AttributeKey;
  label: string;
  iconName: string;
  value: number;
  buff: string;
  description: string;
}

export interface CharacterProfile {
  name: string;
  archetype: string;
  totalXp: number;
  dailyStreak: number;
  lastActiveDate: string;
}

export interface QuestItem {
  id: string;
  title: string;
  category: AttributeKey;
  xpReward: number;
  completed: boolean;
  completedAt?: string;
  createdDate: string;
}

export interface ForgeSession {
  id: string;
  timestamp: string;
  durationMinutes: number;
  targetObjective: string;
  xpAwarded: number;
}

export interface FinancialTarget {
  debtTotal: number;
  debtCurrent: number;
  monthlySurplus: number;
  targetDate: string;
}

export interface LevelInfo {
  level: number;
  title: string;
  currentLevelBaseXp: number;
  nextLevelXp: number;
  progressPercentage: number;
}

export interface RPGState {
  profile: CharacterProfile;
  attributes: Record<AttributeKey, CombatAttribute>;
  quests: QuestItem[];
  forgeSessions: ForgeSession[];
  financial: FinancialTarget;
}

export const LEVEL_THRESHOLDS = [
  { level: 1, title: 'Iniciado / Explorador', minXp: 0, maxXp: 1000 },
  { level: 2, title: 'Forjador de Ativos', minXp: 1000, maxXp: 2500 },
  { level: 3, title: 'Construtor Soberano', minXp: 2500, maxXp: 5000 },
  { level: 4, title: 'Arquiteto de Sistemas', minXp: 5000, maxXp: 10000 },
  { level: 5, title: 'Mestre Soberano', minXp: 10000, maxXp: 25000 },
];

export const DEFAULT_RPG_STATE: RPGState = {
  profile: {
    name: 'Patrick Eduardo',
    archetype: 'Guerreiro dos Dados & Forjador de Ativos',
    totalXp: 1050,
    dailyStreak: 12,
    lastActiveDate: '2026-09-22',
  },
  attributes: {
    mkt: {
      key: 'mkt',
      label: 'MKT & Vendas',
      iconName: 'Megaphone',
      value: 42,
      buff: '+2 (Gestão R$ 4M+ / Protocolo Direto)',
      description: 'Tráfego Pago, Copywriting, Arbitragem e Escala de Clientes.',
    },
    data: {
      key: 'data',
      label: 'Dados & Lógica',
      iconName: 'Brain',
      value: 36,
      buff: '+1 (Google Data Analytics Certified)',
      description: 'Análise estatística, modelos mentais, diagnóstico de métricas.',
    },
    discipline: {
      key: 'discipline',
      label: 'Disciplina & Foco',
      iconName: 'Shield',
      value: 32,
      buff: '+2 (Rotina Forja 1h/dia Ativa)',
      description: 'Bloqueio de distrações, consistência inabalável, mentalidade militar.',
    },
    energy: {
      key: 'energy',
      label: 'Energia & Físico',
      iconName: 'Zap',
      value: 26,
      buff: '+1 (Treino Pôr do Sol / Nutrição)',
      description: 'Canalização da alta energia, treino diário e vitalidade.',
    },
    code: {
      key: 'code',
      label: 'Código & Software',
      iconName: 'Terminal',
      value: 15,
      buff: '+3 (KAPEL Command & Esteiras IA)',
      description: 'Engenharia de software, Next.js, automações e criação de SaaS.',
    },
  },
  quests: [
    {
      id: 'q-1',
      title: 'Bloco de Forja Diária: 60 min de Deep Work em Software',
      category: 'code',
      xpReward: 100,
      completed: false,
      createdDate: '2026-09-22',
    },
    {
      id: 'q-2',
      title: 'Treino Físico Pesado no Pôr do Sol',
      category: 'energy',
      xpReward: 50,
      completed: false,
      createdDate: '2026-09-22',
    },
    {
      id: 'q-3',
      title: 'Revisar e Auditar Métricas das Campanhas KAPEL',
      category: 'mkt',
      xpReward: 75,
      completed: false,
      createdDate: '2026-09-22',
    },
    {
      id: 'q-4',
      title: 'Mapear e Indexar 1 Playbook de Tráfego no Segundo Cérebro',
      category: 'data',
      xpReward: 60,
      completed: false,
      createdDate: '2026-09-22',
    },
    {
      id: 'q-5',
      title: 'Estudo de Algoritmos & Estruturas de Dados (Eng. Software)',
      category: 'code',
      xpReward: 70,
      completed: false,
      createdDate: '2026-09-22',
    },
  ],
  forgeSessions: [
    {
      id: 'f-1',
      timestamp: '2026-09-21T18:00:00.000Z',
      durationMinutes: 60,
      targetObjective: 'Estruturação do Kapel Command e Segundo Cérebro',
      xpAwarded: 100,
    },
  ],
  financial: {
    debtTotal: 20000,
    debtCurrent: 20000,
    monthlySurplus: 6500,
    targetDate: '2027-01-01',
  },
};

export function calculateLevel(totalXp: number): LevelInfo {
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    const tier = LEVEL_THRESHOLDS[i];
    if (totalXp >= tier.minXp && (totalXp < tier.maxXp || i === LEVEL_THRESHOLDS.length - 1)) {
      const range = tier.maxXp - tier.minXp;
      const progressInLevel = Math.max(0, totalXp - tier.minXp);
      const percentage = Math.min(100, (progressInLevel / range) * 100);
      return {
        level: tier.level,
        title: tier.title,
        currentLevelBaseXp: tier.minXp,
        nextLevelXp: tier.maxXp,
        progressPercentage: percentage,
      };
    }
  }

  // Fallback for extreme levels
  return {
    level: 5,
    title: 'Mestre Soberano',
    currentLevelBaseXp: 10000,
    nextLevelXp: 25000,
    progressPercentage: 100,
  };
}

export function addExperience(state: RPGState, xp: number, attribute?: AttributeKey): RPGState {
  const newAttributes = { ...state.attributes };
  if (attribute && newAttributes[attribute]) {
    newAttributes[attribute] = {
      ...newAttributes[attribute],
      value: newAttributes[attribute].value + 1,
    };
  }

  return {
    ...state,
    profile: {
      ...state.profile,
      totalXp: state.profile.totalXp + xp,
    },
    attributes: newAttributes,
  };
}

export function completeQuest(state: RPGState, questId: string): RPGState {
  const quest = state.quests.find((q) => q.id === questId);
  if (!quest || quest.completed) return state;

  const updatedQuests = state.quests.map((q) =>
    q.id === questId ? { ...q, completed: true, completedAt: new Date().toISOString() } : q
  );

  const stateWithQuests: RPGState = {
    ...state,
    quests: updatedQuests,
  };

  return addExperience(stateWithQuests, quest.xpReward, quest.category);
}

export function completeForgeSession(
  state: RPGState,
  durationMinutes: number,
  objective: string
): RPGState {
  const xpReward = 100;
  const newSession: ForgeSession = {
    id: `forge-${Date.now()}`,
    timestamp: new Date().toISOString(),
    durationMinutes,
    targetObjective: objective,
    xpAwarded: xpReward,
  };

  const newAttributes = { ...state.attributes };
  newAttributes.discipline = {
    ...newAttributes.discipline,
    value: newAttributes.discipline.value + 1,
  };
  newAttributes.code = {
    ...newAttributes.code,
    value: newAttributes.code.value + 1,
  };

  return {
    ...state,
    profile: {
      ...state.profile,
      totalXp: state.profile.totalXp + xpReward,
    },
    attributes: newAttributes,
    forgeSessions: [newSession, ...state.forgeSessions],
  };
}

export function calculateAlforriaProjection(
  debtTotal: number,
  monthlySurplus: number,
  debtCurrent: number
) {
  const paidAmount = Math.max(0, debtTotal - debtCurrent);
  const paidPercentage = debtTotal > 0 ? (paidAmount / debtTotal) * 100 : 100;
  const monthsRemaining = monthlySurplus > 0 ? Math.ceil(debtCurrent / monthlySurplus) : 0;

  return {
    debtTotal,
    debtCurrent,
    paidAmount,
    paidPercentage,
    monthlySurplus,
    monthsRemaining,
  };
}

const STORAGE_KEY = 'kapel_life_rpg_state_v1';

export function loadRPGState(): RPGState {
  if (typeof window === 'undefined') return DEFAULT_RPG_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_RPG_STATE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_RPG_STATE,
      ...parsed,
      profile: { ...DEFAULT_RPG_STATE.profile, ...parsed.profile },
      attributes: { ...DEFAULT_RPG_STATE.attributes, ...parsed.attributes },
      financial: { ...DEFAULT_RPG_STATE.financial, ...parsed.financial },
    };
  } catch {
    return DEFAULT_RPG_STATE;
  }
}

export function saveRPGState(state: RPGState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Falha ao salvar estado do RPG:', err);
  }
}
