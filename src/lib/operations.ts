import { ProjectStatus, ProjectHealth, ProjectSource } from '@prisma/client';

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
  initialWorkItem?: {
    title: string;
    assigneeMembershipId?: string;
    dueAt?: string;
    estimatedMinutes?: number;
  };
};
export type { ProjectStatus, ProjectHealth, ProjectSource };
