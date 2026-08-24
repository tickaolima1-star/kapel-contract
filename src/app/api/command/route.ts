import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withOrgContext, type OrgRequestContext } from '@/lib/api-auth';
import { getCommandReadModel } from '@/lib/command/read-model';

async function getCommand(_req: NextRequest, _context: unknown, auth: OrgRequestContext) {
  return NextResponse.json(await getCommandReadModel(auth, new Date()));
}

async function commandAction(req: NextRequest, _context: unknown, auth: OrgRequestContext) {
  const body = await req.json();
  if (typeof body.workItemId !== 'string' || !['START', 'COMPLETE', 'DEFER', 'DELEGATE'].includes(body.action)) return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
  if (body.action === 'DEFER' && (typeof body.deferUntil !== 'string' || Number.isNaN(new Date(body.deferUntil).getTime()) || typeof body.reason !== 'string' || !body.reason.trim())) return NextResponse.json({ error: 'Adiamento exige nova data e motivo.' }, { status: 400 });
  if (body.action === 'DELEGATE' && typeof body.assigneeMembershipId !== 'string') return NextResponse.json({ error: 'Delegação exige um responsável.' }, { status: 400 });
  const item = await prisma.workItem.findFirst({ where: { id: body.workItemId, organization_id: auth.organizationId }, select: { id: true, status: true } });
  if (!item) return NextResponse.json({ error: 'Ação não encontrada.' }, { status: 404 });
  if (body.action === 'DELEGATE') {
    const assignee = await prisma.membership.findFirst({ where: { id: body.assigneeMembershipId, organization_id: auth.organizationId }, select: { id: true } });
    if (!assignee) return NextResponse.json({ error: 'Responsável não encontrado.' }, { status: 400 });
  }
  const resultingStatus = body.action === 'START' ? 'DOING' : body.action === 'COMPLETE' ? 'DONE' : 'OPEN';
  const updated = await prisma.$transaction(async tx => {
    await tx.workItem.updateMany({ where: { id: item.id, organization_id: auth.organizationId }, data: {
      status: resultingStatus, completed_at: body.action === 'COMPLETE' ? new Date() : null,
      ...(body.action === 'DEFER' ? { due_at: new Date(body.deferUntil) } : {}),
      ...(body.action === 'DELEGATE' ? { assignee_membership_id: body.assigneeMembershipId } : {}),
    } });
    await tx.commandAction.create({ data: { organization_id: auth.organizationId, work_item_id: item.id, actor_membership_id: auth.membershipId, action: body.action, previous_status: item.status, resulting_status: resultingStatus, reason: typeof body.reason === 'string' ? body.reason.trim() || null : null } });
    return tx.workItem.findFirst({ where: { id: item.id, organization_id: auth.organizationId } });
  });
  return NextResponse.json(updated);
}

export const GET = withOrgContext(getCommand);
export const POST = withOrgContext(commandAction, ['OWNER', 'ADMIN', 'OPERATOR']);
