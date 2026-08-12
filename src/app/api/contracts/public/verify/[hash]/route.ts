import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { hash: string } }
) {
  try {
    const contract = await prisma.contract.findUnique({
      where: { audit_hash: params.hash },
      include: {
        client: true,
        template: true,
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Certificado não encontrado ou hash de verificação inválido.' },
        { status: 404 }
      );
    }

    const settings = await prisma.companySettings.findUnique({
      where: { id: 'default' },
    });

    return NextResponse.json({
      valid: true,
      badge: 'KAPEL VERIFIED - ASSINATURA ELETRÔNICA VÁLIDA (Lei 14.063/2020)',
      contract_number: contract.contract_number,
      contract_title: contract.title,
      audit_hash: contract.audit_hash,
      signature_status: contract.signature_status,
      finalized_at: contract.signed_client_at,
      kapel: {
        company: settings?.legal_name || 'KAPEL',
        cnpj: settings?.cnpj || contract.signed_kapel_doc,
        signer_name: contract.signed_kapel_name,
        signed_at: contract.signed_kapel_at,
        ip: contract.signed_kapel_ip,
        signature_data: contract.signed_kapel_signature_data,
      },
      client: {
        legal_name: contract.client.legal_name,
        document: contract.client.document,
        signer_name: contract.signed_client_name,
        signed_at: contract.signed_client_at,
        ip: contract.signed_client_ip,
        signature_data: contract.signed_client_signature_data,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao verificar certificado.' }, { status: 500 });
  }
}
