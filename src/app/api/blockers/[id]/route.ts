import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withOrgContext, type OrgRequestContext } from '@/lib/api-auth';

type RouteContext = { params: { id: string } };

async function patchBlocker(req: NextRequest, { params }: RouteContext, auth: OrgRequestContext) {
  const body = await req.json();
  if (body.status === 'WAIVED' && !['OWNER', 'ADMIN'].includes(auth.role)) return NextResponse.json({ error: 'Acesso não autorizado para esta organização.' }, { status: 403 });
  if (body.status && !['OPEN', 'RESOLVED', 'WAIVED'].includes(body.status)) return NextResponse.json({ error: 'Status inválido.' }, { status: 400 });
  const result = await prisma.operationalBlocker.updateMany({ where: { id: params.id, organization_id: auth.organizationId }, data: {
    ...(body.status ? { status: body.status, resolved_at: body.status === 'RESOLVED' ? new Date() : null } : {}),
    ...(body.followUpAt !== undefined ? { follow_up_at: body.followUpAt ? new Date(body.followUpAt) : null } : {}),
    ...(body.blocksDelivery !== undefined ? { blocks_delivery: Boolean(body.blocksDelivery) } : {}),
  } });
  if (!result.count) return NextResponse.json({ error: 'Bloqueio não encontrado.' }, { status: 404 });
  return NextResponse.json(await prisma.operationalBlocker.findFirst({ where: { id: params.id, organization_id: auth.organizationId } }));
}

export const PATCH = withOrgContext<RouteContext>(patchBlocker, ['OWNER', 'ADMIN', 'OPERATOR']);
