import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, hashPassword } from '@/lib/auth';
import { withSession } from '@/lib/api-auth';

export const POST = withSession(async (req: NextRequest, context: any, session) => {
  try {
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Senha atual e nova senha são obrigatórias.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'A nova senha deve ter no mínimo 8 caracteres.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado.' },
        { status: 404 }
      );
    }

    const isCurrentValid = await verifyPassword(currentPassword, user.password);
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: 'Senha atual incorreta.' },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: newHash },
    });

    // Registrar auditoria
    await prisma.auditLog.create({
      data: {
        user_name: user.name,
        action: 'PASSWORD_CHANGED',
        details: `Senha de acesso alterada com sucesso pelo usuário ${user.email}.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Senha alterada com sucesso!',
    });
  } catch (error: any) {
    console.error('Erro ao alterar senha:', error);
    return NextResponse.json(
      { error: 'Erro interno ao alterar senha.' },
      { status: 500 }
    );
  }
});

