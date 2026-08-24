import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withOrgContext } from '@/lib/api-auth';

export const GET = withOrgContext(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    const where: any = {};
    if (category) {
      where.category_id = category;
    }

    const services = await prisma.service.findMany({
      where,
      orderBy: [{ order: 'asc' }, { created_at: 'asc' }],
      include: {
        category: true,
      },
    });

    return NextResponse.json(services);
  } catch (error: any) {
    console.error('Erro ao listar serviços:', error);
    return NextResponse.json({ error: 'Erro ao listar serviços.' }, { status: 500 });
  }
});

export const POST = withOrgContext(async (req: NextRequest) => {
  try {
    const data = await req.json();

    if (!data.name || !data.category_id) {
      return NextResponse.json(
        { error: 'Nome do serviço e categoria são obrigatórios.' },
        { status: 400 }
      );
    }

    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const service = await prisma.service.create({
      data: {
        name: data.name.trim(),
        slug,
        category_id: data.category_id,
        description: data.description?.trim() || '',
        default_price: parseFloat(data.default_price) || 0.0,
        billing_type: data.billing_type || 'MONTHLY_ARREARS',
        active: data.active !== undefined ? data.active : true,
        order: parseInt(data.order) || 0,
        default_clauses: data.default_clauses ? JSON.stringify(data.default_clauses) : null,
      },
      include: { category: true },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar serviço:', error);
    return NextResponse.json({ error: 'Erro ao criar serviço.' }, { status: 500 });
  }
});

