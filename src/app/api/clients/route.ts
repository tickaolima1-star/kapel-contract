import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withOrgContext } from '@/lib/api-auth';

export const GET = withOrgContext(async (req: NextRequest, context: any, auth) => {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || '';

    const where: any = {
      organization_id: auth.organizationId,
    };
    if (type) {
      where.type = type;
    }
    if (query) {
      where.OR = [
        { legal_name: { contains: query } },
        { trade_name: { contains: query } },
        { document: { contains: query } },
        { email: { contains: query } },
        { representative_name: { contains: query } },
      ];
    }

    const clients = await prisma.client.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: { contracts: true },
        },
      },
    });

    return NextResponse.json(clients);
  } catch (error: any) {
    console.error('Erro ao listar clientes:', error);
    return NextResponse.json({ error: 'Erro ao listar clientes.' }, { status: 500 });
  }
});

export const POST = withOrgContext(async (req: NextRequest, context: any, auth) => {
  try {
    const data = await req.json();

    if (!data.legal_name || !data.document) {
      return NextResponse.json(
        { error: 'Nome/Razão Social e CPF/CNPJ são obrigatórios.' },
        { status: 400 }
      );
    }

    const client = await prisma.client.create({
      data: {
        organization_id: auth.organizationId,
        type: data.type || 'PJ',
        legal_name: data.legal_name.trim(),
        trade_name: data.trade_name ? data.trade_name.trim() : null,
        document: data.document.trim(),
        state_registration: data.state_registration?.trim() || null,
        address: data.address?.trim() || null,
        address_number: data.address_number?.trim() || null,
        neighborhood: data.neighborhood?.trim() || null,
        zip_code: data.zip_code?.trim() || null,
        city: data.city?.trim() || null,
        state: data.state?.trim() || null,
        representative_name: data.representative_name?.trim() || null,
        representative_cpf: data.representative_cpf?.trim() || null,
        representative_role: data.representative_role?.trim() || null,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        whatsapp: data.whatsapp?.trim() || null,
        notes: data.notes?.trim() || null,
        active: data.active !== undefined ? data.active : true,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar cliente:', error);
    return NextResponse.json({ error: 'Erro ao criar cliente.' }, { status: 500 });
  }
});

