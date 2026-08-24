import { NextRequest, NextResponse } from 'next/server';
import { getSession, type AuthSession } from './auth';
import { prisma } from './prisma';

export type MembershipRole = 'OWNER' | 'ADMIN' | 'OPERATOR' | 'VIEWER';

export type OrgRequestContext = {
  session: AuthSession;
  organizationId: string;
  membershipId: string;
  role: MembershipRole;
};

export function withSession<TContext>(
  handler: (request: NextRequest, context: TContext, session: AuthSession) => Promise<Response>,
): (request: NextRequest, context: TContext) => Promise<Response> {
  return async (request, context) => {
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Sessão inválida ou expirada.' }, { status: 401 });
    }
    return handler(request, context, session);
  };
}

export function withOrgContext<TContext>(
  handler: (request: NextRequest, context: TContext, auth: OrgRequestContext) => Promise<Response>,
  allowedRoles?: MembershipRole[],
): (request: NextRequest, context: TContext) => Promise<Response> {
  return withSession(async (request, context, session) => {
    const membership = await prisma.membership.findFirst({
      where: { user_id: session.user.id, organization: { active: true } },
      orderBy: { created_at: 'asc' },
      select: { id: true, organization_id: true, role: true },
    });
    if (!membership || (allowedRoles && !allowedRoles.includes(membership.role))) {
      return NextResponse.json(
        { error: 'Acesso não autorizado para esta organização.' },
        { status: 403 },
      );
    }
    return handler(request, context, {
      session,
      organizationId: membership.organization_id,
      membershipId: membership.id,
      role: membership.role,
    });
  });
}
