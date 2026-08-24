import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withOrgContext } from '@/lib/api-auth';

export const GET = withOrgContext(async (req: NextRequest) => {
  try {
    const categories = await prisma.serviceCategory.findMany({
      orderBy: { order: 'asc' },
      include: { services: true },
    });
    return NextResponse.json(categories);
  } catch (error: any) {
    console.error('Erro ao listar categorias:', error);
    return NextResponse.json({ error: 'Erro ao listar categorias.' }, { status: 500 });
  }
});

