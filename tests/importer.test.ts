import { describe, it, expect } from 'vitest';
import { parseContractText } from '../src/lib/importer';

describe('Importador Inteligente de Contratos (Parser DOCX/Text)', () => {
  const sampleContractText = `
    CONTRATO DE PRESTAÇÃO DE SERVIÇOS GESTÃO DE MÍDIA ELEITORAL E CHATBOT INFORMATIVO
    Pelo presente instrumento particular, de um lado, REV COMUNICACAO INTEGRADA LTDA, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº 44.869.466/0001-01, com sede na Avenida Bernardo de Vasconcelos, nº 2277, Bairro Palmares, CEP 31160-440, Belo Horizonte/MG, neste ato representada por seu Sócio-Administrador, Pedro Henrique Moreira Alves, doravante denominada CONTRATANTE; e, de outro lado, 67.726.428 PATRICK EDUARDO LIMA SILVA...
    CLÁUSULA 1ª - Os serviços destinam-se à campanha eleitoral de Ademir Lucas Gomes, candidato ao cargo de Deputado Federal pelo Estado de Minas Gerais nas Eleições 2026.
  `;

  it('Deve extrair os dados da Razão Social, CNPJ, Representante e Endereço do Cliente', () => {
    const extracted = parseContractText(sampleContractText);

    expect(extracted.client.legal_name).toContain('REV COMUNICACAO INTEGRADA LTDA');
    expect(extracted.client.document).toBe('44.869.466/0001-01');
    expect(extracted.client.city).toBe('Belo Horizonte');
    expect(extracted.client.state).toBe('MG');
    expect(extracted.client.representative_name).toBe('Pedro Henrique Moreira Alves');
    expect(extracted.client.representative_role).toBe('Sócio-Administrador');
  });

  it('Deve identificar o tipo de contrato político e dados do candidato', () => {
    const extracted = parseContractText(sampleContractText);

    expect(extracted.contract.template_type).toBe('POLITICAL');
    expect(extracted.contract.candidate_name).toBe('Ademir Lucas Gomes');
    expect(extracted.contract.candidate_role).toBe('Deputado Federal');
    expect(extracted.contract.candidate_state).toBe('MG');
  });
});
