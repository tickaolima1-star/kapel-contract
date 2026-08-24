import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateDocPrefix, generateAuditHash } from '@/lib/signature';
import { initializeOperationalProject } from '@/lib/engine/project-initializer';


// GET: Buscar contrato público para o cliente assinar
export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const contract = await prisma.contract.findUnique({
      where: { signature_token: params.token },
      include: {
        client: true,
        items: true,
        template: true,
      },
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contrato não encontrado ou link inválido.' }, { status: 404 });
    }

    const settings = await prisma.companySettings.findUnique({
      where: { id: 'default' },
    });

    // Retorna payload seguro para exibição ao cliente
    return NextResponse.json({
      contract_number: contract.contract_number,
      title: contract.title,
      status: contract.status,
      signature_status: contract.signature_status,
      client_name: contract.client.legal_name,
      client_doc: contract.client.document,
      client_trade_name: contract.client.trade_name,
      client_email: contract.client.email,
      kapel_company: settings?.legal_name || 'KAPEL',
      kapel_cnpj: settings?.cnpj,
      kapel_representative: settings?.legal_representative,
      signed_kapel_at: contract.signed_kapel_at,
      signed_kapel_name: contract.signed_kapel_name,
      signed_client_at: contract.signed_client_at,
      audit_hash: contract.audit_hash,
      items: contract.items,
      calculated_mrr: contract.calculated_mrr,
      calculated_total_one_time: contract.calculated_total_one_time,
      created_at: contract.created_at,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao buscar contrato.' }, { status: 500 });
  }
}

// POST: Registrar Assinatura do Cliente
export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const body = await request.json();
    const { doc_prefix_4, signature_data, signer_name } = body;

    if (!doc_prefix_4 || !signature_data) {
      return NextResponse.json(
        { error: 'Confirmação dos 4 dígitos e visto são obrigatórios.' },
        { status: 400 }
      );
    }

    const contract = await prisma.contract.findUnique({
      where: { signature_token: params.token },
      include: { client: true },
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contrato não encontrado.' }, { status: 404 });
    }

    if (contract.signature_status === 'SIGNED') {
      return NextResponse.json(
        { error: 'Este contrato já foi assinado por ambas as partes.', audit_hash: contract.audit_hash },
        { status: 400 }
      );
    }

    // Validar os 4 primeiros dígitos do documento do Cliente
    if (!validateDocPrefix(contract.client.document, doc_prefix_4)) {
      return NextResponse.json(
        { error: 'Os 4 primeiros dígitos informados não correspondem ao CPF/CNPJ do Cliente registrado.' },
        { status: 400 }
      );
    }

    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Desconhecido';
    const clientSignedAt = new Date();

    // Montar payload de auditoria imutável
    const auditPayload = {
      contract_id: contract.id,
      contract_number: contract.contract_number,
      kapel_signer: contract.signed_kapel_name,
      kapel_signed_at: contract.signed_kapel_at?.toISOString(),
      kapel_ip: contract.signed_kapel_ip,
      client_signer: signer_name || contract.client.legal_name,
      client_doc: contract.client.document,
      client_signed_at: clientSignedAt.toISOString(),
      client_ip: clientIp,
      client_user_agent: userAgent,
    };

    const auditHash = generateAuditHash(auditPayload);

    const updated = await prisma.contract.update({
      where: { id: contract.id },
      data: {
        signature_status: 'SIGNED',
        status: 'FINALIZED',
        signed_client_at: clientSignedAt,
        signed_client_ip: clientIp,
        signed_client_user_agent: userAgent,
        signed_client_name: signer_name || contract.client.legal_name,
        signed_client_doc: contract.client.document,
        signed_client_signature_data: signature_data,
        audit_hash: auditHash,
      },
    });

    await initializeOperationalProject(contract.id);


    // Registrar no Log de Auditoria
    await prisma.auditLog.create({
      data: {
        contract_id: contract.id,
        user_name: signer_name || contract.client.legal_name,
        action: 'CLIENT_SIGNATURE_COMPLETED',
        details: `Assinatura do cliente concluída com sucesso. Contrato FINALIZADO. Hash: ${auditHash}. IP: ${clientIp}`,
      },
    });

    return NextResponse.json({
      success: true,
      audit_hash: auditHash,
      signature_status: updated.signature_status,
      status: updated.status,
      message: 'Contrato assinado com sucesso! O Certificado de Auditoria foi gerado.',
    });
  } catch (error: any) {
    console.error('Erro na assinatura do cliente:', error);
    return NextResponse.json({ error: error.message || 'Erro ao processar assinatura do cliente.' }, { status: 500 });
  }
}
