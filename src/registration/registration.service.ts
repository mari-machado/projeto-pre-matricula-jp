import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { SponteService } from "../sponte/sponte.service";
import { PrismaService } from "../prisma/prisma.service";
import { Etapa1ResponsavelDto } from "./dto/etapa1-responsavel.dto";
import { Etapa2EnderecoDto } from "./dto/etapa2-endereco.dto";
import { Etapa3AlunoDto } from "./dto/etapa3-aluno.dto";
import { Etapa3bEnderecoAlunoDto } from "./dto/etapa3b-endereco-aluno.dto";
import { CadastroStatusDto } from "./dto/status.dto";

@Injectable()
export class RegistrationService {
  constructor(private prisma: PrismaService, private sponte: SponteService) {}

  async createStep1(data: Etapa1ResponsavelDto) {
    const responsavel = await this.prisma.responsavel.create({
      data: {
        nome: data.nome,
        genero: data.genero,
        dataNascimento: new Date(data.dataNascimento),
        profissao: data.profissao,
        naturalidade: data.naturalidade,
        estadoCivil: data.estadoCivil,
        nacionalidade: data.nacionalidade || 'Brasileira',
        rg: data.rg,
        cpf: data.cpf,
        celular: '',
        email: 'pending@temp.local',
        enderecoId: null,
      },
      select: { id: true },
    });
    return responsavel;
  }

  async updateStep2(responsavelId: string, data: Etapa2EnderecoDto) {
    const resp = await this.prisma.responsavel.findUnique({ where: { id: responsavelId } });
    if (!resp) throw new NotFoundException('Responsável não encontrado');
  if ((resp as any).etapaAtual > 2) throw new BadRequestException('Etapa já concluída');
  if ((resp as any).etapaAtual < 1) throw new BadRequestException('Sequência inválida');

    const endereco = await this.prisma.endereco.create({
      data: {
        cep: data.cep,
        rua: data.rua,
        numero: data.numero,
        complemento: data.complemento,
        cidade: data.cidade,
        uf: data.uf,
        bairro: data.bairro,
      },
    });

    const updated = await this.prisma.responsavel.update({
      where: { id: responsavelId },
      data: {
        enderecoId: endereco.id,
        celular: data.celular,
        contatoWhatsapp: data.contatoWhatsapp,
        email: data.email,
      },
      select: { id: true },
    });
    return updated;
  }

  async createStep3(responsavelId: string, data: Etapa3AlunoDto) {
    const resp = await this.prisma.responsavel.findUnique({ where: { id: responsavelId }, include: { endereco: true } });
    if (!resp) throw new NotFoundException('Responsável não encontrado');
  if ((resp as any).etapaAtual > 3) throw new BadRequestException('Etapa já concluída');
  if ((resp as any).etapaAtual < 2) throw new BadRequestException('Etapa anterior não concluída');

    let enderecoId: string | undefined = undefined;
    if (data.moraComResponsavel && resp.enderecoId) {
      enderecoId = resp.enderecoId;
    }

    const aluno = await this.prisma.aluno.create({
      data: {
        nome: data.nome,
        genero: data.genero,
        dataNascimento: new Date(data.dataNascimento),
        cidadeNatal: data.cidadeNatal,
        cpf: data.cpf || null,
        responsavelId: resp.id,
        enderecoId: enderecoId,
        moraComResponsavel: data.moraComResponsavel,
      },
      select: { id: true },
    });
    if (!data.moraComResponsavel) {
      return { alunoId: aluno.id, etapaAtual: (resp as any).etapaAtual, necessitaEtapa3b: true };
    }

    await this.prisma.responsavel.update({ where: { id: responsavelId }, data: { etapaAtual: 3 } });
    return { alunoId: aluno.id, etapaAtual: 3, necessitaEtapa3b: false, integradoSponte: false };
  }

  async createStep3b(alunoId: string, data: Etapa3bEnderecoAlunoDto) {
    const aluno = await this.prisma.aluno.findUnique({ where: { id: alunoId }, include: { responsavel: true } });
    if (!aluno) throw new NotFoundException('Aluno não encontrado');
    const resp = aluno.responsavel as any;
    if (aluno.moraComResponsavel) throw new BadRequestException('Aluno já associado a endereço do responsável');
    const endereco = await this.prisma.endereco.create({
      data: {
        cep: data.cep,
        rua: data.rua,
        numero: data.numero,
        complemento: data.complemento,
        bairro: data.bairro,
        cidade: data.cidade,
        uf: data.uf,
      },
      select: { id: true },
    });
    await this.prisma.aluno.update({ where: { id: alunoId }, data: { enderecoId: endereco.id } });
    await this.prisma.responsavel.update({ where: { id: aluno.responsavelId }, data: { etapaAtual: 3 } });
    return { alunoId, etapaAtual: 3, completo: true };
  }

