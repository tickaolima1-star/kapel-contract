import { withOrgContext } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { readRequiredString, readNumberInRange } from '@/lib/validation';

export const GET = withOrgContext(async (request, context, auth) => {
  const projects = await prisma.project.findMany({
    where: { organization_id: auth.organizationId },
    orderBy: { created_at: 'desc' },
  });
  return NextResponse.json(projects);
});

export const POST = withOrgContext(async (request, context, auth) => {
  if (auth.role === 'VIEWER') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }
  try {
    const body = await request.json();
    const name = readRequiredString(body.name, 'name');
    const objective = readRequiredString(body.objective, 'objective');
    const strategicValue = readNumberInRange(body.strategicValue, 1, 5, 'strategicValue');
    const mentalLoad = readNumberInRange(body.mentalLoad, 1, 5, 'mentalLoad');

    const result = await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          organization_id: auth.organizationId,
          contracting_client_id: body.contractingClientId,
          contract_id: body.contractId || null,
          name,
          end_client_name: body.endClientName || null,
          objective,
          status: body.status || 'PLANNING',
          health: body.health || 'HEALTHY',
          owner_membership_id: body.ownerMembershipId,
          deadline: body.deadline ? new Date(body.deadline) : null,
          weekly_hours_estimate: Number(body.weeklyHoursEstimate || 0),
          monthly_value_at_risk: Number(body.monthlyValueAtRisk || 0),
          strategic_value: strategicValue,
          mental_load: mentalLoad,
          source: body.source || 'MANUAL',
        },
      });

      if (body.initialWorkItem && body.initialWorkItem.title) {
        await tx.workItem.create({
          data: {
            organization_id: auth.organizationId,
            project_id: project.id,
            title: body.initialWorkItem.title,
            assignee_membership_id: body.initialWorkItem.assigneeMembershipId || null,
            due_at: body.initialWorkItem.dueAt ? new Date(body.initialWorkItem.dueAt) : null,
            estimated_minutes: body.initialWorkItem.estimatedMinutes || null,
            status: 'OPEN',
          },
        });
      }

      return project;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
});
