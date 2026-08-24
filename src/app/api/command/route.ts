import { withOrgContext } from '@/lib/api-auth';
import { getCommandReadModel } from '@/lib/command/read-model';
import { prisma } from '@/lib/prisma';
import { NextResponse, NextRequest } from 'next/server';
import { readRequiredString } from '@/lib/validation';

export const GET = withOrgContext(async (request: NextRequest, context: any, auth: any) => {
  const model = await getCommandReadModel(auth, new Date());
  return NextResponse.json(model);
});

export const POST = withOrgContext(async (request: NextRequest, context: any, auth: any) => {
  if (auth.role === 'VIEWER') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }
  try {
    const body = await request.json();
    const workItemId = readRequiredString(body.workItemId, 'workItemId');
    const action = readRequiredString(body.action, 'action'); // START, COMPLETE, DEFER, DELEGATE

    const item = await prisma.workItem.findFirst({
      where: { id: workItemId, organization_id: auth.organizationId },
    });
    if (!item) {
      return NextResponse.json({ error: 'Item não encontrado.' }, { status: 404 });
    }

    const previousStatus = item.status;
    let resultingStatus = item.status;

    if (action === 'COMPLETE') {
      resultingStatus = 'DONE';
    } else if (action === 'DEFER') {
      resultingStatus = 'OPEN';
    } else if (action === 'START') {
      resultingStatus = 'DOING';
    }

    const log = await prisma.$transaction(async (tx) => {
      const updatedItem = await tx.workItem.update({
        where: { id: item.id },
        data: {
          status: resultingStatus,
          completed_at: resultingStatus === 'DONE' ? new Date() : null,
        },
      });

      return await tx.commandAction.create({
        data: {
          organization_id: auth.organizationId,
          work_item_id: item.id,
          actor_membership_id: auth.membershipId,
          action: action as any,
          previous_status: previousStatus,
          resulting_status: resultingStatus,
          reason: body.reason || null,
        },
      });
    });

    return NextResponse.json(log);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
});
