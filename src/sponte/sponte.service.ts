import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as https from 'https';

interface InsertAlunoPayload {
  nCodigoCliente: number;
  sToken: string;
  sNome: string;
  dDataNascimento: string; 
  sCidade: string;
  sBairro: string;
  sCEP: string;
  sEndereco: string;
  nNumeroEndereco: string;
  sEmail: string;
  sTelefone: string;
  sCPF: string;
  sRG: string;
  sCelular: string;
  sObservacao?: string;
  sSexo: string; 
  sProfissao?: string;
  sCidadeNatal?: string;
  sNacionalidade?: string;
  sRa?: string;
  sNumeroMatricula?: string;
  sSituacao?: string;
  sCursoInteresse?: string;
}

interface InsertResponsavelPayload {
  nCodigoCliente: number;
  sToken: string;
  sNome: string;
  dDataNascimento: string; 
  nParentesco: number;
  sCEP: string;
  sEndereco: string;
  nNumeroEndereco: string;
  sRG: string;
  sCPFCNPJ: string;
  sCidade: string;
  sBairro: string;
  sEmail: string;
  sTelefone: string;
  sCelular: string;
  nAlunoID: number; 
  lResponsavelFinanceiro: boolean;
  lResponsavelDidatico: boolean;
  sObservacao?: string;
  sSexo: string;
  sProfissao?: string;
  nTipoPessoa: number; // 1 = Física, 2 = Jurídica
  sComplementoEndereco?: string;
}

@Injectable()
export class SponteService {
  private host = 'api.sponteeducacional.net.br';
  private path = '/WSAPIEdu.asmx';
  private actionInsertAluno = 'http://api.sponteeducacional.net.br/InsertAlunos';
  private actionInsertResponsavel = 'http://api.sponteeducacional.net.br/InsertResponsaveis2';
  private actionGetCategorias = 'http://api.sponteeducacional.net.br/GetCategorias';
  private actionGetCursos = 'http://api.sponteeducacional.net.br/GetCursos';
  private actionUpdateAlunos3 = 'http://api.sponteeducacional.net.br/UpdateAlunos3';

