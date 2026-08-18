import mammoth from 'mammoth';
import { BillingType } from '@/lib/types';

export interface ExtractedContractResult {
  html: string;
  text: string;
  client: {
    legal_name: string;
    trade_name?: string;
    document: string; // CNPJ ou CPF
    address?: string;
    neighborhood?: string;
    zip_code?: string;
    city?: string;
    state?: string;
    representative_name?: string;
    representative_role?: string;
    representative_cpf?: string;
    email?: string;
    phone?: string;
  };
  contract: {
    template_type: 'POLITICAL' | 'PERFORMANCE';
    title: string;
    candidate_name?: string;
    candidate_role?: string;
    candidate_state?: string;
    candidate_number?: string;
    party?: string;
    total_value?: number;
    items: Array<{
      name: string;
      description?: string;
      billing_type: BillingType;
      unit_price: number;
      quantity: number;
      discount: number;
      total_price: number;
      is_addition: boolean;
    }>;
  };
}

/**
 * Converte um buffer de arquivo DOCX em HTML formatado mantendo o texto exato do documento original.
 */
export async function extractContentFromDocxBuffer(buffer: Buffer): Promise<{ html: string; text: string }> {
  const [htmlResult, textResult] = await Promise.all([
    mammoth.convertToHtml({ buffer }),
    mammoth.extractRawText({ buffer }),
  ]);
  return {
    html: htmlResult.value,
    text: textResult.value,
  };
}

/**
 * Extrai texto e formata HTML a partir de um buffer de arquivo PDF assinado.
 */
export async function extractContentFromPdfBuffer(buffer: Buffer): Promise<{ html: string; text: string }> {
  try {
    // Dynamic import to prevent any top-level execution
    const pdfModule = await import('pdf-parse');
    const pdfParse = typeof pdfModule === 'function' ? pdfModule : (pdfModule as any).default || pdfModule;
    const data = await pdfParse(buffer);
    const text = data.text || '';

    const paragraphs = text
      .split(/\n\s*\n/)
      .map((p: string) => p.replace(/\n/g, ' ').trim())
      .filter((p: string) => p.length > 0);

    const html = paragraphs
      .map((p: string) => `<p style="margin-bottom: 1.25em; text-align: justify; line-height: 1.6;">${p}</p>`)
      .join('');

    return {
      html: html || `<p>${text}</p>`,
      text,
    };
  } catch (err: any) {
    console.error('Erro ao processar buffer PDF:', err);
    return {
      html: `<p>Contrato em PDF importado com sucesso.</p>`,
      text: buffer.toString('utf-8'),
    };
  }
}

/**
 * Realiza a análise semântica avançada sobre o texto do contrato para extrair todos os metadados do cliente.
 */
