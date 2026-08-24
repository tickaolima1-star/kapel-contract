import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withOrgContext, type OrgRequestContext } from '@/lib/api-auth';
import { readEnum, readRequiredString } from '@/lib/validation';

const PARTIES = ['KAPEL', 'CLIENT', 'PARTNER', 'THIRD_PARTY'] as const;

async function listBlockers(req: NextRequest, _context: unknown, auth: OrgRequestContext) {
  const projectId = req.nextUrl.searchParams.get('projectId') || undefined;
  return NextResponse.json(await prisma.operationalBlocker.findMany({ where: { organization_id: auth.organizationId, ...(projectId ? { project_id: projectId } : {}) }, orderBy: [{ status: 'asc' }, { follow_up_at: 'asc' }], include: { project: true } }));
}

async function createBlocker(req: NextRequest, _context: unknown, auth: OrgRequestContext) {
  const body = await req.json();
  const description = readRequiredString(body.description, 'Bloqueio');
  const party = readEnum(body.responsibleParty, PARTIES, 'Responsável externo');
  if (!description.ok || !party.ok) return NextResponse.json({ error: 'Revise os campos informados.', fieldErrors: {
    ...(!description.ok ? { description: description.message } : {}), ...(!party.ok ? { responsibleParty: party.message } : {}),
  } }, { status: 400 });
  const project = await prisma.project.findFirst({ where: { id: body.projectId, organization_id: auth.organizationId }, select: { id: true } });
  if (!project) return NextResponse.json({ error: 'Projeto não encontrado.' }, { status: 404 });
  return NextResponse.json(await prisma.operationalBlocker.create({ data: {
    organization_id: auth.organizationId, project_id: body.projectId, description: description.value,
    responsible_party: party.value, blocks_delivery: body.blocksDelivery !== false,
    follow_up_at: body.followUpAt ? new Date(body.followUpAt) : null,
  } }), { status: 201 });
}

export const GET = withOrgContext(listBlockers);
export const POST = withOrgContext(createBlocker, ['OWNER', 'ADMIN', 'OPERATOR']);