  // Codes mapping based on Sponte documentation
  private readonly statusDescriptions: Record<number, string> = {
    1: 'Operação Realizada com Sucesso.',
    2: 'Parâmetros de busca inválidos.',
    3: 'Tipo de parâmetro incorreto.',
    4: 'Aluno já cadastrado.',
    5: 'Data (Inválida).',
    6: 'AlunoId (Inválido).',
    7: 'ResponsavelID (Inválido).',
    8: 'CursoID (Inválido).',
    9: 'TurmaId (Inválido).',
    10: 'ContratoID (Inválido).',
    11: 'O aluno já está cadastrado na turma.',
    12: 'DisciplinaId (Inválida).',
    13: 'Tipo de plano inválido.',
    14: 'Nº de parcelas inválido.',
    15: 'Valor da parcela inválido.',
    16: 'Forma de cobrança inválida.',
    17: 'CategoriaID (Inválida).',
    18: 'BolsaID (Inválida).',
    19: 'ItemID (Inválido).',
    20: 'CnabID (Inválido).',
    21: 'Informe pelo menos um parâmetro de busca.',
    22: 'Responsável já cadastrado.',
    23: 'Cliente não possui token cadastrado para acesso a WSAPIEdu, entre em contato com o suporte.',
    24: 'Cliente não encontrado, verifique o código do cliente informado.',
    25: 'Token Inválido.',
    26: 'Campo nome é obrigatório.',
    27: 'Campo CPF é obrigatório.',
    28: 'Já existe um cadastro com o nome informado.',
    29: 'O CPF informado já está associado a outro cadastro.',
    30: 'CPF inválido.',
    31: 'Parentesco inválido.',
    32: 'O CNPJ informado já está associado a outro cadastro.',
    33: 'CNPJ inválido.',
    34: 'Campo CNPJ é obrigatório.',
    35: 'Tipo pessoa inválido. (1-Física / 2-Jurídica)',
    36: 'Informe a data de término do contrato.',
    37: 'A data de término do contrato deve ser maior que a data de início do contrato.',
    38: 'Tipo de contrato inválido. (-1-Matrícula ou -2-Rematrícula)',
    39: 'Tipo da matrícula inválido. (1-Turmas ou 2-Aulas Livres)',
    40: 'Módulo inválido.',
    41: 'Situação inválida.',
    42: 'Contratante inválido.',
    43: 'Nenhum registro foi encontrado para os parâmetros de busca informados.',
    44: 'O parâmetro de busca deve conter o campo TurmaID.',
    45: 'ContratoAulaLivreID (Inválido).',
    46: 'ContaReceberID (Inválida).',
    47: 'Somente parcela na situação Pendente podem ser editadas.',
    48: 'Informe os itens da venda.',
    49: 'Existem itens sem saldo, para realizar a venda informe o parâmetro Entregue com o valor zero, desta forma a venda será realiza sem a entrega dos itens.',
    50: 'Existem notas lançadas para o contrato, por esse motivo não é possível alterar informações de disciplinas, curso ou turma.',
    51: 'O parâmetro de busca deve conter o campo ContaReceberID.',
    52: 'Nº da parcela inválido.',
    53: 'E-mail inválido.',
    54: 'Campo E-mail é obrigatório.',
    55: 'ResponsavelDidaticoID (Inválido).',
    56: 'ResponsavelFinanceiroID (Inválido).',
    57: 'Número de requisições excedido.',
    58: 'Aluno não matriculado na turma.',
    59: 'Disciplina não encontrada.',
    60: 'Período Inválido.',
    61: 'A nota informada é maior que a máxima permitida.',
    62: 'Nota inválida.',
    63: 'Aluno não matriculado na disciplina.',
    64: 'Ano Letivo inválido.',
    65: 'Curso sem matriz curricular vinculada.',
    66: 'Informe o nome.',
    67: 'Não é possível incluir turmas cíclicas para este curso.',
    68: 'Não é possível incluir turmas regulares para este curso.',
    69: 'Cobrança de crédito recorrente em processamento do Educacional Web (Vindi).',
    70: 'Tipo inválido (1 - Física / 2 - Jurídica).',
    71: 'Informe o tipo de cadastro (Cliente / Fornecedor / Escola Aluno / Empresa Aluno).',
    72: 'ClienteID (Inválido).',
    73: 'ContaID (Inválido).',
    74: 'Informe o sacado (AlunoID ou ClienteID).',
    75: 'Número de matrícula já existe.',
    76: 'Já existe um plano financeiro cadastrado neste contrato para o tipo de plano informado.',
    77: 'Não foi possível gerar a linha digitável do boleto.',
    78: 'Informe um Curso.',
    79: 'FuncionarioID (Inválido).',
    80: 'Deve ser informado ContaReceberID ou ContaPagarID maior que 0.',
    81: 'Não pode ser informado ContaReceberID e ContaPagarID maior que 0, deve ser optado por apenas um.',
    82: 'O plano informado para a quitação não possui nenhuma parcela pendente.',
    83: 'A parcela informada para a quitação já encontra-se quitada.',
    84: 'O valor pago informado é inválido.',
    85: 'A forma de pagamento informada é inválida.',
    86: 'Quantidade de vezes para o parcelamento do pagamento no cartão inválido.',
    87: 'Operadora do cartão inválida.',
    88: 'Bandeira do cartão inválida.',
    89: 'Número do cartão inválido, deve ser informado apenas os últimos 4 dígitos do cartão.',
    90: 'O período informado não pode ser superior à 6 meses.',
    91: 'Data de início inválida.',
    92: 'Data de término inválida.',
    93: 'Informe o sacado (AlunoID, FornecedorID ou FuncionarioID).',
    94: 'Informe apenas um sacado (AlunoID, FornecedorID ou FuncionarioID).',
    95: 'FornecedorID (Inválido).',
    96: 'ContaPagarID (Inválido).',
    97: 'Informe a OperadoraID ou a bandeira do cartão.',
    98: 'Informe a Turma ou o Curso.',
    99: 'Informe apenas a Turma ou o Curso.',
    100: 'Token já cadastrado.',
    101: 'Usuário não encontrado.',
    102: 'Parâmetros faltando ou inválidos.',
    103: 'HorárioID (Inválido).',
    104: 'Informe o Aluno.',
    105: 'Não é possivel alterar o horário da turma pois a mesma já possui um quadro de horários gerado.',
    106: 'Já existe uma turma cadastrada com este nome.',
    107: 'O número máximo de integrantes da turma não pode ser menor que o número de alunos matriculados.',
    108: 'Número do cartão inexistente.',
    109: 'Operação Concluida Parcialmente.',
    110: 'Turno Inválido.',
    111: 'Modalidade Inválida.',
    112: 'Ordem Inválida.',
    113: 'O período informado não pode ser superior à 60 dias.',
    114: 'Não existe aula gerada para os parâmetros informados.',
    115: 'Número da aula inválido.',
    116: 'O JSON informado não está em um formato válido.',
    117: 'TipoCursoID inválido.',
    118: 'SerieID inválido.',
    119: 'Responsável já está compartilhado.',
    200: 'Status OK',
    500: 'Erro De Servidor.',
  };

