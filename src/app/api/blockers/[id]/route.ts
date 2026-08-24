import { withOrgContext } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextResponse, NextRequest } from 'next/server';

export const PATCH = withOrgContext(async (request, { params }: { params: { id: string } }, auth) => {
  if (auth.role === 'VIEWER') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }
  const existing = await prisma.operationalBlocker.findFirst({
    where: { id: params.id, organization_id: auth.organizationId },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Blocker não encontrado.' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const data: any = {};

    if (body.status) {
      if (body.status === 'WAIVED' && auth.role !== 'OWNER' && auth.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Apenas Administradores podem dispensar impedimentos.' }, { status: 403 });
      }
      data.status = body.status;
      if (body.status === 'RESOLVED' || body.status === 'WAIVED') {
        data.resolved_at = new Date();
      } else {
        data.resolved_at = null;
      }
    }
    if (body.description) data.description = body.description;
    if (body.responsibleParty) data.responsible_party = body.responsibleParty;
    if (body.blocksDelivery !== undefined) data.blocks_delivery = Boolean(body.blocksDelivery);
    if (body.followUpAt !== undefined) data.follow_up_at = body.followUpAt ? new Date(body.followUpAt) : null;

    const updated = await prisma.operationalBlocker.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
});

export const DELETE = withOrgContext(async (request, { params }: { params: { id: string } }, auth) => {
  if (auth.role === 'VIEWER') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }
  const existing = await prisma.operationalBlocker.findFirst({
    where: { id: params.id, organization_id: auth.organizationId },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Blocker não encontrado.' }, { status: 404 });
  }
  await prisma.operationalBlocker.delete({
    where: { id: params.id },
  });
  return NextResponse.json({ success: true });
});
export const PUT = PATCH;
