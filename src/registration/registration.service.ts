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


  async iniciarMatricula(data: Etapa1ResponsavelDto) {
    const existingResp = await this.prisma.responsavel.findFirst({
      where: { OR: [{ rg: data.rg }, { cpf: data.cpf }] },
      select: { id: true, nome: true, cpf: true, enderecoId: true },
    });

    let responsavel = existingResp as any;
    if (!responsavel) {
      const enderecoPlaceholder = await this.prisma.endereco.create({
        data: {
          cep: '00000-000',
          rua: 'PENDENTE',
          numero: 'S/N',
          complemento: null,
          cidade: 'PENDENTE',
          uf: null as any,
          bairro: 'PENDENTE',
        },
        select: { id: true },
      });
      responsavel = await this.prisma.responsavel.create({
        data: {
          nome: data.nome,
          genero: data.genero,
          dataNascimento: new Date(data.dataNascimento),
          estadoCivil: data.estadoCivil,
          rg: data.rg,
          orgaoExpeditor: data.orgaoExpeditor,
          dataExpedicao: new Date(data.dataExpedicao),
          cpf: data.cpf,
          pessoaJuridica: !!data.pessoaJuridica,
          celular: 'PENDENTE',
          email: `pending+${Date.now()}-${Math.random().toString(36).slice(2,8)}@temp.local`,
          financeiro: false,
          enderecoId: enderecoPlaceholder.id,
        } as any,
        select: { id: true, nome: true, cpf: true, enderecoId: true },
      });
    }

    const matricula = await this.prisma.matricula.create({
      data: {
        codigo: `PM-${Date.now()}-${Math.floor(Math.random()*999)}`,
        aluno: { create: {
          nome: 'PENDENTE',
          genero: data.genero,
          dataNascimento: new Date(data.dataNascimento),
          cidadeNatal: 'PENDENTE',
          estadoCivil: 'SOLTEIRO' as any,
          cpf: `P${Date.now()}`.slice(0,14),
          telefone: 'PENDENTE',
          celular: 'PENDENTE',
          whatsapp: 'PENDENTE',
          email: `aluno+${Date.now()}-${Math.random().toString(36).slice(2,6)}@temp.local`,
          cidade: 'PENDENTE',
          responsavel: { connect: { id: responsavel.id } },
          moraComResponsavel: true,
        } as any },
        responsavel: { connect: { id: responsavel.id } },
        responsavelNome: responsavel.nome,
        responsavelCpf: responsavel.cpf,
        etapaAtual: 1,
      },
      select: { id: true, responsavelId: true, etapaAtual: true }
    });

    return { matriculaId: matricula.id, responsavelId: matricula.responsavelId, etapaAtual: matricula.etapaAtual };
  }

  async updateStep2Matricula(matriculaId: string, data: Etapa2EnderecoDto) {
    const matricula = await this.prisma.matricula.findUnique({ where: { id: matriculaId }, include: { responsavel: true } });
    if (!matricula) throw new NotFoundException('Matrícula não encontrada');
    if (matricula.etapaAtual > 2) throw new BadRequestException('Etapa já concluída');
    if (matricula.etapaAtual < 1) throw new BadRequestException('Sequência inválida');

    const endereco = await this.prisma.endereco.create({
      data: {
        cep: data.cep,
        rua: data.rua,
        numero: data.numero,
        complemento: data.complemento,
        cidade: data.cidade,
        uf: data.uf as any,
        bairro: data.bairro,
      },
      select: { id: true }
    });

    await this.prisma.responsavel.update({
      where: { id: matricula.responsavelId },
      data: {
        enderecoId: endereco.id,
        celular: data.celular,
        email: data.email,
      }
    });

    const updated = await this.prisma.matricula.update({
      where: { id: matriculaId },
      data: { etapaAtual: 2, responsavelEmail: data.email },
      select: { id: true, etapaAtual: true }
    });
    return { matriculaId: updated.id, etapaAtual: updated.etapaAtual };
  }

  async createAlunoMatricula(matriculaId: string, data: Etapa3AlunoDto) {
  const matricula = await this.prisma.matricula.findUnique({ where: { id: matriculaId }, include: { responsavel: { include: { endereco: true } }, aluno: true } });
    if (!matricula) throw new NotFoundException('Matrícula não encontrada');
    if (matricula.etapaAtual > 3) throw new BadRequestException('Etapa já concluída');
    if (matricula.etapaAtual < 2) throw new BadRequestException('Etapa anterior não concluída');

    const alunoUpdate = await this.prisma.aluno.update({
      where: { id: matricula.alunoId },
      data: {
        nome: data.nome,
        genero: data.genero,
        dataNascimento: new Date(data.dataNascimento),
        cidadeNatal: data.cidadeNatal,
        estadoCivil: data.estadoCivil as any,
        cpf: data.cpf,
        telefone: data.telefone || 'PENDENTE',
        celular: data.celular,
        whatsapp: data.whatsapp,
        email: data.email,
        moraComResponsavel: data.moraComResponsavel,
        cidade: data.moraComResponsavel ? (matricula.responsavel.endereco?.cidade || 'PENDENTE') : (undefined as any),
        bairro: data.moraComResponsavel ? (matricula.responsavel.endereco?.bairro || null) : (undefined as any),
        cep: data.moraComResponsavel ? (matricula.responsavel.endereco?.cep || null) : (undefined as any),
        rua: data.moraComResponsavel ? (matricula.responsavel.endereco?.rua || null) : (undefined as any),
        numero: data.moraComResponsavel ? (matricula.responsavel.endereco?.numero || null) : (undefined as any),
        complemento: data.moraComResponsavel ? (matricula.responsavel.endereco?.complemento || null) : (undefined as any),
        uf: data.moraComResponsavel ? (matricula.responsavel.endereco?.uf as any) : (undefined as any),
      } as any,
      select: { id: true, moraComResponsavel: true }
    });

    if (!data.moraComResponsavel) {
      await this.prisma.matricula.update({
        where: { id: matriculaId },
        data: {
          alunoNome: data.nome,
          alunoCpf: data.cpf,
          alunoGenero: data.genero,
          alunoDataNascimento: new Date(data.dataNascimento),
          pendenteEnderecoAluno: true,
          etapaAtual: 2, 
        }
      });
      return { matriculaId, alunoId: alunoUpdate.id, etapaAtual: 2, necessitaEtapa3b: true };
    }

    await this.prisma.matricula.update({
      where: { id: matriculaId },
      data: {
        alunoNome: data.nome,
        alunoCpf: data.cpf,
        alunoGenero: data.genero,
        alunoDataNascimento: new Date(data.dataNascimento),
        etapaAtual: 3,
        pendenteEnderecoAluno: false,
        completo: true,
      }
    });
    return { matriculaId, alunoId: alunoUpdate.id, etapaAtual: 3, necessitaEtapa3b: false };
  }

  async createEnderecoAlunoMatricula(matriculaId: string, alunoId: string, data: Etapa3bEnderecoAlunoDto) {
  const matricula = await this.prisma.matricula.findUnique({ where: { id: matriculaId }, include: { aluno: true } });
    if (!matricula) throw new NotFoundException('Matrícula não encontrada');
    if (matricula.alunoId !== alunoId) throw new BadRequestException('Aluno não pertence à matrícula');
    const aluno = await this.prisma.aluno.findUnique({ where: { id: alunoId } });
    if (!aluno) throw new NotFoundException('Aluno não encontrado');
    if (aluno.moraComResponsavel) throw new BadRequestException('Aluno marcado como mora com responsável');

    await this.prisma.aluno.update({
      where: { id: alunoId },
      data: {
        cep: data.cep,
        rua: data.rua,
        numero: data.numero,
        complemento: data.complemento,
        bairro: data.bairro,
        cidade: data.cidade,
        uf: data.uf as any,
      },
    });
    await this.prisma.matricula.update({ where: { id: matriculaId }, data: { etapaAtual: 3, pendenteEnderecoAluno: false, completo: true } });
    return { matriculaId, alunoId, etapaAtual: 3, completo: true };
  }

  async getStatusMatricula(matriculaId: string): Promise<CadastroStatusDto> {
    const m = await this.prisma.matricula.findUnique({ where: { id: matriculaId } });
    if (!m) throw new NotFoundException('Matrícula não encontrada');
    return {
      responsavelId: m.responsavelId,
      etapaAtual: m.etapaAtual,
      completo: m.completo,
      pendenteEnderecoAluno: m.pendenteEnderecoAluno,
    } as any;
  }

  async integrateSponteMatricula(matriculaId: string) {
    const m = await this.prisma.matricula.findUnique({ where: { id: matriculaId }, include: { aluno: { include: { responsavel: { include: { endereco: true } } } } } });
    if (!m) throw new NotFoundException('Matrícula não encontrada');
    return this.integrateSponte(m.alunoId);
  }

  async createStep1(data: Etapa1ResponsavelDto) {
    const existingResp = await this.prisma.responsavel.findFirst({
      where: { OR: [{ rg: data.rg }, { cpf: data.cpf }] },
      select: { id: true },
    });
    if (existingResp) return existingResp;

    const enderecoPlaceholder = await this.prisma.endereco.create({
      data: {
        cep: '00000-000', rua: 'PENDENTE', numero: 'S/N', complemento: null, cidade: 'PENDENTE', uf: null as any, bairro: 'PENDENTE'
      }, select: { id: true }
    });

    const created = await this.prisma.responsavel.create({
      data: {
        nome: data.nome,
        genero: data.genero,
        dataNascimento: new Date(data.dataNascimento),
        estadoCivil: data.estadoCivil,
        rg: data.rg,
        orgaoExpeditor: data.orgaoExpeditor,
        dataExpedicao: new Date(data.dataExpedicao),
        cpf: data.cpf,
        pessoaJuridica: !!data.pessoaJuridica,
        celular: 'PENDENTE',
        email: `pending+${Date.now()}-${Math.random().toString(36).slice(2,8)}@temp.local`,
        enderecoId: enderecoPlaceholder.id,
      } as any,
      select: { id: true },
    });
    return created;
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
        uf: data.uf as any,
        bairro: data.bairro,
      },
    });

    const updated = await this.prisma.responsavel.update({
      where: { id: responsavelId },
      data: {
        enderecoId: endereco.id,
        celular: data.celular,
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
        estadoCivil: data.estadoCivil as any,
        cpf: data.cpf,
        telefone: data.telefone || 'PENDENTE',
        celular: data.celular,
        whatsapp: data.whatsapp,
        email: data.email,
        responsavelId: resp.id,
        enderecoId: enderecoId,
        moraComResponsavel: data.moraComResponsavel,
      } as any,
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
    await this.prisma.aluno.update({
      where: { id: alunoId },
      data: {
        cep: data.cep,
        rua: data.rua,
        numero: data.numero,
        complemento: data.complemento,
        bairro: data.bairro,
        cidade: data.cidade,
        uf: data.uf as any,
      }
    });
    await this.prisma.responsavel.update({ where: { id: aluno.responsavelId }, data: { etapaAtual: 3 } });
    return { alunoId, etapaAtual: 3, completo: true };
  }

  async getStatus(responsavelId: string): Promise<CadastroStatusDto> {
    const resp = await this.prisma.responsavel.findUnique({ where: { id: responsavelId } });
    if (!resp) throw new NotFoundException('Responsável não encontrado');
    const alunos = await this.prisma.aluno.findMany({ where: { responsavelId: resp.id } });
  const pendenteEnderecoAluno = alunos.some(a => !a.moraComResponsavel && (!a.cidade || !a.cep || !a.rua));
    return {
      responsavelId: resp.id,
      etapaAtual: (resp as any).etapaAtual,
      completo: (resp as any).etapaAtual >= 3 && !pendenteEnderecoAluno,
      pendenteEnderecoAluno,
    } as any;
  }

  async integrateSponte(alunoId: string) {
    const aluno = await this.prisma.aluno.findUnique({ where: { id: alunoId }, include: { responsavel: { include: { endereco: true } } } });
    if (!aluno) throw new NotFoundException('Aluno não encontrado');
    const resp = aluno.responsavel as any;
    const enderecoResp = resp.endereco;
    const generoMap = (g: string) => (g === 'MASCULINO' ? 'M' : g === 'FEMININO' ? 'F' : '');
    const formatDate = (iso: string) => new Date(iso).toISOString().slice(0,19);
    let sponteAlunoResult: string | null = null;
    let sponteAlunoId = 0;
    const parseRetornoOperacao = (xml: string | null | undefined): string | null => {
      if (!xml) return null;
      const match = xml.match(/<RetornoOperacao>([\s\S]*?)<\/RetornoOperacao>/i);
      return match ? match[1] : null;
    };
    const clienteCodigo = parseInt(process.env.SPONTE_CODIGO_CLIENTE || '0', 10);
    const clienteToken = process.env.SPONTE_TOKEN || '';
    if (!clienteCodigo || !clienteToken) {
      return { alunoId, erro: true, detalhe: 'Configuração Sponte ausente: verifique SPONTE_CODIGO_CLIENTE e SPONTE_TOKEN' };
    }
    try {
      sponteAlunoResult = await this.sponte.insertAluno({
        nCodigoCliente: clienteCodigo,
        sToken: clienteToken,
        sNome: aluno.nome,
        dDataNascimento: formatDate(aluno.dataNascimento.toISOString()),
        sCidade: (aluno.cidade || enderecoResp?.cidade) || '',
        sBairro: (aluno.bairro || enderecoResp?.bairro) || '',
        sCEP: (aluno.cep || enderecoResp?.cep) || '',
        sEndereco: (aluno.rua || enderecoResp?.rua) || '',
        nNumeroEndereco: (aluno.numero || enderecoResp?.numero) || '',
        sEmail: (aluno as any).email || '',
        sTelefone: (aluno as any).telefone || '',
        sCPF: aluno.cpf || '',
        sRG: '',
        sCelular: (aluno as any).celular || '',
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
      if (!sponteAlunoId) {
        const msg = parseRetornoOperacao(sponteAlunoResult) || 'Falha ao inserir aluno no Sponte';
        return { alunoId, erro: true, detalhe: msg, alunoResult: sponteAlunoResult };
      }
      const respResult = await this.sponte.insertResponsavel({
        nCodigoCliente: clienteCodigo,
        sToken: clienteToken,
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
        sProfissao: '',
        nTipoPessoa: 0,
        sComplementoEndereco: enderecoResp?.complemento || '',
      });
      return { alunoId, sponteAlunoId, alunoResult: sponteAlunoResult, responsavelResult: respResult };
    } catch (e: any) {
      return { alunoId, erro: true, detalhe: e.message || 'Falha integração Sponte', alunoResult: sponteAlunoResult };
    }
  }
}
