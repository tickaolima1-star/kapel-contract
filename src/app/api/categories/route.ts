import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withOrgContext } from '@/lib/api-auth';

async function listCategories() {
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
}

export const GET = withOrgContext(listCategories);
