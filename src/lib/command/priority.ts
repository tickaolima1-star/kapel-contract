export type PriorityFactors = {
  deadline: number;
  financialImpact: number;
  unblockImpact: number;
  strategicValue: number;
  founderNeed: number;
  effortEfficiency: number;
  staleConfidencePenalty: number;
};

export type PriorityBlocker = {
  responsibleParty: 'KAPEL' | 'CLIENT' | 'PARTNER' | 'THIRD_PARTY';
  blocksDelivery: boolean;
  status: 'OPEN' | 'RESOLVED' | 'WAIVED';
  followUpAt: string | Date | null;
};

export type PriorityInput = {
  id: string;
  type: 'ACTION' | 'FOLLOW_UP' | 'REVIEW' | 'DECISION';
  status: 'OPEN' | 'DOING' | 'DONE' | 'BLOCKED' | 'CANCELLED';
  dueAt: string | Date | null;
  createdAt: string | Date;
  estimatedMinutes: number | null;
  monthlyValueAtRisk: number;
  projectStrategicValue: number;
  assigneeMembershipId: string | null;
  projectOwnerMembershipId: string;
  currentMembershipId: string;
  lastProjectUpdateAt: string | Date | null;
  blockers: PriorityBlocker[];
};

export type PriorityResult = { score: number; executable: boolean; factors: PriorityFactors; explanation: string[] };
export type RankedCommandItem = PriorityInput & PriorityResult;

const DAY = 86_400_000;
const toTime = (value: string | Date | null) => value ? new Date(value).getTime() : Number.POSITIVE_INFINITY;

export function scoreWorkItem(input: PriorityInput, now: Date): PriorityResult {
  const daysUntilDue = input.dueAt ? (toTime(input.dueAt) - now.getTime()) / DAY : Number.POSITIVE_INFINITY;
  const deadline = daysUntilDue < 0 ? 25 : daysUntilDue <= 1 ? 22 : daysUntilDue <= 3 ? 17 : daysUntilDue <= 7 ? 10 : 0;
  const risk = input.monthlyValueAtRisk;
  const financialImpact = risk >= 10000 ? 25 : risk >= 5000 ? 20 : risk >= 2000 ? 14 : risk > 0 ? 7 : 0;
  const openBlockers = input.blockers.filter(blocker => blocker.status === 'OPEN');
  const dueFollowUp = input.type === 'FOLLOW_UP' && openBlockers.some(blocker => blocker.blocksDelivery && toTime(blocker.followUpAt) <= now.getTime());
  const unblockImpact = dueFollowUp ? 20 : openBlockers.length > 0 && input.type === 'DECISION' ? 12 : 0;
  const strategicValue = Math.min(5, Math.max(1, input.projectStrategicValue)) * 3;
  const founderNeed = input.assigneeMembershipId === input.currentMembershipId && input.projectOwnerMembershipId === input.currentMembershipId ? 10 : 0;
  const minutes = input.estimatedMinutes ?? 120;
  const effortEfficiency = minutes <= 15 ? 5 : minutes <= 30 ? 4 : minutes <= 60 ? 3 : minutes <= 120 ? 2 : 1;
  const daysSinceProjectUpdate = input.lastProjectUpdateAt ? (now.getTime() - toTime(input.lastProjectUpdateAt)) / DAY : Number.POSITIVE_INFINITY;
  const staleConfidencePenalty = daysSinceProjectUpdate > 7 ? -5 : 0;
  const factors = { deadline, financialImpact, unblockImpact, strategicValue, founderNeed, effortEfficiency, staleConfidencePenalty };
  const externallyBlocked = openBlockers.some(blocker => blocker.blocksDelivery && ['CLIENT', 'PARTNER', 'THIRD_PARTY'].includes(blocker.responsibleParty));
  const executable = ['OPEN', 'DOING'].includes(input.status) && (!externallyBlocked || dueFollowUp);
  const raw = Object.values(factors).reduce((sum, value) => sum + value, 0);
  const score = executable ? Math.max(0, Math.min(100, raw)) : 0;
  const labels: Record<keyof PriorityFactors, string> = {
    deadline: 'Prazo', financialImpact: 'Impacto financeiro', unblockImpact: 'Desbloqueio',
    strategicValue: 'Valor estratégico', founderNeed: 'Necessidade do fundador',
    effortEfficiency: 'Eficiência de esforço', staleConfidencePenalty: 'Dados desatualizados',
  };
  const explanation = (Object.entries(factors) as Array<[keyof PriorityFactors, number]>)
    .filter(([, value]) => value !== 0).map(([key, value]) => `${labels[key]}: ${value > 0 ? '+' : ''}${value}`);
  if (!executable) explanation.unshift('Execução bloqueada externamente');
  return { score, executable, factors, explanation };
}

export function rankCommandItems(inputs: PriorityInput[], now: Date): RankedCommandItem[] {
  return inputs.map(input => ({ ...input, ...scoreWorkItem(input, now) }))
    .filter(item => item.executable && (!item.assigneeMembershipId || item.assigneeMembershipId === item.currentMembershipId))
    .sort((a, b) => b.score - a.score || toTime(a.dueAt) - toTime(b.dueAt) || toTime(a.createdAt) - toTime(b.createdAt) || a.id.localeCompare(b.id));
}
