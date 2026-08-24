import { withOrgContext } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextResponse, NextRequest } from 'next/server';
import { readRequiredString } from '@/lib/validation';

export const POST = withOrgContext(async (request: NextRequest, { params }: { params: { id: string } }, auth) => {
  if (auth.role === 'VIEWER') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }
  try {
    const body = await request.json();
    const summary = readRequiredString(body.summary, 'summary');
    const nextAction = readRequiredString(body.nextAction, 'nextAction');

    const project = await prisma.project.findFirst({
      where: { id: params.id, organization_id: auth.organizationId },
    });
    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado.' }, { status: 404 });
    }

    const update = await prisma.$transaction(async (tx) => {
      const pUpdate = await tx.projectUpdate.create({
        data: {
          organization_id: auth.organizationId,
          project_id: project.id,
          author_membership_id: auth.membershipId,
          summary,
          next_action: nextAction,
          blocker: body.blocker || null,
          confidence: body.confidence || 'CONFIRMED',
        },
      });

      await tx.project.update({
        where: { id: project.id },
        data: {
          last_update_at: new Date(),
          health: body.health || project.health,
          status: body.status || project.status,
        },
      });

      if (nextAction) {
        await tx.workItem.create({
          data: {
            organization_id: auth.organizationId,
            project_id: project.id,
            title: nextAction,
            status: 'OPEN',
            assignee_membership_id: body.nextActionAssignee || null,
          },
        });
      }

      if (body.blocker) {
        await tx.operationalBlocker.create({
          data: {
            organization_id: auth.organizationId,
            project_id: project.id,
            description: body.blocker,
            responsible_party: body.blockerResponsibleParty || 'CLIENT',
            blocks_delivery: true,
            status: 'OPEN',
          },
        });
      }

      return pUpdate;
    });

    return NextResponse.json(update, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
});
