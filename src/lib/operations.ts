import type { ProjectHealth, ProjectSource, ProjectStatus } from '@prisma/client';

export type CreateProjectInput = {
  contractingClientId: string;
  contractId?: string;
  name: string;
  endClientName?: string;
  objective: string;
  status: ProjectStatus;
  health: ProjectHealth;
  ownerMembershipId: string;
  deadline?: string;
  weeklyHoursEstimate: number;
  monthlyValueAtRisk: number;
  strategicValue: number;
  mentalLoad: number;
  source: ProjectSource;
  externalId?: string;
  externalUrl?: string;
  initialWorkItem?: {
    title: string;
    assigneeMembershipId?: string;
    dueAt?: string;
    estimatedMinutes?: number;
  };
};

export type CreateProjectUpdateInput = {
  summary: string;
  nextAction: string;
  nextActionAssigneeMembershipId?: string;
  nextActionDueAt?: string;
  nextActionEstimatedMinutes?: number;
  blocker?: string;
  blockerResponsibleParty?: 'KAPEL' | 'CLIENT' | 'PARTNER' | 'THIRD_PARTY';
  blockerFollowUpAt?: string;
  metricLabel?: string;
  metricValue?: string;
  confidence?: 'CONFIRMED' | 'ESTIMATED';
  health?: ProjectHealth;
  status?: ProjectStatus;
};

export type CreateWorkItemInput = {
  projectId: string;
  title: string;
  type?: 'ACTION' | 'FOLLOW_UP' | 'REVIEW' | 'DECISION';
  assigneeMembershipId?: string;
  dueAt?: string;
  estimatedMinutes?: number;
};

export type CreateBlockerInput = {
  projectId: string;
  description: string;
  responsibleParty: 'KAPEL' | 'CLIENT' | 'PARTNER' | 'THIRD_PARTY';
  blocksDelivery?: boolean;
  followUpAt?: string;
};

export type ProjectSummary = Record<string, unknown>;
export type ProjectDetail = ProjectSummary;
