import { withOrgContext } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextResponse, NextRequest } from 'next/server';
import { readRequiredString } from '@/lib/validation';

export const GET = withOrgContext(async (request, context, auth) => {
  const blockers = await prisma.operationalBlocker.findMany({
    where: { organization_id: auth.organizationId },
    orderBy: { created_at: 'desc' },
  });
  return NextResponse.json(blockers);
});

export const POST = withOrgContext(async (request, context, auth) => {
  if (auth.role === 'VIEWER') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }
  try {
    const body = await request.json();
    const description = readRequiredString(body.description, 'description');
    const projectId = readRequiredString(body.projectId, 'projectId');

    const project = await prisma.project.findFirst({
      where: { id: projectId, organization_id: auth.organizationId },
    });
    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado.' }, { status: 404 });
    }

    const blocker = await prisma.operationalBlocker.create({
      data: {
        organization_id: auth.organizationId,
        project_id: projectId,
        description,
        responsible_party: body.responsibleParty || 'CLIENT',
        blocks_delivery: body.blocksDelivery !== undefined ? Boolean(body.blocksDelivery) : true,
        status: 'OPEN',
        follow_up_at: body.followUpAt ? new Date(body.followUpAt) : null,
      },
    });

    return NextResponse.json(blocker, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
});
