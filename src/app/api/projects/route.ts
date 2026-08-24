import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withOrgContext, type OrgRequestContext } from '@/lib/api-auth';
import { readEnum, readNumberInRange, readOptionalDate, readRequiredString, type ParseResult } from '@/lib/validation';

const PROJECT_STATUSES = ['PLANNING', 'ACTIVE', 'BLOCKED', 'ON_HOLD', 'COMPLETED', 'CANCELLED'] as const;
const PROJECT_HEALTH = ['HEALTHY', 'ATTENTION', 'CRITICAL'] as const;
const PROJECT_SOURCES = ['MANUAL', 'SPREADSHEET', 'CLICKUP', 'OTHER'] as const;
const parsedValue = <T,>(result: ParseResult<T>): T => {
  if (!result.ok) throw new Error(result.message);
  return result.value;
};

async function listProjects(_req: NextRequest, _context: unknown, auth: OrgRequestContext) {
  return NextResponse.json(await prisma.project.findMany({
    where: { organization_id: auth.organizationId },
    orderBy: [{ health: 'desc' }, { deadline: 'asc' }],
    include: { contracting_client: true, owner: { include: { user: true } }, _count: { select: { work_items: true, blockers: true } } },
  }));
}

async function createProject(req: NextRequest, _context: unknown, auth: OrgRequestContext) {
  const body = await req.json();
  const fields = {
    contractingClientId: readRequiredString(body.contractingClientId, 'Contratante'),
    name: readRequiredString(body.name, 'Nome'),
    objective: readRequiredString(body.objective, 'Objetivo'),
    ownerMembershipId: readRequiredString(body.ownerMembershipId, 'Responsável'),
    status: readEnum(body.status ?? 'PLANNING', PROJECT_STATUSES, 'Status'),
    health: readEnum(body.health ?? 'HEALTHY', PROJECT_HEALTH, 'Saúde'),
    source: readEnum(body.source ?? 'MANUAL', PROJECT_SOURCES, 'Origem'),
    weeklyHoursEstimate: readNumberInRange(body.weeklyHoursEstimate ?? 0, 0, 10000, 'Horas semanais'),
    monthlyValueAtRisk: readNumberInRange(body.monthlyValueAtRisk ?? 0, 0, Number.MAX_SAFE_INTEGER, 'Receita em risco'),
    strategicValue: readNumberInRange(body.strategicValue ?? 3, 1, 5, 'Valor estratégico'),
    mentalLoad: readNumberInRange(body.mentalLoad ?? 3, 1, 5, 'Carga mental'),
    deadline: readOptionalDate(body.deadline, 'Prazo'),
  };
  const fieldErrors = Object.fromEntries(Object.entries(fields).filter(([, r]) => !r.ok).map(([key, r]) => [key, (r as { message: string }).message]));
  if (Object.keys(fieldErrors).length) return NextResponse.json({ error: 'Revise os campos informados.', fieldErrors }, { status: 400 });

  const client = await prisma.client.findFirst({ where: { id: parsedValue(fields.contractingClientId), organization_id: auth.organizationId }, select: { id: true } });
  const owner = await prisma.membership.findFirst({ where: { id: parsedValue(fields.ownerMembershipId), organization_id: auth.organizationId }, select: { id: true } });
  const contract = body.contractId ? await prisma.contract.findFirst({ where: { id: body.contractId, organization_id: auth.organizationId }, select: { id: true } }) : null;
  if (!client) return NextResponse.json({ error: 'Contratante não encontrado.' }, { status: 404 });
  if (!owner) return NextResponse.json({ error: 'Responsável não encontrado.' }, { status: 400 });
  if (body.contractId && !contract) return NextResponse.json({ error: 'Contrato não encontrado.' }, { status: 404 });

  if (body.initialWorkItem?.assigneeMembershipId) {
    const assignee = await prisma.membership.findFirst({ where: { id: body.initialWorkItem.assigneeMembershipId, organization_id: auth.organizationId }, select: { id: true } });
    if (!assignee) return NextResponse.json({ error: 'Responsável pela ação não encontrado.' }, { status: 400 });
  }

  const project = await prisma.$transaction(async tx => {
    const created = await tx.project.create({ data: {
      organization_id: auth.organizationId,
      contracting_client_id: parsedValue(fields.contractingClientId),
      contract_id: body.contractId || null,
      name: parsedValue(fields.name),
      end_client_name: typeof body.endClientName === 'string' ? body.endClientName.trim() || null : null,
      objective: parsedValue(fields.objective),
      status: parsedValue(fields.status),
      health: parsedValue(fields.health),
      owner_membership_id: parsedValue(fields.ownerMembershipId),
      deadline: parsedValue(fields.deadline),
      weekly_hours_estimate: parsedValue(fields.weeklyHoursEstimate),
      monthly_value_at_risk: parsedValue(fields.monthlyValueAtRisk),
      strategic_value: parsedValue(fields.strategicValue),
      mental_load: parsedValue(fields.mentalLoad),
      source: parsedValue(fields.source),
      external_id: typeof body.externalId === 'string' ? body.externalId.trim() || null : null,
      external_url: typeof body.externalUrl === 'string' ? body.externalUrl.trim() || null : null,
    } });
    if (body.initialWorkItem?.title) await tx.workItem.create({ data: {
      organization_id: auth.organizationId,
      project_id: created.id,
      title: String(body.initialWorkItem.title).trim(),
      assignee_membership_id: body.initialWorkItem.assigneeMembershipId || null,
      due_at: body.initialWorkItem.dueAt ? new Date(body.initialWorkItem.dueAt) : null,
      estimated_minutes: body.initialWorkItem.estimatedMinutes ?? null,
    } });
    return created;
  });
  return NextResponse.json(project, { status: 201 });
}

export const GET = withOrgContext(listProjects);
export const POST = withOrgContext(createProject, ['OWNER', 'ADMIN', 'OPERATOR']);