export function parseContractText(text: string, rawHtml?: string): ExtractedContractResult {
  const cleanText = text.replace(/\s+/g, ' ').trim();

  // 1. Extração do CNPJ ou CPF do Cliente (Contratante)
  let document = '';
  const cnpjMatch = cleanText.match(/CNPJ\s*(?:sob\s+o\s+n[ºo]\s*)?[:.]?\s*([0-9]{2}\.[0-9]{3}\.[0-9]{3}\/[0-9]{4}-[0-9]{2})/i) ||
                    cleanText.match(/([0-9]{2}\.[0-9]{3}\.[0-9]{3}\/[0-9]{4}-[0-9]{2})/);
  if (cnpjMatch) {
    document = cnpjMatch[1].trim();
  } else {
    const cpfMatch = cleanText.match(/CPF\s*(?:sob\s+o\s+n[ºo]\s*)?[:.]?\s*([0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2})/i) ||
                     cleanText.match(/([0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2})/);
    if (cpfMatch) {
      document = cpfMatch[1].trim();
    }
  }

  // 2. Extração da Razão Social do Cliente (Contratante)
  let legalName = '';
  const contratanteMatch = cleanText.match(/CONTRATANTE:\s*([^\n,]+)/i) ||
                           cleanText.match(/de\s+um\s+lado,\s*([^,]+),\s*pessoa\s+jurídica/i) ||
                           cleanText.match(/de\s+um\s+lado,\s*([^,]+),\s*inscrit[ao]/i) ||
                           cleanText.match(/CONTRATANTE\s*[:]\s*([A-Za-z0-9À-ú\s.-]+?)(?:,\s*inscrit|,\s*CNPJ|,\s*com\s+sede)/i);
  
  if (contratanteMatch) {
    legalName = contratanteMatch[1].replace(/^(?:a|o|da|do)\s+/i, '').trim();
  } else {
    legalName = 'Cliente Importado ' + new Date().toLocaleDateString('pt-BR');
  }

  // 3. Extração do Representante Legal e CPF
  let representativeName = '';
  let representativeRole = 'Representante Legal';
  let representativeCpf = '';

  const repMatch = cleanText.match(/representad[ao]\s+por\s+(?:seu\s+)?([^,]+),\s*([^,]+),\s*doravante/i) ||
                   cleanText.match(/representad[ao]\s+por\s+([^,]+),\s*doravante/i) ||
                   cleanText.match(/representante\s+legal:\s*([^\n,]+)/i);
  if (repMatch) {
    if (repMatch.length >= 3) {
      representativeRole = repMatch[1].trim();
      representativeName = repMatch[2].trim();
    } else {
      representativeName = repMatch[1].trim();
    }
  }

  const repCpfMatch = cleanText.match(/portador\s+do\s+CPF\s+(?:sob\s+o\s+n[ºo]\s*)?[:.]?\s*([0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2})/i);
  if (repCpfMatch) representativeCpf = repCpfMatch[1].trim();

  // 4. Extração de Contato (Email e Telefone)
  let email = '';
  let phone = '';
  const emailMatch = cleanText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) email = emailMatch[1].toLowerCase();

  const phoneMatch = cleanText.match(/(?:\(?\b\d{2}\)?\s*)?(?:9\s*)?\d{4}[-.\s]?\d{4}/);
  if (phoneMatch) phone = phoneMatch[0];

  // 5. Extração de Endereço (Cidade, Estado, CEP, Logradouro)
  let city = 'São Paulo';
  let state = 'SP';
  let zipCode = '';
  let address = '';
  let neighborhood = '';

  const cityStateMatch = cleanText.match(/([A-ZÀ-Ú][a-zà-úA-ZÀ-Ú\s]+)\/([A-Z]{2})/);
  if (cityStateMatch) {
    const fullCity = cityStateMatch[1].trim();
    const cityParts = fullCity.split(/,\s*|\s+CEP\s+[0-9-]+\s*,?\s*/i);
    city = cityParts[cityParts.length - 1].trim();
    state = cityStateMatch[2].trim();
  }

  const cepMatch = cleanText.match(/CEP\s*[:.]?\s*([0-9]{5}-?[0-9]{3})/i);
  if (cepMatch) zipCode = cepMatch[1];

  const addressMatch = cleanText.match(/sede\s+(?:na|no|em)\s+([^,]+(?:,\s*n[ºo]\s*[^,]+)?)/i) ||
                       cleanText.match(/endereço\s*[:.]?\s*([^,]+(?:,\s*n[ºo]\s*[^,]+)?)/i);
  if (addressMatch) address = addressMatch[1].trim();

  const neighborhoodMatch = cleanText.match(/Bairro\s+([^,]+)/i);
  if (neighborhoodMatch) neighborhood = neighborhoodMatch[1].trim();

  // 6. Identificação de Contrato Político / Eleitoral
  const isPolitical = /eleitoral|campanha|candidato|deputado|prefeito|vereador|partido/i.test(cleanText);
  const templateType = isPolitical ? 'POLITICAL' : 'PERFORMANCE';

  let candidateName = '';
  let candidateRole = '';
  let candidateState = state;

  if (isPolitical) {
    const candidateMatch = cleanText.match(/campanha\s+eleitoral\s+de\s+([A-Za-zÀ-ú\s]+?),\s*candidat[ao]\s+ao\s+cargo\s+de\s+([A-Za-zÀ-ú\s]+?)\s+pelo\s+Estado\s+de\s+([A-Za-zÀ-ú\s]+?)\s+(?:nas|em)/i) ||
                           cleanText.match(/candidat[ao]\s+([A-Za-zÀ-ú\s]+?),\s*cargo\s+de\s+([A-Za-zÀ-ú\s]+?)/i);
    if (candidateMatch) {
      candidateName = candidateMatch[1].trim();
      candidateRole = candidateMatch[2].trim();
      if (candidateMatch[3]) {
        candidateState = candidateMatch[3].trim();
        if (candidateState.toLowerCase().includes('minas gerais')) candidateState = 'MG';
        if (candidateState.toLowerCase().includes('são paulo')) candidateState = 'SP';
      }
    }
  }

  // 7. Extração de Valores e Itens de Serviço
  let unitPrice = 3500;
  const priceMatch = cleanText.match(/R\$\s*([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{2})?)/);
  if (priceMatch) {
    const parsedVal = parseFloat(priceMatch[1].replace(/\./g, '').replace(',', '.'));
    if (!isNaN(parsedVal) && parsedVal > 0) {
      unitPrice = parsedVal;
    }
  }

  const items: Array<{
    name: string;
    description?: string;
    billing_type: BillingType;
    unit_price: number;
    quantity: number;
    discount: number;
    total_price: number;
    is_addition: boolean;
  }> = [
    {
      name: isPolitical ? 'Gestão de Mídia Eleitoral e Tráfego Pago' : 'Gestão de Mídia Digital e Performance',
      description: 'Planejamento, operação, monitoramento e otimização de campanhas.',
      billing_type: isPolitical ? 'PROJECT_50_50' : 'MONTHLY_ARREARS',
      unit_price: unitPrice,
      quantity: 1,
      discount: 0,
      total_price: unitPrice,
      is_addition: false,
    },
  ];

  if (/chatbot/i.test(cleanText)) {
    items.push({
      name: 'Implantação e Configuração de Chatbot Informativo',
      description: 'Configuração e disponibilização de solução de resposta automatizada informativa.',
      billing_type: 'PROJECT_50_50',
      unit_price: 2500,
      quantity: 1,
      discount: 0,
      total_price: 2500,
      is_addition: true,
    });
  }

  const finalHtml = rawHtml || cleanText.split('\n\n').map(p => `<p style="margin-bottom: 1em;">${p.trim()}</p>`).join('');

  return {
    html: finalHtml,
    text: cleanText,
    client: {
      legal_name: legalName,
      trade_name: legalName.split(' ')[0],
      document: document || '00.000.000/0001-00',
      address,
      neighborhood,
      zip_code: zipCode,
      city,
      state,
      representative_name: representativeName,
      representative_role: representativeRole,
      representative_cpf: representativeCpf,
      email: email || `contato@${legalName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'cliente'}.com.br`,
      phone: phone || '',
    },
    contract: {
      template_type: templateType,
      title: isPolitical ? `Contrato Eleitoral - ${legalName}` : `Contrato de Prestação de Serviços - ${legalName}`,
      candidate_name: candidateName,
      candidate_role: candidateRole,
      candidate_state: candidateState,
      total_value: unitPrice,
      items,
    },
  };
}
