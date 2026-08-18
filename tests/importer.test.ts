import { describe, it, expect } from 'vitest';
import { parseContractText } from '../src/lib/importer';

describe('Importador Inteligente de Contratos (Parser PDF/DOCX/Text)', () => {
  const sampleContractText = `
    CONTRATO DE PRESTAÇÃO DE SERVIÇOS GESTÃO DE MÍDIA ELEITORAL E CHATBOT INFORMATIVO
    Pelo presente instrumento particular, de um lado, REV COMUNICACAO INTEGRADA LTDA, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº 44.869.466/0001-01, com sede na Avenida Bernardo de Vasconcelos, nº 2277, Bairro Palmares, CEP 31160-440, Belo Horizonte/MG, neste ato representada por seu Sócio-Administrador, Pedro Henrique Moreira Alves, doravante denominada CONTRATANTE; e, de outro lado, 67.726.428 PATRICK EDUARDO LIMA SILVA...
    CLÁUSULA 1ª - Os serviços destinam-se à campanha eleitoral de Ademir Lucas Gomes, candidato ao cargo de Deputado Federal pelo Estado de Minas Gerais nas Eleições 2026.
  `;

  const aureDigitalContractText = `
    CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE MARKETING DIGITAL
    ACCOUNT MANAGER
    Por este instrumento particular de contrato de prestação de serviços, as partes abaixo identificadas:
    CONTRATANTE: AURE DIGITAL LTDA, sociedade simples limitada, inscrita no CNPJ sob o nº 47.897.263/0001-09, com sede na Rua Inconfidentes, nº 911, 10º andar, Savassi, Belo Horizonte/MG, CEP: 30.140-720, com seus atos constitutivos devidamente arquivados na Junta Comercial do Estado de Minas, neste ato representada por Pedro Simões Barros Nunes, inscrito no CPF/MF sob o nº 115.204.326-90, cédula de identidade nº MG-18.413.882 SSP/MG, residente e domiciliado nesta capital.
    CONTRATADO: 67.726.428 PATRICK EDUARDO LIMA SILVA, inscrito no CNPJ nº 67.726.428/0001-97, representado por Patrick Eduardo Lima Silva, CPF nº 023.216.636-69, RG nº 2.073.244 PCMG/MG, telefone pessoal: +55 31 98849-4553, telefone profissional: +55 31 98437-3797, e-mail: gt.patricklima@gmail.com, residente e domiciliado na Rua dos Expedicionários, nº 240, bairro Santa Amélia, Belo Horizonte/MG, CEP 31555-200, doravante denominado CONTRATADO.
    CLÁUSULA 1ª – DO OBJETO:
    a. O presente contrato tem como objeto a prestação de serviços especializados em marketing digital, especificamente na função de Account Manager compreendendo a execução, acompanhamento, análise e otimização de campanhas de mídia paga utilizadas pela Contratante e seus clientes.
    CLÁUSULA 4ª – DO PRAZO CONTRATUAL:
    4.1. O presente contrato é celebrado pelo prazo de 12 (doze) meses, com início da prestação dos serviços em 01/07/2026.
    CLÁUSULA 5ª – DO VALOR DO CONTRATO E FORMA DE PAGAMENTO:
    5.1. A Contratante pagará ao Contratado, em contraprestação aos serviços prestados, os valores abaixo indicados:
    a) R$5.000,00 (cinco mil reais) mensais durante meses de vigência do contrato;
    7.1. O pagamento será realizado até o 5º (quinto) dia útil de cada mês...
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

  it('Deve extrair perfeitamente o contrato da AURE DIGITAL LTDA (PDF)', () => {
    const extracted = parseContractText(aureDigitalContractText);

    expect(extracted.client.legal_name).toBe('AURE DIGITAL LTDA');
    expect(extracted.client.document).toBe('47.897.263/0001-09');
    expect(extracted.client.representative_name).toBe('Pedro Simões Barros Nunes');
    expect(extracted.client.representative_cpf).toBe('115.204.326-90');
    expect(extracted.client.city).toBe('Belo Horizonte');
    expect(extracted.client.state).toBe('MG');
    expect(extracted.client.zip_code).toBe('30.140-720');
    expect(extracted.client.address).toContain('Rua Inconfidentes, nº 911');
    expect(extracted.contract.template_type).toBe('PERFORMANCE');
    expect(extracted.contract.total_value).toBe(5000);
  });
});