  parseRetornoOperacao(xml: string | null | undefined): string | null {
    if (!xml) return null;
    const match = xml.match(/<RetornoOperacao>([\s\S]*?)<\/RetornoOperacao>/i);
    return match ? match[1].trim() : null;
  }

  extractStatusFromRetorno(retorno: string | null | undefined): { code?: number; description?: string } | null {
    if (!retorno) return null;
    const codeMatch = retorno.match(/^(\d{1,3})\s*[-–:]/);
    if (codeMatch) {
      const code = parseInt(codeMatch[1], 10);
      return { code, description: this.statusDescriptions[code] || retorno };
    }
    if (/sucesso/i.test(retorno)) {
      return { code: 1, description: this.statusDescriptions[1] };
    }
    return { description: retorno };
  }

  async getCategorias(params: { nCodigoCliente: number; sToken: string }): Promise<string> {
    const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetCategorias xmlns="http://api.sponteeducacional.net.br/">
      <nCodigoCliente>${this.esc(params.nCodigoCliente)}</nCodigoCliente>
      <sToken>${this.esc(params.sToken)}</sToken>
    </GetCategorias>
  </soap:Body>
</soap:Envelope>`;
    return this.dispatch(envelope, this.actionGetCategorias, 'GetCategoriasResult');
  }

  async getCursos(params: { nCodigoCliente: number; sToken: string; sParametrosBusca?: string }): Promise<string> {
    const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetCursos xmlns="http://api.sponteeducacional.net.br/">
      <nCodigoCliente>${this.esc(params.nCodigoCliente)}</nCodigoCliente>
      <sToken>${this.esc(params.sToken)}</sToken>
      <sParametrosBusca>${this.esc(params.sParametrosBusca)}</sParametrosBusca>
    </GetCursos>
  </soap:Body>
</soap:Envelope>`;
    return this.dispatch(envelope, this.actionGetCursos, 'GetCursosResult');
  }

