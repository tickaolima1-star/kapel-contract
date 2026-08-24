import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import { generateSignatureToken } from '@/lib/signature';
import { withOrgContext } from '@/lib/api-auth';

export const POST = withOrgContext(async (request: NextRequest, context: any, auth: any) => {
  if (auth.role === 'VIEWER') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'A planilha enviada está vazia ou em formato incompatível.' },
        { status: 400 }
      );
    }

    let importedCount = 0;
    let updatedCount = 0;

    // Buscar ou Criar Template Padrão
    let template = await prisma.contractTemplate.findFirst({
      where: { type: 'PERFORMANCE', active: true },
    });

    if (!template) {
      template = await prisma.contractTemplate.create({
        data: {
          name: 'Contrato KAPEL Performance',
          type: 'PERFORMANCE',
          clause_order: '[]',
        },
      });
    }

    for (const row of rows) {
      // Normaliza as chaves do objeto para busca flexível
      const keys = Object.keys(row);
      const getVal = (patterns: RegExp[]) => {
        for (const p of patterns) {
          const matchKey = keys.find((k) => p.test(k.trim()));
          if (matchKey && String(row[matchKey]).trim()) {
            return String(row[matchKey]).trim();
          }
        }
        return '';
      };

      const clientName = getVal([/cliente/i, /raz[aã]o\s*social/i, /empresa/i, /nome/i]);
      if (!clientName) continue; // Linha sem nome de cliente

      const documentRaw = getVal([/cnpj/i, /cpf/i, /doc/i]);
      const projectTitle = getVal([/projeto/i, /servi[çc]o/i, /escopo/i, /t[íi]tulo/i, /objeto/i]) || 'Gestão de Mídia & Performance Digital';
      const valueRaw = getVal([/valor/i, /mrr/i, /mensalidade/i, /pre[çc]o/i, /honor[áa]rio/i]);
      const statusRaw = getVal([/status/i, /situa[çc][ãa]o/i, /fase/i, /etapa/i]).toLowerCase();
      const repName = getVal([/respons[áa]vel/i, /representante/i, /contato/i]);
      const repPhone = getVal([/telefone/i, /whatsapp/i, /celular/i, /fone/i]);
      const email = getVal([/email/i, /e-mail/i]);
      const city = getVal([/cidade/i, /munic[íi]pio/i]) || 'Belo Horizonte';
      const state = getVal([/estado/i, /uf/i]) || 'MG';
      const notes = getVal([/obs/i, /observa[çc]/i, /nota/i, /detalhe/i, /descri/i]);

      // Tratamento de valores monetários
      let valueNumber = 0;
      if (valueRaw) {
        const cleanVal = valueRaw.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.');
        const parsed = parseFloat(cleanVal);
        if (!isNaN(parsed)) valueNumber = parsed;
      }

      // Mapeamento de Status
      let contractStatus = 'FINALIZED'; // Padrão: Ativo
      let signatureStatus = 'SIGNED';

      if (/rascunho|draft|elabora/i.test(statusRaw)) {
        contractStatus = 'DRAFT';
        signatureStatus = 'DRAFT';
      } else if (/pronto|aguardando|pendente|enviado/i.test(statusRaw)) {
        contractStatus = 'READY';
        signatureStatus = 'DRAFT';
      } else if (/cancelado|encerrado|pausado/i.test(statusRaw)) {
        contractStatus = 'CANCELLED';
        signatureStatus = 'CANCELLED';
      }

      // 1. Criar ou Atualizar Cliente
      let client = await prisma.client.findFirst({
        where: {
          organization_id: auth.organizationId,
          OR: [
            ...(documentRaw ? [{ document: documentRaw }] : []),
            { legal_name: { contains: clientName, mode: 'insensitive' } },
          ],
        },
      });

      if (!client) {
        client = await prisma.client.create({
          data: {
            organization_id: auth.organizationId,
            type: documentRaw && documentRaw.length > 14 ? 'PJ' : 'PF',
            legal_name: clientName,
            trade_name: clientName.split(' ')[0],
            document: documentRaw || '00.000.000/0001-00',
            city,
            state,
            representative_name: repName || null,
            email: email || null,
            phone: repPhone || null,
            notes: notes || null,
            active: true,
          },
        });
        importedCount++;
      } else {
        updatedCount++;
      }

      // 2. Gerar Número de Contrato
      const lastContract = await prisma.contract.findFirst({
        where: { organization_id: auth.organizationId },
        orderBy: { created_at: 'desc' },
        select: { contract_number: true },
      });

      let nextNum = 1;
      if (lastContract && lastContract.contract_number) {
        const parsedNum = parseInt(lastContract.contract_number, 10);
        if (!isNaN(parsedNum)) nextNum = parsedNum + 1;
      }

      let contractNumber = String(nextNum).padStart(6, '0');
      while (await prisma.contract.findFirst({ where: { contract_number: contractNumber, organization_id: auth.organizationId } })) {
        nextNum++;
        contractNumber = String(nextNum).padStart(6, '0');
      }

      // 3. Criar Contrato / Projeto Vinculado
      const signatureToken = generateSignatureToken();
      const now = new Date();

      await prisma.contract.create({
        data: {
          organization_id: auth.organizationId,
          contract_number: contractNumber,
          client_id: client.id,
          template_id: template.id,
          status: contractStatus,
          signature_token: signatureToken,
          signature_status: signatureStatus,
          signed_kapel_at: contractStatus === 'FINALIZED' ? now : null,
          signed_client_at: contractStatus === 'FINALIZED' ? now : null,
          title: projectTitle,
          particularities: notes || null,
          calculated_mrr: valueNumber,
          calculated_total_one_time: 0,
          items: {
            create: [
              {
                name: projectTitle,
                description: notes || 'Serviços importados via planilha operacional.',
                billing_type: 'MONTHLY_ARREARS',
                unit_price: valueNumber,
                quantity: 1,
                total_price: valueNumber,
              },
            ],
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Planilha importada com sucesso! ${importedCount} novos clientes cadastrados e ${rows.length} projetos vinculados.`,
      importedCount,
      totalRows: rows.length,
    });
  } catch (error: any) {
    console.error('Erro na importação da planilha:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar arquivo da planilha.' },
      { status: 500 }
    );
  }
});
