import { prisma } from '../prisma';

export async function initializeOperationalProject(contractId: string, tx: any = prisma) {
  // 1. Check if Project already exists for this contract
  const existing = await tx.project.findUnique({
    where: { contract_id: contractId },
  });
  if (existing) return existing;

  // 2. Fetch contract details
  const contract = await tx.contract.findUnique({
    where: { id: contractId },
    include: { client: true, template: true },
  });

  if (!contract) {
    throw new Error(`Contrato ${contractId} não encontrado para inicialização operacional.`);
  }

  // 3. Resolve owner membership
  const owner = await tx.membership.findFirst({
    where: { organization_id: contract.organization_id },
    orderBy: { created_at: 'asc' },
  });
  if (!owner) {
    throw new Error(`Nenhum membro encontrado na organização ${contract.organization_id} para ser dono do projeto.`);
  }

  // 4. Create Project
  const templateType = contract.template?.type || 'PERFORMANCE';
  const calculatedMrr = Number(contract.calculated_mrr || 0);

  const project = await tx.project.create({
    data: {
      organization_id: contract.organization_id,
      contracting_client_id: contract.client_id,
      contract_id: contract.id,
      name: contract.title,
      objective: templateType === 'POLITICAL' ? 'Execução de campanha de marketing eleitoral' : 'Prestação de serviços de mídia e performance',
      status: 'ACTIVE',
      health: 'HEALTHY',
      owner_membership_id: owner.id,
      monthly_value_at_risk: calculatedMrr,
      strategic_value: 3,
      mental_load: 3,
      source: 'MANUAL',
    },
  });

  // 5. Create default work items
  const now = new Date();
  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const workItemsData = [];
  if (templateType === 'POLITICAL') {
    workItemsData.push(
      {
        organization_id: contract.organization_id,
        project_id: project.id,
        title: 'Registro de Candidatura TSE',
        type: 'ACTION' as const,
        status: 'OPEN' as const,
        due_at: addDays(now, 3),
        assignee_membership_id: owner.id,
      },
      {
        organization_id: contract.organization_id,
        project_id: project.id,
        title: 'Setup Inicial de Contas & Doadores',
        type: 'ACTION' as const,
        status: 'OPEN' as const,
        due_at: addDays(now, 7),
        assignee_membership_id: owner.id,
      },
      {
        organization_id: contract.organization_id,
        project_id: project.id,
        title: 'Lançamento da Campanha (16/Ago)',
        type: 'ACTION' as const,
        status: 'OPEN' as const,
        due_at: addDays(now, 15),
        assignee_membership_id: owner.id,
      }
    );
  } else {
    workItemsData.push(
      {
        organization_id: contract.organization_id,
        project_id: project.id,
        title: 'Onboarding & Briefing',
        type: 'ACTION' as const,
        status: 'OPEN' as const,
        due_at: addDays(now, 10),
        assignee_membership_id: owner.id,
      },
      {
        organization_id: contract.organization_id,
        project_id: project.id,
        title: 'Setup de Contas',
        type: 'ACTION' as const,
        status: 'OPEN' as const,
        due_at: addDays(now, 15),
        assignee_membership_id: owner.id,
      },
      {
        organization_id: contract.organization_id,
        project_id: project.id,
        title: 'Primeira Entrega de Criativos',
        type: 'ACTION' as const,
        status: 'OPEN' as const,
        due_at: addDays(now, 20),
        assignee_membership_id: owner.id,
      }
    );
  }

  await tx.workItem.createMany({
    data: workItemsData,
  });

  return project;
}