  async updateAlunos3(params: {
    nCodigoCliente: number;
    sToken: string;
    nAlunoID: number;
    sNome?: string;
    sMidia?: string;
    dDataNascimento?: string;
    sCidade?: string;
    sBairro?: string;
    sCEP?: string;
    sEndereco?: string;
    nNumeroEndereco?: string;
    sComplementoEndereco?: string;
    sCPF?: string;
    sRG?: string;
    nResponsavelFinanceiroID?: string;
    nResponsavelDidaticoID?: string;
    sEmail?: string;
    sTelefone?: string;
    sCelular?: string;
    sObservacao?: string;
    sSexo?: string;
    sProfissao?: string;
    sCidadeNatal?: string;
    sRa?: string;
    sNumeroMatricula?: string;
    sSituacao?: string;
    sCursoInteresse?: string;
    sInfoBloqueada?: string;
    sOrigemNome?: string;
  }): Promise<string> {
    const d = params;
    const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <UpdateAlunos3 xmlns="http://api.sponteeducacional.net.br/">
      <nCodigoCliente>${this.esc(d.nCodigoCliente)}</nCodigoCliente>
      <sToken>${this.esc(d.sToken)}</sToken>
      <nAlunoID>${this.esc(d.nAlunoID)}</nAlunoID>
      <sNome>${this.esc(d.sNome)}</sNome>
      <sMidia>${this.esc(d.sMidia)}</sMidia>
      <dDataNascimento>${this.esc(d.dDataNascimento)}</dDataNascimento>
      <sCidade>${this.esc(d.sCidade)}</sCidade>
      <sBairro>${this.esc(d.sBairro)}</sBairro>
      <sCEP>${this.esc(d.sCEP)}</sCEP>
      <sEndereco>${this.esc(d.sEndereco)}</sEndereco>
      <nNumeroEndereco>${this.esc(d.nNumeroEndereco)}</nNumeroEndereco>
      <sComplementoEndereco>${this.esc(d.sComplementoEndereco)}</sComplementoEndereco>
      <sCPF>${this.esc(d.sCPF)}</sCPF>
      <sRG>${this.esc(d.sRG)}</sRG>
      <nResponsavelFinanceiroID>${this.esc(d.nResponsavelFinanceiroID)}</nResponsavelFinanceiroID>
      <nResponsavelDidaticoID>${this.esc(d.nResponsavelDidaticoID)}</nResponsavelDidaticoID>
      <sEmail>${this.esc(d.sEmail)}</sEmail>
      <sTelefone>${this.esc(d.sTelefone)}</sTelefone>
      <sCelular>${this.esc(d.sCelular)}</sCelular>
      <sObservacao>${this.esc(d.sObservacao)}</sObservacao>
      <sSexo>${this.esc(d.sSexo)}</sSexo>
      <sProfissao>${this.esc(d.sProfissao)}</sProfissao>
      <sCidadeNatal>${this.esc(d.sCidadeNatal)}</sCidadeNatal>
      <sRa>${this.esc(d.sRa)}</sRa>
      <sNumeroMatricula>${this.esc(d.sNumeroMatricula)}</sNumeroMatricula>
      <sSituacao>${this.esc(d.sSituacao)}</sSituacao>
      <sCursoInteresse>${this.esc(d.sCursoInteresse)}</sCursoInteresse>
      <sInfoBloqueada>${this.esc(d.sInfoBloqueada)}</sInfoBloqueada>
      <sOrigemNome>${this.esc(d.sOrigemNome)}</sOrigemNome>
    </UpdateAlunos3>
  </soap:Body>
</soap:Envelope>`;
    return this.dispatch(envelope, this.actionUpdateAlunos3, 'UpdateAlunos3Result');
  }

  async insertAluno(data: InsertAlunoPayload): Promise<string> {
    const envelope = this.buildAlunoEnvelope(data);
    return this.dispatch(envelope, this.actionInsertAluno, 'InsertAlunosResult');
  }

  async insertResponsavel(payload: InsertResponsavelPayload): Promise<string> {
    const envelope = this.buildResponsavelEnvelope(payload);
    return this.dispatch(envelope, this.actionInsertResponsavel, 'InsertResponsaveis2Result');
  }
  private dispatch(envelope: string, action: string, resultTag: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const req = https.request({
        host: this.host,
        path: this.path,
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'Content-Length': Buffer.byteLength(envelope),
          'SOAPAction': action,
        },
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            const regex = new RegExp(`<${resultTag}>([\\s\\S]*?)<\\/${resultTag}>`);
            const match = body.match(regex);
            if (match) return resolve(match[1]);
            return resolve(body);
          }
          reject(new InternalServerErrorException('Erro na API do Sponte: ' + res.statusCode));
        });
      });
  req.on('error', (err) => reject(new InternalServerErrorException('Falha na comunicação com a API do Sponte: ' + err.message)));
      req.write(envelope);
      req.end();
    });
  }

  private esc(value: string | number | undefined | null): string {
    if (value === undefined || value === null) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private buildAlunoEnvelope(d: InsertAlunoPayload): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <InsertAlunos xmlns="http://api.sponteeducacional.net.br/">
      <nCodigoCliente>${this.esc(d.nCodigoCliente)}</nCodigoCliente>
      <sToken>${this.esc(d.sToken)}</sToken>
      <sNome>${this.esc(d.sNome)}</sNome>
      <sMidia></sMidia>
      <dDataNascimento>${this.esc(d.dDataNascimento)}</dDataNascimento>
      <sCidade>${this.esc(d.sCidade)}</sCidade>
      <sBairro>${this.esc(d.sBairro)}</sBairro>
      <sCEP>${this.esc(d.sCEP)}</sCEP>
      <sEndereco>${this.esc(d.sEndereco)}</sEndereco>
      <nNumeroEndereco>${this.esc(d.nNumeroEndereco)}</nNumeroEndereco>
      <sEmail>${this.esc(d.sEmail)}</sEmail>
      <sTelefone>${this.esc(d.sTelefone)}</sTelefone>
      <sCPF>${this.esc(d.sCPF)}</sCPF>
      <sRG>${this.esc(d.sRG)}</sRG>
      <sCelular>${this.esc(d.sCelular)}</sCelular>
      <sObservacao>${this.esc(d.sObservacao)}</sObservacao>
      <sSexo>${this.esc(d.sSexo)}</sSexo>
      <sProfissao>${this.esc(d.sProfissao)}</sProfissao>
      <sCidadeNatal>${this.esc(d.sCidadeNatal)}</sCidadeNatal>
      <sNacionalidade>${this.esc(d.sNacionalidade)}</sNacionalidade>
      <sRa>${this.esc(d.sRa)}</sRa>
      <sNumeroMatricula>${this.esc(d.sNumeroMatricula)}</sNumeroMatricula>
      <sSituacao>${this.esc(d.sSituacao)}</sSituacao>
      <sCursoInteresse>${this.esc(d.sCursoInteresse)}</sCursoInteresse>
    </InsertAlunos>
  </soap:Body>
</soap:Envelope>`;
  }

