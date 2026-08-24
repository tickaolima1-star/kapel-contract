import { NextRequest, NextResponse } from 'next/server';
import { AuthSession, AUTH_COOKIE_NAME, verifySessionToken } from './auth';
import { MembershipRole } from '@prisma/client';
import { prisma } from './prisma';

export type { MembershipRole };

export type OrgRequestContext = {
  session: AuthSession;
  organizationId: string;
  membershipId: string;
  role: MembershipRole;
};

export function withSession<TContext>(
  handler: (request: NextRequest, context: TContext, session: AuthSession) => Promise<Response>,
): (request: NextRequest, context: TContext) => Promise<Response> {
  return async (request: NextRequest, context: TContext) => {
    const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME);
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ error: 'Sessão inválida ou expirada.' }, { status: 401 });
    }
    const session = verifySessionToken(sessionCookie.value);
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
      where: {
        user_id: session.user.id,
        organization: { active: true },
      },
      orderBy: { created_at: 'asc' },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Acesso não autorizado para esta organização.' }, { status: 403 });
    }

    if (allowedRoles && !allowedRoles.includes(membership.role)) {
      return NextResponse.json({ error: 'Acesso não autorizado para esta organização.' }, { status: 403 });
    }

    return handler(request, context, {
      session,
      organizationId: membership.organization_id,
      membershipId: membership.id,
      role: membership.role,
    });
  });
}

