import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateDocPrefix, generateSignatureToken } from '@/lib/signature';
import { withOrgContext } from '@/lib/api-auth';

export const POST = withOrgContext(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  auth
) => {
  try {
    const body = await request.json();
    const { doc_prefix_4, signature_data, signer_name } = body;

    if (!doc_prefix_4 || !signature_data) {
      return NextResponse.json(
        { error: 'Confirmação dos 4 dígitos e visto são obrigatórios.' },
        { status: 400 }
      );
    }

    const contract = await prisma.contract.findFirst({
      where: { id: params.id, organization_id: auth.organizationId },
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contrato não encontrado.' }, { status: 404 });
    }

    // Buscar dados da empresa KAPEL
    const settings = await prisma.companySettings.findUnique({
      where: { id: 'default' },
    });

    const kapelCnpj = settings?.cnpj || '67.726.428/0001-97';

    // Validar os 4 primeiros dígitos do documento KAPEL
    if (!validateDocPrefix(kapelCnpj, doc_prefix_4)) {
      return NextResponse.json(
        { error: 'Os 4 primeiros dígitos informados não correspondem ao CNPJ da KAPEL.' },
        { status: 400 }
      );
    }

    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Desconhecido';
    const signatureToken = contract.signature_token || generateSignatureToken();

    const updatedContract = await prisma.contract.update({
      where: { id: params.id },
      data: {
        organization_id: auth.organizationId,
        signature_token: signatureToken,
        signature_status: 'PENDING_CLIENT',
        signed_kapel_at: new Date(),
        signed_kapel_ip: clientIp,
        signed_kapel_user_agent: userAgent,
        signed_kapel_name: signer_name || settings?.legal_representative || 'Patrick Eduardo Lima Silva',
        signed_kapel_doc: kapelCnpj,
        signed_kapel_signature_data: signature_data,
      },
    });

    // Log de Auditoria
    await prisma.auditLog.create({
      data: {
        contract_id: contract.id,
        user_name: signer_name || 'Patrick (KAPEL Admin)',
        action: 'KAPEL_SIGNATURE_REGISTERED',
        details: `Assinatura KAPEL registrada com sucesso. Status alterado para PENDING_CLIENT. IP: ${clientIp}`,
      },
    });

    return NextResponse.json({
      success: true,
      signature_token: signatureToken,
      signature_status: updatedContract.signature_status,
      message: 'Assinatura KAPEL registrada. O contrato agora aguarda a assinatura do cliente.',
    });
  } catch (error: any) {
    console.error('Erro na assinatura KAPEL:', error);
    return NextResponse.json({ error: error.message || 'Erro ao processar assinatura.' }, { status: 500 });
  }
});

