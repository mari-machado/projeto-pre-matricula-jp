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
