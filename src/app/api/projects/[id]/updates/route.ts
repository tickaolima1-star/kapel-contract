import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withOrgContext, type OrgRequestContext } from '@/lib/api-auth';
import { readRequiredString } from '@/lib/validation';

type RouteContext = { params: { id: string } };

async function addUpdate(req: NextRequest, { params }: RouteContext, auth: OrgRequestContext) {
  const body = await req.json();
  const summary = readRequiredString(body.summary, 'Resumo');
  const nextAction = readRequiredString(body.nextAction, 'Próxima ação');
  if (!summary.ok || !nextAction.ok) return NextResponse.json({ error: 'Revise os campos informados.', fieldErrors: {
    ...(!summary.ok ? { summary: summary.message } : {}), ...(!nextAction.ok ? { nextAction: nextAction.message } : {}),
  } }, { status: 400 });
  const project = await prisma.project.findFirst({ where: { id: params.id, organization_id: auth.organizationId }, select: { id: true } });
  if (!project) return NextResponse.json({ error: 'Projeto não encontrado.' }, { status: 404 });
  const assigneeId = body.nextActionAssigneeMembershipId || auth.membershipId;
  const assignee = await prisma.membership.findFirst({ where: { id: assigneeId, organization_id: auth.organizationId }, select: { id: true } });
  if (!assignee) return NextResponse.json({ error: 'Responsável pela ação não encontrado.' }, { status: 400 });
  const createdAt = new Date();
  const result = await prisma.$transaction(async tx => {
    const update = await tx.projectUpdate.create({ data: {
      organization_id: auth.organizationId, project_id: params.id, author_membership_id: auth.membershipId,
      summary: summary.value, next_action: nextAction.value,
      blocker: typeof body.blocker === 'string' ? body.blocker.trim() || null : null,
      metric_label: typeof body.metricLabel === 'string' ? body.metricLabel.trim() || null : null,
      metric_value: typeof body.metricValue === 'string' ? body.metricValue.trim() || null : null,
      confidence: body.confidence === 'ESTIMATED' ? 'ESTIMATED' : 'CONFIRMED', created_at: createdAt,
    } });
    await tx.workItem.create({ data: {
      organization_id: auth.organizationId, project_id: params.id, assignee_membership_id: assigneeId,
      title: nextAction.value, due_at: body.nextActionDueAt ? new Date(body.nextActionDueAt) : null,
      estimated_minutes: body.nextActionEstimatedMinutes ?? null,
    } });
    await tx.project.updateMany({ where: { id: params.id, organization_id: auth.organizationId }, data: {
      last_update_at: createdAt, ...(body.health ? { health: body.health } : {}), ...(body.status ? { status: body.status } : {}),
    } });
    if (typeof body.blocker === 'string' && body.blocker.trim()) await tx.operationalBlocker.create({ data: {
      organization_id: auth.organizationId, project_id: params.id, description: body.blocker.trim(),
      responsible_party: body.blockerResponsibleParty || 'KAPEL',
      follow_up_at: body.blockerFollowUpAt ? new Date(body.blockerFollowUpAt) : null,
    } });
    return update;
  });
  return NextResponse.json(result, { status: 201 });
}

export const POST = withOrgContext<RouteContext>(addUpdate, ['OWNER', 'ADMIN', 'OPERATOR']);
