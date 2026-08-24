import { withOrgContext } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextResponse, NextRequest } from 'next/server';
import { readRequiredString } from '@/lib/validation';

export const GET = withOrgContext(async (request, context, auth) => {
  const workItems = await prisma.workItem.findMany({
    where: { organization_id: auth.organizationId },
    orderBy: { created_at: 'desc' },
  });
  return NextResponse.json(workItems);
});

export const POST = withOrgContext(async (request, context, auth) => {
  if (auth.role === 'VIEWER') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }
  try {
    const body = await request.json();
    const title = readRequiredString(body.title, 'title');
    const projectId = readRequiredString(body.projectId, 'projectId');

    const project = await prisma.project.findFirst({
      where: { id: projectId, organization_id: auth.organizationId },
    });
    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado.' }, { status: 404 });
    }

    const workItem = await prisma.workItem.create({
      data: {
        organization_id: auth.organizationId,
        project_id: projectId,
        title,
        type: body.type || 'ACTION',
        status: body.status || 'OPEN',
        due_at: body.dueAt ? new Date(body.dueAt) : null,
        estimated_minutes: body.estimatedMinutes ? Number(body.estimatedMinutes) : null,
        assignee_membership_id: body.assigneeMembershipId || null,
      },
    });

    return NextResponse.json(workItem, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
});
