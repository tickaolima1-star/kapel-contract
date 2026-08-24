import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withOrgContext, type OrgRequestContext } from '@/lib/api-auth';

type RouteContext = { params: { id: string } };

async function getProject(_req: NextRequest, { params }: RouteContext, auth: OrgRequestContext) {
  const project = await prisma.project.findFirst({ where: { id: params.id, organization_id: auth.organizationId }, include: {
    contracting_client: true, contract: true, owner: { include: { user: true } },
    updates: { orderBy: { created_at: 'desc' } }, work_items: { orderBy: { created_at: 'desc' } }, blockers: { orderBy: { created_at: 'desc' } },
  } });
  return project ? NextResponse.json(project) : NextResponse.json({ error: 'Projeto não encontrado.' }, { status: 404 });
}

async function patchProject(req: NextRequest, { params }: RouteContext, auth: OrgRequestContext) {
  const body = await req.json();
  if (body.status === 'CANCELLED' && !['OWNER', 'ADMIN'].includes(auth.role)) return NextResponse.json({ error: 'Acesso não autorizado para esta organização.' }, { status: 403 });
  if (body.ownerMembershipId) {
    const owner = await prisma.membership.findFirst({ where: { id: body.ownerMembershipId, organization_id: auth.organizationId }, select: { id: true } });
    if (!owner) return NextResponse.json({ error: 'Responsável não encontrado.' }, { status: 400 });
  }
  const result = await prisma.project.updateMany({ where: { id: params.id, organization_id: auth.organizationId }, data: {
    ...(typeof body.name === 'string' && body.name.trim() ? { name: body.name.trim() } : {}),
    ...(typeof body.objective === 'string' && body.objective.trim() ? { objective: body.objective.trim() } : {}),
    ...(body.status ? { status: body.status } : {}), ...(body.health ? { health: body.health } : {}),
    ...(body.ownerMembershipId ? { owner_membership_id: body.ownerMembershipId } : {}),
    ...(body.deadline !== undefined ? { deadline: body.deadline ? new Date(body.deadline) : null } : {}),
  } });
  if (!result.count) return NextResponse.json({ error: 'Projeto não encontrado.' }, { status: 404 });
  return NextResponse.json(await prisma.project.findFirst({ where: { id: params.id, organization_id: auth.organizationId } }));
}

export const GET = withOrgContext<RouteContext>(getProject);
export const PATCH = withOrgContext<RouteContext>(patchProject, ['OWNER', 'ADMIN', 'OPERATOR']);