  private buildResponsavelEnvelope(r: InsertResponsavelPayload): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <InsertResponsaveis2 xmlns="http://api.sponteeducacional.net.br/">
      <nCodigoCliente>${this.esc(r.nCodigoCliente)}</nCodigoCliente>
      <sToken>${this.esc(r.sToken)}</sToken>
      <sNome>${this.esc(r.sNome)}</sNome>
      <dDataNascimento>${this.esc(r.dDataNascimento)}</dDataNascimento>
      <nParentesco>${this.esc(r.nParentesco)}</nParentesco>
      <sCEP>${this.esc(r.sCEP)}</sCEP>
      <sEndereco>${this.esc(r.sEndereco)}</sEndereco>
      <nNumeroEndereco>${this.esc(r.nNumeroEndereco)}</nNumeroEndereco>
      <sRG>${this.esc(r.sRG)}</sRG>
      <sCPFCNPJ>${this.esc(r.sCPFCNPJ)}</sCPFCNPJ>
      <sCidade>${this.esc(r.sCidade)}</sCidade>
      <sBairro>${this.esc(r.sBairro)}</sBairro>
      <sEmail>${this.esc(r.sEmail)}</sEmail>
      <sTelefone>${this.esc(r.sTelefone)}</sTelefone>
      <sCelular>${this.esc(r.sCelular)}</sCelular>
      <nAlunoID>${this.esc(r.nAlunoID)}</nAlunoID>
      <lResponsavelFinanceiro>${r.lResponsavelFinanceiro}</lResponsavelFinanceiro>
      <lResponsavelDidatico>${r.lResponsavelDidatico}</lResponsavelDidatico>
      <sObservacao>${this.esc(r.sObservacao)}</sObservacao>
      <sSexo>${this.esc(r.sSexo)}</sSexo>
      <sProfissao>${this.esc(r.sProfissao)}</sProfissao>
      <nTipoPessoa>${this.esc(r.nTipoPessoa)}</nTipoPessoa>
      <sComplementoEndereco>${this.esc(r.sComplementoEndereco)}</sComplementoEndereco>
    </InsertResponsaveis2>
  </soap:Body>
</soap:Envelope>`;
  }
}
