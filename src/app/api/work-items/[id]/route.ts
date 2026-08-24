import { withOrgContext } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextResponse, NextRequest } from 'next/server';

export const PATCH = withOrgContext(async (request, { params }: { params: { id: string } }, auth) => {
  if (auth.role === 'VIEWER') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }
  const existing = await prisma.workItem.findFirst({
    where: { id: params.id, organization_id: auth.organizationId },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Item não encontrado.' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const data: any = {};
    if (body.status) {
      data.status = body.status;
      if (body.status === 'DONE') {
        data.completed_at = new Date();
      } else {
        data.completed_at = null;
      }
    }
    if (body.title) data.title = body.title;
    if (body.type) data.type = body.type;
    if (body.dueAt !== undefined) data.due_at = body.dueAt ? new Date(body.dueAt) : null;
    if (body.estimatedMinutes !== undefined) data.estimated_minutes = body.estimatedMinutes ? Number(body.estimatedMinutes) : null;
    if (body.assigneeMembershipId !== undefined) data.assignee_membership_id = body.assigneeMembershipId || null;

    const updated = await prisma.workItem.update({
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
  const existing = await prisma.workItem.findFirst({
    where: { id: params.id, organization_id: auth.organizationId },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Item não encontrado.' }, { status: 404 });
  }
  await prisma.workItem.delete({
    where: { id: params.id },
  });
  return NextResponse.json({ success: true });
});
export const PUT = PATCH;
