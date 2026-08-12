import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTextFromDocxBuffer, parseContractText } from '@/lib/importer';
import { generateSignatureToken } from '@/lib/signature';
import { calculateContractFinancials } from '@/lib/engine/financial';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const textOverride = formData.get('text') as string | null;

    let contractText = textOverride || '';

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      if (file.name.endsWith('.docx')) {
        contractText = await extractTextFromDocxBuffer(buffer);
      } else {
        contractText = buffer.toString('utf-8');
      }
    }

    if (!contractText || contractText.trim().length < 50) {
      return NextResponse.json(
        { error: 'Por favor, envie um arquivo .docx válido ou insira o texto do contrato.' },
        { status: 400 }
      );
    }

    // 1. Extrair Metadados do Documento via Parser Semântico
    const parsed = parseContractText(contractText);
    const { client: clientData, contract: contractData } = parsed;

    // 2. Criar ou Buscar Cliente no Banco de Dados
    let client = await prisma.client.findFirst({
      where: { document: clientData.document },
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          type: clientData.document.length > 14 ? 'PJ' : 'PF',
          legal_name: clientData.legal_name,
          trade_name: clientData.trade_name || clientData.legal_name,
          document: clientData.document,
          address: clientData.address || null,
          neighborhood: clientData.neighborhood || null,
          zip_code: clientData.zip_code || null,
          city: clientData.city || 'São Paulo',
          state: clientData.state || 'SP',
          representative_name: clientData.representative_name || null,
          representative_role: clientData.representative_role || 'Representante Legal',
          email: 'contato@' + clientData.legal_name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com.br',
          active: true,
        },
      });
    }

    // 3. Buscar ou Criar Template
    let template = await prisma.contractTemplate.findFirst({
      where: { type: contractData.template_type, active: true },
    });

    if (!template) {
      template = await prisma.contractTemplate.create({
        data: {
          name: contractData.template_type === 'POLITICAL' ? 'Contrato KAPEL Political' : 'Contrato KAPEL Performance',
          type: contractData.template_type,
          clause_order: '[]',
        },
      });
    }

    // 4. Gerar Número Sequencial sem Colisão
    const lastContract = await prisma.contract.findFirst({
      orderBy: { created_at: 'desc' },
      select: { contract_number: true },
    });

    let nextNum = 1;
    if (lastContract && lastContract.contract_number) {
      const parsedNum = parseInt(lastContract.contract_number, 10);
      if (!isNaN(parsedNum)) nextNum = parsedNum + 1;
    }

    let contractNumber = String(nextNum).padStart(6, '0');
    while (await prisma.contract.findUnique({ where: { contract_number: contractNumber } })) {
      nextNum++;
      contractNumber = String(nextNum).padStart(6, '0');
    }

    // 5. Motor Financeiro
    const financials = calculateContractFinancials(contractData.items, 0);
    const signatureToken = generateSignatureToken();

    // 6. Criar Contrato com Status READY e Token de Assinatura Prontos
    const contract = await prisma.contract.create({
      data: {
        contract_number: contractNumber,
        client_id: client.id,
        template_id: template.id,
        status: 'READY',
        signature_token: signatureToken,
        signature_status: 'DRAFT',
        title: contractData.title,
        candidate_name: contractData.candidate_name || null,
        candidate_role: contractData.candidate_role || null,
        candidate_state: contractData.candidate_state || null,
        calculated_mrr: financials.recurrent_mrr,
        calculated_initial_payment: financials.initial_payment,
        calculated_future_milestones: financials.future_milestones,
        calculated_total_one_time: financials.total_one_time,
        items: {
          create: contractData.items.map((item) => ({
            name: item.name,
            description: item.description || null,
            billing_type: item.billing_type,
            unit_price: item.unit_price,
            quantity: item.quantity,
            total_price: item.total_price,
          })),
        },
      },
    });

    // 7. Registrar Auditoria
    await prisma.auditLog.create({
      data: {
        contract_id: contract.id,
        user_name: 'Patrick (Admin)',
        action: 'CONTRACT_IMPORTED_FROM_DOCX',
        details: `Contrato #${contractNumber} importado via documento DOCX/Texto. Cliente ${client.legal_name} cadastrado/vinculado com sucesso.`,
      },
    });

    return NextResponse.json(
      {
        success: true,
        contractId: contract.id,
        contractNumber: contract.contract_number,
        clientName: client.legal_name,
        signatureToken: contract.signature_token,
        previewUrl: `/contracts/${contract.id}/preview`,
        message: `Contrato #${contract.contract_number} e Cliente "${client.legal_name}" criados com sucesso!`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erro na importação do contrato:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar importação do documento.' },
      { status: 500 }
    );
  }
}
