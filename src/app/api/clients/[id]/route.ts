import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        contracts: {
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error: any) {
    console.error('Erro ao buscar cliente:', error);
    return NextResponse.json({ error: 'Erro ao buscar cliente.' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await req.json();

    const client = await prisma.client.update({
      where: { id: params.id },
      data: {
        type: data.type,
        legal_name: data.legal_name?.trim(),
        trade_name: data.trade_name?.trim() || null,
        document: data.document?.trim(),
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

    return NextResponse.json(client);
  } catch (error: any) {
    console.error('Erro ao atualizar cliente:', error);
    return NextResponse.json({ error: 'Erro ao atualizar cliente.' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.client.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao excluir cliente:', error);
    return NextResponse.json({ error: 'Não foi possível excluir o cliente.' }, { status: 500 });
  }
}
