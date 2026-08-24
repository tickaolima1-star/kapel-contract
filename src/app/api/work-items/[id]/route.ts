import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withOrgContext, type OrgRequestContext } from '@/lib/api-auth';

type RouteContext = { params: { id: string } };
const STATUSES = ['OPEN', 'DOING', 'DONE', 'BLOCKED', 'CANCELLED'];

async function patchWorkItem(req: NextRequest, { params }: RouteContext, auth: OrgRequestContext) {
  const body = await req.json();
  if (body.status !== undefined && !STATUSES.includes(body.status)) return NextResponse.json({ error: 'Status inválido.', fieldErrors: { status: 'Status inválido.' } }, { status: 400 });
  if (body.estimatedMinutes !== undefined && body.estimatedMinutes !== null && (!Number.isInteger(body.estimatedMinutes) || body.estimatedMinutes <= 0)) return NextResponse.json({ error: 'Estimativa deve ser positiva.' }, { status: 400 });
  if (body.assigneeMembershipId) {
    const assignee = await prisma.membership.findFirst({ where: { id: body.assigneeMembershipId, organization_id: auth.organizationId }, select: { id: true } });
    if (!assignee) return NextResponse.json({ error: 'Responsável não encontrado.' }, { status: 400 });
  }
  const result = await prisma.workItem.updateMany({ where: { id: params.id, organization_id: auth.organizationId }, data: {
    ...(body.status !== undefined ? { status: body.status, completed_at: body.status === 'DONE' ? new Date() : null } : {}),
    ...(body.assigneeMembershipId !== undefined ? { assignee_membership_id: body.assigneeMembershipId } : {}),
    ...(body.dueAt !== undefined ? { due_at: body.dueAt ? new Date(body.dueAt) : null } : {}),
    ...(body.estimatedMinutes !== undefined ? { estimated_minutes: body.estimatedMinutes } : {}),
  } });
  if (!result.count) return NextResponse.json({ error: 'Ação não encontrada.' }, { status: 404 });
  return NextResponse.json(await prisma.workItem.findFirst({ where: { id: params.id, organization_id: auth.organizationId } }));
}

export const PATCH = withOrgContext<RouteContext>(patchWorkItem, ['OWNER', 'ADMIN', 'OPERATOR']);
