import { prisma } from '../prisma';
import { OrgRequestContext } from '../api-auth';
import { rankCommandItems, PriorityInput } from './priority';

export async function getCommandReadModel(auth: OrgRequestContext, now: Date) {
  // Query all active work items and projects in organization
  const openItems = await prisma.workItem.findMany({
    where: {
      organization_id: auth.organizationId,
      status: { in: ['OPEN', 'DOING'] },
    },
    include: {
      project: {
        include: {
          blockers: {
            where: { status: 'OPEN' },
          },
        },
      },
    },
  });

  const priorityInputs: PriorityInput[] = openItems.map((item) => ({
    id: item.id,
    title: item.title,
    type: item.type as any,
    created_at: item.created_at,
    project: {
      id: item.project.id,
      name: item.project.name,
      strategic_value: item.project.strategic_value,
      owner_membership_id: item.project.owner_membership_id,
      last_update_at: item.project.last_update_at,
      monthly_value_at_risk: Number(item.project.monthly_value_at_risk),
      blockers: item.project.blockers.map((b) => ({
        id: b.id,
        status: b.status as any,
        responsible_party: b.responsible_party as any,
        blocks_delivery: b.blocks_delivery,
        follow_up_at: b.follow_up_at,
      })),
    },
    assignee_membership_id: item.assignee_membership_id,
    due_at: item.due_at,
    estimated_minutes: item.estimated_minutes,
  }));

  const ranked = rankCommandItems(priorityInputs, now);
  const founderRanked = ranked.filter((x) => {
    const item = openItems.find((o) => o.id === x.id);
    return item?.assignee_membership_id === auth.membershipId;
  });

  // Extract top 3 decisions
  const decisions = founderRanked.slice(0, 3);

  // Revenue risk
  const riskProjects = await prisma.project.findMany({
    where: {
      organization_id: auth.organizationId,
      health: { in: ['ATTENTION', 'CRITICAL'] },
      monthly_value_at_risk: { gt: 0 },
    },
  });

  const revenueAtRisk = riskProjects.map((p) => ({
    projectId: p.id,
    projectName: p.name,
    amount: Number(p.monthly_value_at_risk),
    reason: p.health === 'CRITICAL' ? 'Saúde crítica' : 'Atenção necessária',
  }));

  // Blockers
  const openBlockers = await prisma.operationalBlocker.findMany({
    where: {
      organization_id: auth.organizationId,
      status: 'OPEN',
      responsible_party: { in: ['CLIENT', 'PARTNER', 'THIRD_PARTY'] },
    },
    include: { project: true },
  });

  const externalBlockers = openBlockers.map((b) => ({
    id: b.id,
    projectName: b.project.name,
    description: b.description,
    responsibleParty: b.responsible_party,
    followUpAt: b.follow_up_at,
  }));

  // Delegations
  const delegations = openItems
    .filter((o) => o.assignee_membership_id && o.assignee_membership_id !== auth.membershipId)
    .map((o) => ({
      id: o.id,
      title: o.title,
      projectName: o.project.name,
      assigneeMembershipId: o.assignee_membership_id,
    }));

  return {
    generatedAt: now.toISOString(),
    decisions,
    revenueAtRisk,
    externalBlockers,
    delegations,
    notNow: ranked.slice(3),
  };
}
