import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractContentFromDocxBuffer, parseContractText } from '@/lib/importer';
import { generateSignatureToken } from '@/lib/signature';
import { calculateContractFinancials } from '@/lib/engine/financial';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const textOverride = formData.get('text') as string | null;

    let rawText = textOverride || '';
    let rawHtml = '';

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      if (file.name.endsWith('.docx')) {
        const extracted = await extractContentFromDocxBuffer(buffer);
        rawHtml = extracted.html;
        rawText = extracted.text;
      } else {
        rawText = buffer.toString('utf-8');
      }
    }

    if (!rawText || rawText.trim().length < 50) {
      return NextResponse.json(
        { error: 'Por favor, envie um arquivo .docx válido ou insira o texto do contrato.' },
        { status: 400 }
      );
    }

    // 1. Extrair Metadados do Documento via Parser Semântico
    const parsed = parseContractText(rawText, rawHtml);
    const { client: clientData, contract: contractData, html: exactHtmlBody } = parsed;

    // 2. Criar ou Atualizar Cliente Automaticamente no Banco de Dados
    let client = await prisma.client.findFirst({
      where: {
        OR: [
          { document: clientData.document },
          { legal_name: { contains: clientData.legal_name, mode: 'insensitive' } },
        ],
      },
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
          representative_cpf: clientData.representative_cpf || null,
          representative_role: clientData.representative_role || 'Representante Legal',
          email: clientData.email,
          phone: clientData.phone || null,
          active: true,
        },
      });
    } else {
      // Atualiza campos que estejam vazios no cliente existente
      client = await prisma.client.update({
        where: { id: client.id },
        data: {
          address: client.address || clientData.address || undefined,
          neighborhood: client.neighborhood || clientData.neighborhood || undefined,
          zip_code: client.zip_code || clientData.zip_code || undefined,
          city: client.city || clientData.city || undefined,
          state: client.state || clientData.state || undefined,
          representative_name: client.representative_name || clientData.representative_name || undefined,
          representative_cpf: client.representative_cpf || clientData.representative_cpf || undefined,
          representative_role: client.representative_role || clientData.representative_role || undefined,
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

    // 6. Criar Contrato Salva o Conteúdo Exato Importado (`imported_body`)
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
        is_imported: true,
        imported_body: exactHtmlBody,
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
        details: `Contrato #${contractNumber} importado com sucesso. Cliente ${client.legal_name} cadastrado/reconhecido automaticamente.`,
      },
    });

    return NextResponse.json(
      {
        success: true,
        contractId: contract.id,
        contractNumber: contract.contract_number,
        clientId: client.id,
        clientName: client.legal_name,
        signatureToken: contract.signature_token,
        previewUrl: `/contracts/${contract.id}/preview`,
        message: `Contrato #${contract.contract_number} e Cliente "${client.legal_name}" cadastrados com sucesso!`,
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
