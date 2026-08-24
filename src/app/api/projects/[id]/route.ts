import { withOrgContext } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextResponse, NextRequest } from 'next/server';

export const GET = withOrgContext(async (request, { params }: { params: { id: string } }, auth) => {
  const project = await prisma.project.findFirst({
    where: { id: params.id, organization_id: auth.organizationId },
    include: { contracting_client: true, updates: true, work_items: true, blockers: true },
  });
  if (!project) {
    return NextResponse.json({ error: 'Projeto não encontrado.' }, { status: 404 });
  }
  return NextResponse.json(project);
});

export const PATCH = withOrgContext(async (request, { params }: { params: { id: string } }, auth) => {
  if (auth.role === 'VIEWER') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }
  const existing = await prisma.project.findFirst({
    where: { id: params.id, organization_id: auth.organizationId },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Projeto não encontrado.' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const updated = await prisma.project.update({
      where: { id: params.id },
      data: {
        name: body.name || undefined,
        objective: body.objective || undefined,
        status: body.status || undefined,
        health: body.health || undefined,
        deadline: body.deadline ? new Date(body.deadline) : undefined,
        weekly_hours_estimate: body.weeklyHoursEstimate !== undefined ? Number(body.weeklyHoursEstimate) : undefined,
        monthly_value_at_risk: body.monthlyValueAtRisk !== undefined ? Number(body.monthlyValueAtRisk) : undefined,
        strategic_value: body.strategicValue !== undefined ? Number(body.strategicValue) : undefined,
        mental_load: body.mentalLoad !== undefined ? Number(body.mentalLoad) : undefined,
      },
    });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
});

export const DELETE = withOrgContext(async (request, { params }: { params: { id: string } }, auth) => {
  if (auth.role !== 'OWNER' && auth.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }
  const existing = await prisma.project.findFirst({
    where: { id: params.id, organization_id: auth.organizationId },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Projeto não encontrado.' }, { status: 404 });
  }
  await prisma.project.delete({
    where: { id: params.id },
  });
  return NextResponse.json({ success: true });
});
export const PUT = PATCH;
