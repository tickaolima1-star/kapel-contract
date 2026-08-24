import { prisma } from '@/lib/prisma';
import type { OrgRequestContext } from '@/lib/api-auth';
import { rankCommandItems, scoreWorkItem, type PriorityInput } from './priority';
import type { CommandResponse, NotNowItem } from './types';

const DAY = 86_400_000;
const iso = (value: Date | null) => value?.toISOString() ?? null;

export async function getCommandReadModel(auth: OrgRequestContext, now: Date): Promise<CommandResponse> {
  const [workItems, riskProjects, externalBlockers, memberships] = await Promise.all([
    prisma.workItem.findMany({ where: { organization_id: auth.organizationId, status: { in: ['OPEN', 'DOING', 'BLOCKED'] } }, include: { assignee: { include: { user: true } }, project: { include: { blockers: { where: { status: 'OPEN' } } } } } }),
    prisma.project.findMany({ where: { organization_id: auth.organizationId, status: { in: ['ACTIVE', 'BLOCKED'] }, monthly_value_at_risk: { gt: 0 } }, include: { blockers: { where: { status: 'OPEN', blocks_delivery: true } }, work_items: { where: { status: { in: ['OPEN', 'DOING'] } } } } }),
    prisma.operationalBlocker.findMany({ where: { organization_id: auth.organizationId, status: 'OPEN', responsible_party: { in: ['CLIENT', 'PARTNER', 'THIRD_PARTY'] } }, include: { project: { select: { name: true } } }, orderBy: { follow_up_at: 'asc' } }),
    prisma.membership.findMany({ where: { organization_id: auth.organizationId }, include: { user: { select: { name: true } } }, orderBy: { created_at: 'asc' } }),
  ]);
  const inputs: PriorityInput[] = workItems.map(item => ({
    id: item.id, type: item.type, status: item.status, dueAt: item.due_at, createdAt: item.created_at,
    estimatedMinutes: item.estimated_minutes, monthlyValueAtRisk: Number(item.project.monthly_value_at_risk),
    projectStrategicValue: item.project.strategic_value, assigneeMembershipId: item.assignee_membership_id,
    projectOwnerMembershipId: item.project.owner_membership_id, currentMembershipId: auth.membershipId,
    lastProjectUpdateAt: item.project.last_update_at,
    blockers: item.project.blockers.map(blocker => ({ responsibleParty: blocker.responsible_party, blocksDelivery: blocker.blocks_delivery, status: blocker.status, followUpAt: blocker.follow_up_at })),
  }));
  const ranked = rankCommandItems(inputs, now);
  const decisionIds = new Set(ranked.slice(0, 3).map(item => item.id));
  const itemById = new Map(workItems.map(item => [item.id, item]));
  const decisions = ranked.slice(0, 3).map(item => { const row = itemById.get(item.id)!; return {
    workItemId: item.id, title: row.title, projectId: row.project_id, projectName: row.project.name,
    score: item.score, factors: item.factors, explanation: item.explanation, dueAt: iso(row.due_at), estimatedMinutes: row.estimated_minutes,
  }; });
  const delegations = workItems.filter(item => item.assignee_membership_id && item.assignee_membership_id !== auth.membershipId).map(item => ({ workItemId: item.id, title: item.title, projectName: item.project.name, assigneeName: item.assignee?.user.name ?? null, dueAt: iso(item.due_at) }));
  const staleProjects = riskProjects.filter(project => !project.last_update_at || now.getTime() - project.last_update_at.getTime() > 7 * DAY).map(project => ({ projectId: project.id, projectName: project.name, daysWithoutUpdate: project.last_update_at ? Math.floor((now.getTime() - project.last_update_at.getTime()) / DAY) : 999 }));
  const staleIds = new Set(staleProjects.map(project => project.projectId));
  const notNow: NotNowItem[] = workItems.filter(item => !decisionIds.has(item.id)).map(item => {
    const input = inputs.find(candidate => candidate.id === item.id)!;
    const scored = scoreWorkItem(input, now);
    const reason: NotNowItem['reason'] = item.assignee_membership_id && item.assignee_membership_id !== auth.membershipId ? 'DELEGATED' : !scored.executable ? 'EXTERNAL_BLOCK' : staleIds.has(item.project_id) ? 'STALE_NEEDS_UPDATE' : 'LOWER_PRIORITY';
    return { workItemId: item.id, title: item.title, projectName: item.project.name, reason };
  });
  return {
    generatedAt: now.toISOString(), decisions,
    revenueAtRisk: riskProjects.filter(project => project.health !== 'HEALTHY' || project.blockers.length || project.work_items.some(item => item.due_at && item.due_at < now)).map(project => ({ projectId: project.id, projectName: project.name, amount: Number(project.monthly_value_at_risk), reason: project.health === 'CRITICAL' ? 'Saúde crítica' : project.blockers.length ? 'Entrega bloqueada' : 'Ação vencida' })),
    externalBlockers: externalBlockers.map(blocker => ({ blockerId: blocker.id, projectId: blocker.project_id, projectName: blocker.project.name, description: blocker.description, responsibleParty: blocker.responsible_party, followUpAt: iso(blocker.follow_up_at) })),
    delegations, notNow, staleProjects,
    memberships: memberships.map(membership => ({ id: membership.id, name: membership.user.name, role: membership.role })),
  };
}
