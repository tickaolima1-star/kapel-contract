import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withOrgContext } from '@/lib/api-auth';

async function updateService(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await req.json();

    const service = await prisma.service.update({
      where: { id: params.id },
      data: {
        name: data.name?.trim(),
        category_id: data.category_id,
        description: data.description?.trim(),
        default_price: parseFloat(data.default_price) || 0.0,
        billing_type: data.billing_type,
        active: data.active !== undefined ? data.active : true,
        order: parseInt(data.order) || 0,
      },
      include: { category: true },
    });

    return NextResponse.json(service);
  } catch (error: any) {
    console.error('Erro ao atualizar serviço:', error);
    return NextResponse.json({ error: 'Erro ao atualizar serviço.' }, { status: 500 });
  }
}

async function deleteService(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.service.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao excluir serviço:', error);
    return NextResponse.json({ error: 'Não foi possível excluir o serviço.' }, { status: 500 });
  }
}

export const PUT = withOrgContext(updateService, ['OWNER', 'ADMIN']);
export const DELETE = withOrgContext(deleteService, ['OWNER', 'ADMIN']);
