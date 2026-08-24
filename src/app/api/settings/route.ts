import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withOrgContext } from '@/lib/api-auth';

async function getSettings() {
  try {
    let settings = await prisma.companySettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await prisma.companySettings.create({
        data: {
          id: 'default',
          legal_name: '67.726.428 PATRICK EDUARDO LIMA SILVA',
          trade_name: 'KAPEL',
          cnpj: '67.726.428/0001-97',
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Erro ao buscar configurações da empresa:', error);
    return NextResponse.json({ error: 'Erro ao buscar configurações.' }, { status: 500 });
  }
}

async function updateSettings(req: NextRequest) {
  try {
    const data = await req.json();

    const updated = await prisma.companySettings.upsert({
      where: { id: 'default' },
      update: {
        legal_name: data.legal_name?.trim(),
        trade_name: data.trade_name?.trim(),
        cnpj: data.cnpj?.trim(),
        address: data.address?.trim(),
        neighborhood: data.neighborhood?.trim(),
        zip_code: data.zip_code?.trim(),
        city: data.city?.trim(),
        state: data.state?.trim(),
        legal_representative: data.legal_representative?.trim(),
        rep_cpf: data.rep_cpf?.trim(),
        email: data.email?.trim(),
        phone: data.phone?.trim(),
        jurisdiction_city: data.jurisdiction_city?.trim(),
        jurisdiction_state: data.jurisdiction_state?.trim(),
      },
      create: {
        id: 'default',
        legal_name: data.legal_name?.trim() || '67.726.428 PATRICK EDUARDO LIMA SILVA',
        trade_name: data.trade_name?.trim() || 'KAPEL',
        cnpj: data.cnpj?.trim() || '67.726.428/0001-97',
        address: data.address?.trim() || '',
        neighborhood: data.neighborhood?.trim() || '',
        zip_code: data.zip_code?.trim() || '',
        city: data.city?.trim() || '',
        state: data.state?.trim() || '',
        legal_representative: data.legal_representative?.trim() || '',
        rep_cpf: data.rep_cpf?.trim() || '',
        email: data.email?.trim() || '',
        phone: data.phone?.trim() || '',
        jurisdiction_city: data.jurisdiction_city?.trim() || 'São Paulo',
        jurisdiction_state: data.jurisdiction_state?.trim() || 'SP',
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Erro ao atualizar configurações:', error);
    return NextResponse.json({ error: 'Erro ao atualizar configurações.' }, { status: 500 });
  }
}

export const GET = withOrgContext(getSettings);
export const PUT = withOrgContext(updateSettings, ['OWNER', 'ADMIN']);
