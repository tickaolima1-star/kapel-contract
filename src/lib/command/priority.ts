export type PriorityInput = {
  id: string;
  title: string;
  type: 'ACTION' | 'FOLLOW_UP' | 'REVIEW' | 'DECISION';
  created_at: Date;
  project: {
    id: string;
    name: string;
    strategic_value: number;
    owner_membership_id: string;
    last_update_at: Date | null;
    monthly_value_at_risk: number;
    blockers: Array<{
      id: string;
      status: 'OPEN' | 'RESOLVED' | 'WAIVED';
      responsible_party: 'KAPEL' | 'CLIENT' | 'PARTNER' | 'THIRD_PARTY';
      blocks_delivery: boolean;
      follow_up_at: Date | null;
    }>;
  };
  assignee_membership_id: string | null;
  due_at: Date | null;
  estimated_minutes: number | null;
};

export type PriorityResult = {
  score: number;
  executable: boolean;
  factors: {
    deadline: number;
    financialImpact: number;
    unblockImpact: number;
    strategicValue: number;
    founderNeed: number;
    effortEfficiency: number;
    staleConfidencePenalty: number;
  };
  explanation: string[];
};

export function scoreWorkItem(item: PriorityInput, now: Date): PriorityResult {
  const explanation: string[] = [];
  
  // 1. Check external blockers
  const externalBlocker = item.project.blockers.find(
    (b) => b.status === 'OPEN' && b.blocks_delivery && b.responsible_party !== 'KAPEL'
  );

  let executable = true;
  if (externalBlocker) {
    const isOverdueFollowUp = item.type === 'FOLLOW_UP' && externalBlocker.follow_up_at && externalBlocker.follow_up_at <= now;
    if (!isOverdueFollowUp) {
      executable = false;
    }
  }

  if (!executable) {
    return {
      score: 0,
      executable: false,
      factors: { deadline: 0, financialImpact: 0, unblockImpact: 0, strategicValue: 0, founderNeed: 0, effortEfficiency: 0, staleConfidencePenalty: 0 },
      explanation: ['Bloqueado por terceiros.'],
    };
  }

  // 2. Calculations
  // Deadline
  let deadline = 0;
  if (item.due_at) {
    const diff = item.due_at.getTime() - now.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    if (days < 0) {
      deadline = 25;
      explanation.push('Atrasado: +25');
    } else if (days <= 1) {
      deadline = 22;
      explanation.push('Vence hoje/amanhã: +22');
    } else if (days <= 3) {
      deadline = 17;
      explanation.push('Vence em até 3 dias: +17');
    } else if (days <= 7) {
      deadline = 10;
      explanation.push('Vence em até 7 dias: +10');
    }
  }

  // Financial Impact
  let financialImpact = 0;
  const risk = item.project.monthly_value_at_risk;
  if (risk >= 10000) {
    financialImpact = 25;
    explanation.push('Impacto financeiro crítico: +25');
  } else if (risk >= 5000) {
    financialImpact = 20;
    explanation.push('Impacto financeiro alto: +20');
  } else if (risk >= 2000) {
    financialImpact = 14;
    explanation.push('Impacto financeiro médio: +14');
  } else if (risk > 0) {
    financialImpact = 7;
    explanation.push('Impacto financeiro baixo: +7');
  }

  // Unblock Impact
  let unblockImpact = 0;
  const hasKapelBlocker = item.project.blockers.some((b) => b.status === 'OPEN' && b.responsible_party === 'KAPEL');
  if (item.type === 'FOLLOW_UP' && externalBlocker) {
    unblockImpact = 20;
    explanation.push('Follow-up de bloqueio ativo: +20');
  } else if (hasKapelBlocker && item.type === 'DECISION') {
    unblockImpact = 12;
    explanation.push('Decisão necessária para desbloqueio: +12');
  }

  // Strategic Value
  const strategicValue = item.project.strategic_value * 3;
  if (strategicValue > 0) {
    explanation.push(`Valor estratégico do projeto: +${strategicValue}`);
  }

  // Founder Need
  let founderNeed = 0;
  if (item.assignee_membership_id === item.project.owner_membership_id) {
    founderNeed = 10;
    explanation.push('Necessidade do fundador responsável: +10');
  }

  // Effort Efficiency
  let effortEfficiency = 0;
  const minutes = item.estimated_minutes || 60;
  if (minutes <= 15) {
    effortEfficiency = 5;
    explanation.push('Rápida execução (<15 min): +5');
  } else if (minutes <= 30) {
    effortEfficiency = 4;
  } else if (minutes <= 60) {
    effortEfficiency = 3;
  } else if (minutes <= 120) {
    effortEfficiency = 2;
  } else {
    effortEfficiency = 1;
  }

  // Stale confidence penalty
  let staleConfidencePenalty = 0;
  if (item.project.last_update_at) {
    const diff = now.getTime() - item.project.last_update_at.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    if (days > 7) {
      staleConfidencePenalty = -5;
      explanation.push('Projeto sem atualização há 7+ dias: -5');
    }
  }

  const rawScore = deadline + financialImpact + unblockImpact + strategicValue + founderNeed + effortEfficiency + staleConfidencePenalty;
  const score = Math.max(0, Math.min(100, rawScore));

  return {
    score,
    executable,
    factors: {
      deadline,
      financialImpact,
      unblockImpact,
      strategicValue,
      founderNeed,
      effortEfficiency,
      staleConfidencePenalty,
    },
    explanation,
  };
}

export type RankedCommandItem = {
  id: string;
  title: string;
  score: number;
  project_id: string;
  project_name: string;
  explanation: string[];
  due_at: Date | null;
  estimated_minutes: number | null;
};

export function rankCommandItems(inputs: PriorityInput[], now: Date): RankedCommandItem[] {
  const scored = inputs
    .map((item) => {
      const res = scoreWorkItem(item, now);
      return { item, res };
    })
    .filter((x) => x.res.executable && x.res.score > 0);

  scored.sort((a, b) => {
    if (b.res.score !== a.res.score) {
      return b.res.score - a.res.score;
    }
    const dueA = a.item.due_at ? a.item.due_at.getTime() : Infinity;
    const dueB = b.item.due_at ? b.item.due_at.getTime() : Infinity;
    if (dueA !== dueB) {
      return dueA - dueB;
    }
    return a.item.created_at.getTime() - b.item.created_at.getTime();
  });

  return scored.map(({ item, res }) => ({
    id: item.id,
    title: item.title,
    score: res.score,
    project_id: item.project.id,
    project_name: item.project.name,
    explanation: res.explanation,
    due_at: item.due_at,
    estimated_minutes: item.estimated_minutes,
  }));
}
