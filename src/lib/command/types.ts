import type { MembershipRole } from '@/lib/api-auth';
import type { PriorityFactors } from './priority';

export type CommandDecision = { workItemId: string; title: string; projectId: string; projectName: string; score: number; factors: PriorityFactors; explanation: string[]; dueAt: string | null; estimatedMinutes: number | null };
export type RevenueRisk = { projectId: string; projectName: string; amount: number; reason: string };
export type CommandBlocker = { blockerId: string; projectId: string; projectName: string; description: string; responsibleParty: string; followUpAt: string | null };
export type CommandDelegation = { workItemId: string; title: string; projectName: string; assigneeName: string | null; dueAt: string | null };
export type NotNowItem = { workItemId: string; title: string; projectName: string; reason: 'EXTERNAL_BLOCK' | 'DELEGATED' | 'LOWER_PRIORITY' | 'STALE_NEEDS_UPDATE' };
export type CommandResponse = {
  generatedAt: string;
  decisions: CommandDecision[];
  revenueAtRisk: RevenueRisk[];
  externalBlockers: CommandBlocker[];
  delegations: CommandDelegation[];
  notNow: NotNowItem[];
  staleProjects: Array<{ projectId: string; projectName: string; daysWithoutUpdate: number }>;
  memberships: Array<{ id: string; name: string; role: MembershipRole }>;
};
