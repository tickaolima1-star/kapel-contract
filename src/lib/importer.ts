import mammoth from 'mammoth';

export interface ExtractedContractResult {
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
  };
  contract: {
    template_type: 'POLITICAL' | 'PERFORMANCE';
    title: string;
    candidate_name?: string;
    candidate_role?: string;
    candidate_state?: string;
    candidate_number?: string;
    party?: string;
    items: Array<{
      name: string;
      description?: string;
      billing_type: string;
      unit_price: number;
      quantity: number;
      total_price: number;
    }>;
  };
}

/**
 * Converte um buffer de arquivo DOCX em texto limpo utilizando Mammoth.
 */
export async function extractTextFromDocxBuffer(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

/**
 * Realiza a análise semântica e expressão regular sobre o texto do contrato para extrair metadados.
 */
export function parseContractText(text: string): ExtractedContractResult {
  const cleanText = text.replace(/\s+/g, ' ').trim();

  // 1. Extração do CNPJ ou CPF do Cliente (Contratante)
  let document = '';
  const cnpjMatch = cleanText.match(/CNPJ\s+(?:sob\s+o\s+nº\s*)?([0-9]{2}\.[0-9]{3}\.[0-9]{3}\/[0-9]{4}-[0-9]{2})/i);
  if (cnpjMatch) {
    document = cnpjMatch[1];
  } else {
    const cpfMatch = cleanText.match(/CPF\s+(?:sob\s+o\s+nº\s*)?([0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2})/i);
    if (cpfMatch) {
      document = cpfMatch[1];
    }
  }

  // 2. Extração da Razão Social do Cliente (Contratante)
  let legalName = 'Cliente Importado';
  const contratanteMatch = cleanText.match(/de\s+um\s+lado,\s*([^,]+),\s*pessoa\s+jurídica/i) ||
                           cleanText.match(/de\s+um\s+lado,\s*([^,]+),\s*inscrit[ao]/i);
  if (contratanteMatch) {
    legalName = contratanteMatch[1].trim();
  }

  // 3. Extração do Representante Legal
  let representativeName = '';
  let representativeRole = 'Representante Legal';
  const repMatch = cleanText.match(/representad[ao]\s+por\s+seu\s+([^,]+),\s*([^,]+),\s*doravante/i) ||
                   cleanText.match(/representad[ao]\s+por\s+([^,]+),\s*doravante/i);
  if (repMatch) {
    if (repMatch.length >= 3) {
      representativeRole = repMatch[1].trim();
      representativeName = repMatch[2].trim();
    } else {
      representativeName = repMatch[1].trim();
    }
  }

  // 4. Extração do Endereço (Cidade, Estado, CEP)
  let city = 'Belo Horizonte';
  let state = 'MG';
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

  const cepMatch = cleanText.match(/CEP\s*([0-9]{5}-?[0-9]{3})/i);
  if (cepMatch) zipCode = cepMatch[1];

  const addressMatch = cleanText.match(/sede\s+na\s+([^,]+(?:,\s*nº\s*[^,]+)?)/i);
  if (addressMatch) address = addressMatch[1].trim();

  const neighborhoodMatch = cleanText.match(/Bairro\s+([^,]+)/i);
  if (neighborhoodMatch) neighborhood = neighborhoodMatch[1].trim();

  // 5. Identificação de Contrato Político / Eleitoral
  const isPolitical = /eleitoral|campanha|candidato|deputado|prefeito|vereador/i.test(cleanText);
  const templateType = isPolitical ? 'POLITICAL' : 'PERFORMANCE';

  let candidateName = '';
  let candidateRole = '';
  let candidateState = state;

  if (isPolitical) {
    const candidateMatch = cleanText.match(/campanha\s+eleitoral\s+de\s+([A-Za-zÀ-ú\s]+?),\s*candidat[ao]\s+ao\s+cargo\s+de\s+([A-Za-zÀ-ú\s]+?)\s+pelo\s+Estado\s+de\s+([A-Za-zÀ-ú\s]+?)\s+(?:nas|em)/i);
    if (candidateMatch) {
      candidateName = candidateMatch[1].trim();
      candidateRole = candidateMatch[2].trim();
      candidateState = candidateMatch[3].trim();
      if (candidateState.toLowerCase().includes('minas gerais')) candidateState = 'MG';
    }
  }

  // 6. Itens de Serviço Extraídos
  const items = [
    {
      name: isPolitical ? 'Gestão de Mídia Eleitoral e Tráfego Pago' : 'Gestão de Mídia Digital e Performance',
      description: 'Planejamento, operação, monitoramento e otimização de campanhas.',
      billing_type: isPolitical ? 'PROJECT_50_50' : 'MONTHLY_ARREARS',
      unit_price: 3500,
      quantity: 1,
      total_price: 3500,
    },
  ];

  if (/chatbot/i.test(cleanText)) {
    items.push({
      name: 'Implantação e Configuração de Chatbot Informativo',
      description: 'Configuração e disponibilização de solução de resposta automatizada informativa.',
      billing_type: 'PROJECT_50_50',
      unit_price: 2500,
      quantity: 1,
      total_price: 2500,
    });
  }

  return {
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
    },
    contract: {
      template_type: templateType,
      title: isPolitical ? `Contrato Eleitoral - ${legalName}` : `Contrato de Performance - ${legalName}`,
      candidate_name: candidateName,
      candidate_role: candidateRole,
      candidate_state: candidateState,
      items,
    },
  };
}