  async getStatus(responsavelId: string): Promise<CadastroStatusDto> {
    const resp = await this.prisma.responsavel.findUnique({ where: { id: responsavelId } });
    if (!resp) throw new NotFoundException('Responsável não encontrado');
    const alunos = await this.prisma.aluno.findMany({ where: { responsavelId: resp.id } });
    const pendenteEnderecoAluno = alunos.some(a => !a.moraComResponsavel && !a.enderecoId);
    return {
      responsavelId: resp.id,
      etapaAtual: (resp as any).etapaAtual,
      completo: (resp as any).etapaAtual >= 3 && !pendenteEnderecoAluno,
      pendenteEnderecoAluno,
    } as any;
  }

  async listAlunos(responsavelId: string) {
    const responsavel = await this.prisma.responsavel.findUnique({ where: { id: responsavelId }, select: { id: true } });
    if (!responsavel) throw new NotFoundException('Responsável não encontrado');
    const alunos = await this.prisma.aluno.findMany({
      where: { responsavelId },
      select: { id: true, nome: true, moraComResponsavel: true, enderecoId: true, criadoEm: true },
      orderBy: { criadoEm: 'asc' },
    });
    return alunos.map(a => ({
      id: a.id,
      nome: a.nome,
      moraComResponsavel: a.moraComResponsavel,
      enderecoCompleto: !!a.enderecoId,
      necessitaEtapa3b: !a.moraComResponsavel && !a.enderecoId,
      criadoEm: a.criadoEm,
    }));
  }

  async integrateSponte(alunoId: string) {
    const aluno = await this.prisma.aluno.findUnique({ where: { id: alunoId }, include: { responsavel: { include: { endereco: true } }, endereco: true } });
    if (!aluno) throw new NotFoundException('Aluno não encontrado');
    const resp = aluno.responsavel as any;
    const enderecoResp = resp.endereco;
    const generoMap = (g: string) => (g === 'MASCULINO' ? 'M' : g === 'FEMININO' ? 'F' : '');
    const formatDate = (iso: string) => new Date(iso).toISOString().slice(0,19);
    let sponteAlunoResult: string | null = null;
    let sponteAlunoId = 0;
    try {
      sponteAlunoResult = await this.sponte.insertAluno({
        nCodigoCliente: parseInt(process.env.SPONTE_CODIGO_CLIENTE || '0', 10),
        sToken: process.env.SPONTE_TOKEN || '',
        sNome: aluno.nome,
        dDataNascimento: formatDate(aluno.dataNascimento.toISOString()),
        sCidade: (aluno.endereco?.cidade || enderecoResp?.cidade) || '',
        sBairro: (aluno.endereco?.bairro || enderecoResp?.bairro) || '',
        sCEP: (aluno.endereco?.cep || enderecoResp?.cep) || '',
        sEndereco: (aluno.endereco?.rua || enderecoResp?.rua) || '',
        nNumeroEndereco: (aluno.endereco?.numero || enderecoResp?.numero) || '',
        sEmail: '',
        sTelefone: '',
        sCPF: aluno.cpf || '',
        sRG: '',
        sCelular: '',
        sObservacao: 'Pré-matrícula (envio manual)',
        sSexo: generoMap(aluno.genero?.toString()),
        sProfissao: '',
        sCidadeNatal: aluno.cidadeNatal || '',
        sRa: '',
        sNumeroMatricula: '',
        sSituacao: 'INTERESSE',
        sCursoInteresse: '',
      });
      if (sponteAlunoResult) {
        const idMatch = sponteAlunoResult.match(/<AlunoID>(\d+)<\/AlunoID>/i) || sponteAlunoResult.match(/<IdAluno>(\d+)<\/IdAluno>/i);
        if (idMatch) sponteAlunoId = parseInt(idMatch[1], 10);
      }
      const respResult = await this.sponte.insertResponsavel({
        nCodigoCliente: parseInt(process.env.SPONTE_CODIGO_CLIENTE || '0', 10),
        sToken: process.env.SPONTE_TOKEN || '',
        sNome: resp.nome,
        dDataNascimento: formatDate((resp as any).dataNascimento?.toISOString?.() || new Date().toISOString()),
        nParentesco: parseInt(process.env.SPONTE_PARENTESCO_PRINCIPAL || '1', 10),
        sCEP: enderecoResp?.cep || '',
        sEndereco: enderecoResp?.rua || '',
        nNumeroEndereco: enderecoResp?.numero || '',
        sRG: (resp as any).rg || '',
        sCPFCNPJ: (resp as any).cpf || '',
        sCidade: enderecoResp?.cidade || '',
        sBairro: enderecoResp?.bairro || '',
        sEmail: (resp as any).email || '',
        sTelefone: '',
        sCelular: (resp as any).celular || '',
        nAlunoID: sponteAlunoId,
        lResponsavelFinanceiro: true,
        lResponsavelDidatico: true,
        sObservacao: 'Responsável principal',
        sSexo: generoMap(resp.genero?.toString()),
        sProfissao: (resp as any).profissao || '',
        nTipoPessoa: 0,
        sComplementoEndereco: enderecoResp?.complemento || '',
      });
      return { alunoId, sponteAlunoId, alunoResult: sponteAlunoResult, responsavelResult: respResult };
    } catch (e: any) {
      return { alunoId, erro: true, detalhe: e.message || 'Falha integração Sponte', alunoResult: sponteAlunoResult };
    }
  }
}
