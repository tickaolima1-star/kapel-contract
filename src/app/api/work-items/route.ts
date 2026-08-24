import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withOrgContext, type OrgRequestContext } from '@/lib/api-auth';
import { readRequiredString } from '@/lib/validation';

async function listWorkItems(req: NextRequest, _context: unknown, auth: OrgRequestContext) {
  const projectId = req.nextUrl.searchParams.get('projectId') || undefined;
  return NextResponse.json(await prisma.workItem.findMany({ where: { organization_id: auth.organizationId, ...(projectId ? { project_id: projectId } : {}) }, orderBy: [{ due_at: 'asc' }, { created_at: 'asc' }], include: { project: true, assignee: { include: { user: true } } } }));
}

async function createWorkItem(req: NextRequest, _context: unknown, auth: OrgRequestContext) {
  const body = await req.json();
  const title = readRequiredString(body.title, 'Ação');
  if (!title.ok) return NextResponse.json({ error: title.message, fieldErrors: { title: title.message } }, { status: 400 });
  const project = await prisma.project.findFirst({ where: { id: body.projectId, organization_id: auth.organizationId }, select: { id: true } });
  if (!project) return NextResponse.json({ error: 'Projeto não encontrado.' }, { status: 404 });
  if (body.assigneeMembershipId) {
    const assignee = await prisma.membership.findFirst({ where: { id: body.assigneeMembershipId, organization_id: auth.organizationId }, select: { id: true } });
    if (!assignee) return NextResponse.json({ error: 'Responsável não encontrado.' }, { status: 400 });
  }
  if (body.estimatedMinutes != null && (!Number.isInteger(body.estimatedMinutes) || body.estimatedMinutes <= 0)) return NextResponse.json({ error: 'Estimativa deve ser positiva.', fieldErrors: { estimatedMinutes: 'Estimativa deve ser positiva.' } }, { status: 400 });
  return NextResponse.json(await prisma.workItem.create({ data: {
    organization_id: auth.organizationId, project_id: body.projectId, title: title.value,
    type: body.type || 'ACTION', assignee_membership_id: body.assigneeMembershipId || null,
    due_at: body.dueAt ? new Date(body.dueAt) : null, estimated_minutes: body.estimatedMinutes ?? null,
  } }), { status: 201 });
}

export const GET = withOrgContext(listWorkItems);
export const POST = withOrgContext(createWorkItem, ['OWNER', 'ADMIN', 'OPERATOR']);
