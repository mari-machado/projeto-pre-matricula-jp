import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { SponteService } from "../sponte/sponte.service";
import { PrismaService } from "../prisma/prisma.service";
import { Etapa1ResponsavelDto } from "./dto/etapa1-responsavel.dto";
import { Etapa2EnderecoDto } from "./dto/etapa2-endereco.dto";
import { Etapa3AlunoDto } from "./dto/etapa3-aluno.dto";
import { Etapa3bEnderecoAlunoDto } from "./dto/etapa3b-endereco-aluno.dto";
import { CadastroStatusDto } from "./dto/status.dto";
import { ResponsavelResponseDto } from "./dto/responsavel-response.dto";
import { Etapa1bResponsavel2Dto } from "./dto/etapa1b-responsavel2.dto";
import { Etapa2bEnderecoResp2Dto } from "./dto/etapa2b-endereco-resp2.dto";

@Injectable()
export class RegistrationService {
  constructor(private prisma: PrismaService, private sponte: SponteService) {}

  private valuesEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    const isDateLike = (v: any) => v instanceof Date || (typeof v === 'string' && /\d{4}-\d{2}-\d{2}/.test(v));
    if (isDateLike(a) || isDateLike(b)) {
      const da = this.parseDateInput(a);
      const db = this.parseDateInput(b);
      if (isNaN(da.getTime()) || isNaN(db.getTime())) return false;
      return da.getTime() === db.getTime();
    }
    if (typeof a === 'string' || typeof b === 'string') {
      return String(a).trim() === String(b).trim();
    }
    return false;
  }

  private buildPartialUpdate<T extends Record<string, any>>(current: Partial<T> | null | undefined, incoming: Partial<T>, transforms?: Partial<Record<keyof T, (v: any) => any>>): Partial<T> {
    const out: Partial<T> = {};
    const cur = (current || {}) as Record<string, any>;
    const inc = (incoming || {}) as Record<string, any>;
    for (const key of Object.keys(inc)) {
      const val = inc[key];
      if (val === undefined) continue;
      const xform = transforms?.[key as keyof T];
      const newVal = xform ? xform(val) : val;
      const curVal = cur[key];
      if (!this.valuesEqual(curVal, newVal)) {
        (out as any)[key] = newVal;
      }
    }
    return out;
  }

  private parseDateInput(value: unknown): Date {
    if (!value) return new Date(NaN);
    if (value instanceof Date) return value;
    if (typeof value === 'string') {
      const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (iso) {
        const [_, yyyy, mm, dd] = iso;
        return new Date(parseInt(yyyy,10), parseInt(mm,10)-1, parseInt(dd,10));
      }
      const dmyOrMdy = value.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
      if (dmyOrMdy) {
        const [_, a, b, yyyy] = dmyOrMdy;
        const A = parseInt(a, 10);
        const B = parseInt(b, 10);
        const Y = parseInt(yyyy, 10);
        let day = A, month = B;
        if (A > 12 && B <= 12) { day = A; month = B; }
        else if (B > 12 && A <= 12) { day = B; month = A; }
        return new Date(Y, month - 1, day);
      }
      return new Date(value);
    }
    const anyVal: any = value as any;
    if (anyVal && typeof anyVal.toISOString === 'function') {
      try { return new Date(anyVal.toISOString()); } catch {}
    }
    try {
      return new Date(anyVal);
    } catch {
      return new Date(NaN);
    }
  }

  private normalizePhone(input: string | null | undefined, fieldName: string): string | undefined {
    if (input == null) return undefined;
    const raw = String(input);
    const digits = raw.replace(/\D+/g, '');
    if (!digits) return undefined;
    if (digits.length > 15) {
      throw new BadRequestException(`${fieldName} excede o limite de 15 dígitos. Informe apenas números (ex.: 5511912345678)`);
    }
    return digits;
  }

  private formatDateBR(d: Date | string | null | undefined): string {
    if (!d) return '';
    const dt = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(dt.getTime())) return '';
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yyyy = dt.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  private formatDateTimeBR(d: Date | string | null | undefined): string {
    if (!d) return '';
    const dt = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(dt.getTime())) return '';
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yyyy = dt.getFullYear();
    const hh = String(dt.getHours()).padStart(2, '0');
    const mi = String(dt.getMinutes()).padStart(2, '0');
    const ss = String(dt.getSeconds()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${mi}:${ss}`;
  }


  async iniciarMatricula(data: Etapa1ResponsavelDto, usuarioEmail?: string, usuarioId?: string) {
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
          dataNascimento: this.parseDateInput(data.dataNascimento),
          estadoCivil: data.estadoCivil,
          rg: data.rg,
          orgaoExpeditor: data.orgaoExpeditor,
          dataExpedicao: this.parseDateInput(data.dataExpedicao),
          cpf: data.cpf,
          pessoaJuridica: !!data.pessoaJuridica,
          celular: 'PENDENTE',
          email: usuarioEmail || `pending+${Date.now()}-${Math.random().toString(36).slice(2,8)}@temp.local`,
          financeiro: false,
          enderecoId: enderecoPlaceholder.id,
        } as any,
        select: { id: true, nome: true, cpf: true, enderecoId: true },
      });
    }

    const matricula = await this.prisma.matricula.create({
      data: ({
        codigo: `PM-${Date.now()}-${Math.floor(Math.random()*999)}`,
        aluno: { create: {
          nome: 'PENDENTE',
          genero: data.genero,
          dataNascimento: this.parseDateInput(data.dataNascimento),
          nacionalidade: 'PENDENTE',
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
        responsavelEmail: usuarioEmail || null,
        usuario: usuarioId ? { connect: { id: usuarioId } } : undefined,
        etapaAtual: 1,
      } as any),
      select: { id: true, responsavelId: true, etapaAtual: true, alunoId: true }
    });

    await this.prisma.alunoResponsavel.create({
      data: {
        alunoId: matricula.alunoId,
        responsavelId: responsavel.id,
        tipoParentesco: (data as any).parentesco?.toUpperCase?.() || 'PRINCIPAL',
        responsavelFinanceiro: true,
        responsavelDidatico: true,
      },
    });

    return {
      matriculaId: matricula.id,
      responsavelId: matricula.responsavelId,
      etapaAtual: matricula.etapaAtual,
      message: 'Pré-matrícula iniciada com sucesso.'
    };
  }

  async updateStep1bResponsavel2(matriculaId: string, data: Etapa1bResponsavel2Dto) {
  const matriculaRaw = await this.prisma.matricula.findUnique({ where: { id: matriculaId } });
  const matricula: any = matriculaRaw as any;
  if (!matricula) throw new NotFoundException('Matrícula não encontrada');
  if (!matricula.temSegundoResponsavel) throw new BadRequestException('Segundo responsável não foi informado na etapa inicial');
  if (matricula.etapaAtual < 1) throw new BadRequestException('Sequência inválida');

    const existente = data.cpf ? await this.prisma.responsavel.findUnique({ where: { cpf: data.cpf } }) : null;
    if (existente) {
      if (existente.id === matricula.responsavelId) {
        throw new BadRequestException('CPF informado pertence ao responsável principal da matrícula');
      }
      try {
        const partial = this.buildPartialUpdate(existente as any, {
          nome: data.nome,
          genero: data.genero,
          dataNascimento: this.parseDateInput(data.dataNascimento) as any,
          estadoCivil: (data.estadoCivil as any),
          rg: data.rg,
          orgaoExpeditor: data.orgaoExpeditor,
          dataExpedicao: this.parseDateInput(data.dataExpedicao) as any,
          pessoaJuridica: !!data.pessoaJuridica,
        } as any);
        if (Object.keys(partial).length > 0) {
          await this.prisma.responsavel.update({ where: { id: existente.id }, data: partial as any });
        }
      } catch (e: any) {
        if (e?.code === 'P2002' && Array.isArray(e?.meta?.target) && e.meta.target.includes('rg')) {
          throw new BadRequestException('RG já cadastrado para outro responsável.');
        }
        throw e;
      }
      await this.prisma.alunoResponsavel.deleteMany({
        where: {
          alunoId: matricula.alunoId,
          NOT: { responsavelId: { in: [matricula.responsavelId, existente.id] } },
        },
      });
      try {
        await this.prisma.alunoResponsavel.create({
          data: {
            alunoId: matricula.alunoId,
            responsavelId: existente.id,
            tipoParentesco: (data.parentesco?.toUpperCase?.() || 'OUTRO'),
            responsavelFinanceiro: false,
            responsavelDidatico: false,
          },
        });
      } catch {}
      const existenteAtual = await this.prisma.responsavel.findUnique({ where: { id: existente.id }, select: { nome: true } });
      await this.prisma.matricula.update({
        where: { id: matriculaId },
        data: ({ segundoResponsavel: { connect: { id: existente.id } }, pendenteResp2Dados: false, segundoResponsavelNome: existenteAtual?.nome || data.nome } as any),
      });
      return { matriculaId, segundoResponsavelId: existente.id, message: 'Etapa 1B (segundo responsável) concluída com sucesso.' };
    }


    const enderecoPlaceholder = await this.prisma.endereco.create({
      data: { cep: '00000-000', rua: 'PENDENTE', numero: 'S/N', complemento: null, cidade: 'PENDENTE', uf: null as any, bairro: 'PENDENTE' },
      select: { id: true },
    });
    let resp2Id: string | null = null;
    try {
      const resp2 = await this.prisma.responsavel.create({
        data: {
          nome: data.nome,
          genero: data.genero,
          dataNascimento: this.parseDateInput(data.dataNascimento),
          estadoCivil: (data.estadoCivil as any),
          rg: data.rg,
          orgaoExpeditor: data.orgaoExpeditor,
          dataExpedicao: this.parseDateInput(data.dataExpedicao),
          cpf: data.cpf,
          pessoaJuridica: !!data.pessoaJuridica,
          celular: 'PENDENTE',
          email: `pending2+${Date.now()}-${Math.random().toString(36).slice(2,8)}@temp.local`,
          financeiro: false,
          enderecoId: enderecoPlaceholder.id,
        } as any,
        select: { id: true },
      });
      resp2Id = resp2.id;
    } catch (e: any) {
      if (e?.code === 'P2002' && data.cpf) {
        const byCpf = await this.prisma.responsavel.findUnique({ where: { cpf: data.cpf } });
        if (byCpf) resp2Id = byCpf.id;
      }
      if (!resp2Id) throw e;
    }
    await this.prisma.alunoResponsavel.deleteMany({
      where: {
        alunoId: matricula.alunoId,
        NOT: { responsavelId: { in: [matricula.responsavelId, resp2Id!] } },
      },
    });
    try {
      await this.prisma.alunoResponsavel.create({
        data: {
          alunoId: matricula.alunoId,
          responsavelId: resp2Id!,
          tipoParentesco: (data.parentesco?.toUpperCase?.() || 'OUTRO'),
          responsavelFinanceiro: false,
          responsavelDidatico: false,
        },
      });
    } catch {}
    await this.prisma.matricula.update({
      where: { id: matriculaId },
      data: ({ segundoResponsavel: { connect: { id: resp2Id! } }, pendenteResp2Dados: false, segundoResponsavelNome: data.nome } as any),
    });
    return { matriculaId, segundoResponsavelId: resp2Id!, message: 'Etapa 1B (segundo responsável) concluída com sucesso.' };
  }

  async updateStep2bEnderecoResp2(matriculaId: string, data: Etapa2bEnderecoResp2Dto) {
  const matriculaRaw = await this.prisma.matricula.findUnique({ where: { id: matriculaId }, include: { segundoResponsavel: { include: { endereco: true } } } });
  const matricula: any = matriculaRaw as any;
  if (!matricula) throw new NotFoundException('Matrícula não encontrada');
  if (!matricula.temSegundoResponsavel)
    throw new BadRequestException('Segundo responsável não indicado na etapa 2');
  if (!matricula.segundoResponsavelId)
    throw new BadRequestException('Etapa 1B (dados do segundo responsável) não concluída');

    const endAtual = matricula.segundoResponsavel?.endereco || null;
    const endUpdate = this.buildPartialUpdate(endAtual, {
      cep: data.cep,
      rua: data.rua,
      numero: data.numero,
      complemento: data.complemento,
      cidade: data.cidade,
      uf: data.uf as any,
      bairro: data.bairro,
    } as any);
    let endId = endAtual?.id;
    if (endAtual && Object.keys(endUpdate).length > 0) {
      await this.prisma.endereco.update({ where: { id: endAtual.id }, data: endUpdate });
    } else if (!endAtual) {
      const novo = await this.prisma.endereco.create({ data: { ...endUpdate, cep: data.cep, rua: data.rua, numero: data.numero, complemento: data.complemento, cidade: data.cidade, uf: data.uf as any, bairro: data.bairro } });
      endId = novo.id;
      await this.prisma.responsavel.update({ where: { id: matricula.segundoResponsavelId! }, data: { enderecoId: endId } });
    }
    const celularNorm = this.normalizePhone((data as any).celular, 'Celular');
    const contatoUpdate = this.buildPartialUpdate(matricula.segundoResponsavel as any, { celular: celularNorm as any, email: data.email });
    try {
      if (Object.keys(contatoUpdate).length > 0) {
        await this.prisma.responsavel.update({ where: { id: matricula.segundoResponsavelId! }, data: contatoUpdate as any });
      }
    } catch (e: any) {
      if (e?.code === 'P2002' && e?.meta?.target?.includes('email')) {
        throw new BadRequestException('E-mail já cadastrado para outro responsável.');
      }
      throw e;
    }
    await this.prisma.matricula.update({ where: { id: matriculaId }, data: ({ pendenteResp2Endereco: false, segundoResponsavelEmail: data.email, segundoResponsavelCelular: celularNorm } as any) });
    return {
      matriculaId,
      segundoResponsavelId: matricula.segundoResponsavelId,
      message: 'Etapa 2B (endereço do segundo responsável) concluída com sucesso.'
    };
  }

  async updateStep2Matricula(matriculaId: string, data: Etapa2EnderecoDto) {
    const matricula = await this.prisma.matricula.findUnique({ where: { id: matriculaId }, include: { responsavel: { include: { endereco: true } } } });
    if (!matricula) throw new NotFoundException('Matrícula não encontrada');
    if (matricula.etapaAtual > 2) throw new BadRequestException('Etapa já concluída');
    if (matricula.etapaAtual < 1) throw new BadRequestException('Sequência inválida');

    const enderecoAtual = matricula.responsavel.endereco || null;
    const enderecoUpdate = this.buildPartialUpdate(enderecoAtual, {
      cep: data.cep,
      rua: data.rua,
      numero: data.numero,
      complemento: data.complemento,
      cidade: data.cidade,
      uf: data.uf as any,
      bairro: data.bairro,
    } as any);

    let enderecoId = enderecoAtual?.id;
    if (enderecoAtual && Object.keys(enderecoUpdate).length > 0) {
      await this.prisma.endereco.update({ where: { id: enderecoAtual.id }, data: enderecoUpdate });
    } else if (!enderecoAtual) {
      const novo = await this.prisma.endereco.create({
        data: {
          cep: data.cep,
          rua: data.rua,
          numero: data.numero,
          complemento: data.complemento,
          cidade: data.cidade,
          uf: data.uf as any,
          bairro: data.bairro,
        }
      });
      enderecoId = novo.id;
      await this.prisma.responsavel.update({ where: { id: matricula.responsavelId }, data: { enderecoId } });
    }

    const celularNorm = this.normalizePhone((data as any).celular, 'Celular');
    const contatoUpdate = this.buildPartialUpdate<{
      celular?: string | null;
      email?: string | null;
    }>(matricula.responsavel as any, { celular: celularNorm as any, email: data.email });
    try {
      if (Object.keys(contatoUpdate).length > 0) {
        await this.prisma.responsavel.update({ where: { id: matricula.responsavelId }, data: contatoUpdate as any });
      }
    } catch (e: any) {
      if (e?.code === 'P2002' && e?.meta?.target?.includes('email')) {
        throw new BadRequestException('E-mail já cadastrado para outro responsável.');
      }
      throw e;
    }

    const updateData: any = { etapaAtual: 2, responsavelEmail: data.email };
    if (Object.prototype.hasOwnProperty.call(data as any, 'temSegundoResponsavel')) {
      const temSegundo = !!(data as any).temSegundoResponsavel;
      if (temSegundo) {
        updateData.temSegundoResponsavel = true;
        updateData.pendenteResp2Dados = true;
        updateData.pendenteResp2Endereco = true;
      } else {
        updateData.temSegundoResponsavel = false;
        updateData.pendenteResp2Dados = false;
        updateData.pendenteResp2Endereco = false;
      }
    }
    const updated = await this.prisma.matricula.update({
      where: { id: matriculaId },
      data: updateData,
      select: { id: true, etapaAtual: true }
    });

    try {
      const usuario = await this.prisma.usuario.findUnique({ where: { email: data.email } });
      if (usuario) {
        await this.prisma.matricula.update({
          where: { id: matriculaId },
          data: ({ usuario: { connect: { id: usuario.id } } } as any),
        });
      }
    } catch {}
    return {
      matriculaId: updated.id,
      etapaAtual: updated.etapaAtual,
      message: 'Etapa 2 concluída com sucesso.'
    };
  }

  async createAlunoMatricula(matriculaId: string, data: Etapa3AlunoDto) {
  const matricula = await this.prisma.matricula.findUnique({ where: { id: matriculaId }, include: { responsavel: { include: { endereco: true } }, aluno: true } });
    if (!matricula) throw new NotFoundException('Matrícula não encontrada');
    if (matricula.etapaAtual > 3) throw new BadRequestException('Etapa já concluída');
    if (matricula.etapaAtual < 2) throw new BadRequestException('Etapa anterior não concluída');

    if (data.cpf) {
      const existente = await this.prisma.aluno.findUnique({ where: { cpf: data.cpf } }).catch(() => null);
      if (existente && existente.id !== matricula.alunoId) {
        throw new BadRequestException('CPF do aluno já cadastrado em outra matrícula.');
      }
    }
    const alunoAtual = matricula.aluno as any;
    const alunoData = this.buildPartialUpdate(alunoAtual, {
      nome: data.nome,
      genero: data.genero,
      dataNascimento: this.parseDateInput(data.dataNascimento),
      nacionalidade: data.nacionalidade,
      cidadeNatal: data.cidadeNatal,
      estadoCivil: data.estadoCivil as any,
      cpf: data.cpf,
    } as any, { dataNascimento: (v) => this.parseDateInput(v) } as any);
    const alunoUpdate = await this.prisma.aluno.update({
      where: { id: matricula.alunoId },
      data: alunoData as any,
      select: { id: true }
    });
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
    return {
      matriculaId,
      alunoId: alunoUpdate.id,
      etapaAtual: 2,
      necessitaEtapa3b: true,
      message: 'Dados do aluno registrados (etapa 3). Endereço do aluno pendente (etapa 3B).'
    };
  }

  async createEnderecoAlunoMatricula(matriculaId: string, alunoId: string, data: Etapa3bEnderecoAlunoDto) {
  const matricula = await this.prisma.matricula.findUnique({ where: { id: matriculaId }, include: { aluno: { include: { alunoResponsaveis: { include: { responsavel: { include: { endereco: true } } } } } }, responsavel: { include: { endereco: true } } } });
    if (!matricula) throw new NotFoundException('Matrícula não encontrada');
    if (matricula.alunoId !== alunoId) throw new BadRequestException('Aluno não pertence à matrícula');
  const aluno = matricula.aluno;
  if (!aluno) throw new NotFoundException('Aluno não encontrado');

    if (data.moraComResponsavel) {
      const telNorm = this.normalizePhone((data as any).telefone, 'Telefone');
      const celNorm = this.normalizePhone((data as any).celular, 'Celular');
      const whatsNorm = this.normalizePhone((data as any).whatsapp, 'WhatsApp');
      const nomeAlvo = (data.moraComResponsavelNome || '').trim();
      const responsaveis = (aluno as any).alunoResponsaveis?.map((ar: any) => ar.responsavel) || [];
      const escolhido = nomeAlvo
        ? responsaveis.find((r: any) => (r?.nome || '').trim().toLowerCase() === nomeAlvo.toLowerCase())
        : matricula.responsavel;
      if (!escolhido) {
        throw new BadRequestException('Responsável não encontrado pelo nome informado');
      }
      const end = escolhido.endereco;
      if (!end) {
        throw new BadRequestException('Responsável selecionado não possui endereço cadastrado');
      }
      const alunoEndAtual = aluno as any;
      const alunoEndData = this.buildPartialUpdate(alunoEndAtual, {
        moraComResponsavel: true as any,
        telefone: telNorm ?? undefined,
        celular: celNorm as any,
        whatsapp: whatsNorm as any,
        email: data.email,
        cep: end?.cep || null,
        rua: end?.rua || null,
        numero: end?.numero || null,
        complemento: end?.complemento || null,
        bairro: end?.bairro || null,
        cidade: end?.cidade || null,
        uf: (end?.uf as any) || null,
      } as any);
      if (Object.keys(alunoEndData).length > 0) {
        await this.prisma.aluno.update({ where: { id: alunoId }, data: alunoEndData as any });
      }
    } else {
      const telNorm = this.normalizePhone((data as any).telefone, 'Telefone');
      const celNorm = this.normalizePhone((data as any).celular, 'Celular');
      const whatsNorm = this.normalizePhone((data as any).whatsapp, 'WhatsApp');
      const alunoEndAtual = aluno as any;
      const alunoEndData = this.buildPartialUpdate(alunoEndAtual, {
        moraComResponsavel: false as any,
        telefone: telNorm ?? undefined,
        celular: celNorm as any,
        whatsapp: whatsNorm as any,
        email: data.email,
        cep: data.cep ?? undefined,
        rua: data.rua ?? undefined,
        numero: data.numero ?? undefined,
        complemento: data.complemento ?? undefined,
        bairro: data.bairro ?? undefined,
        cidade: data.cidade ?? undefined,
        uf: (data.uf as any) ?? undefined,
      } as any);
      if (Object.keys(alunoEndData).length > 0) {
        await this.prisma.aluno.update({ where: { id: alunoId }, data: alunoEndData as any });
      }
    }
    const m2: any = await this.prisma.matricula.findUnique({ where: { id: matriculaId } });
    await this.prisma.matricula.update({ where: { id: matriculaId }, data: { etapaAtual: 3, pendenteEnderecoAluno: false, completo: !m2?.temSegundoResponsavel || (!(m2?.pendenteResp2Dados) && !(m2?.pendenteResp2Endereco)) } });
    return { matriculaId, alunoId, etapaAtual: 3, completo: true, message: 'Endereço do aluno (etapa 3B) concluído com sucesso.' };
  }

  async getStatusMatricula(matriculaId: string): Promise<CadastroStatusDto> {
    const mRaw = await this.prisma.matricula.findUnique({ where: { id: matriculaId } });
    const m: any = mRaw as any;
    if (!m) throw new NotFoundException('Matrícula não encontrada');
    return {
      responsavelId: m.responsavelId,
      etapaAtual: m.etapaAtual,
      completo: m.completo,
      temSegundoResponsavel: m.temSegundoResponsavel,
      pendenteResp2Dados: m.pendenteResp2Dados,
      pendenteResp2Endereco: m.pendenteResp2Endereco,
      pendenteEnderecoAluno: m.pendenteEnderecoAluno,
    } as any;
  }

  async integrateSponteMatricula(matriculaId: string) {
    const m = await this.prisma.matricula.findUnique({ where: { id: matriculaId }, include: { aluno: { include: { responsavel: { include: { endereco: true } } } } } });
    if (!m) throw new NotFoundException('Matrícula não encontrada');
    return this.integrateSponte(m.alunoId);
  }

  async getResponsaveisMatricula(matriculaId: string): Promise<ResponsavelResponseDto[]> {
    const matricula = await this.prisma.matricula.findUnique({
      where: { id: matriculaId },
      include: {
        responsavel: {
          include: { endereco: true }
        },
        aluno: {
          include: {
            alunoResponsaveis: {
              include: {
                responsavel: {
                  include: { endereco: true }
                }
              }
            }
          }
        }
      }
    });

    if (!matricula) {
      throw new NotFoundException('Matrícula não encontrada');
    }

  const responsaveis: ResponsavelResponseDto[] = [];

    const responsavelPrincipal = matricula.responsavel;
    responsaveis.push({
      id: responsavelPrincipal.id,
      nome: responsavelPrincipal.nome,
      genero: responsavelPrincipal.genero as string,
      dataNascimento: this.formatDateBR(responsavelPrincipal.dataNascimento),
      estadoCivil: responsavelPrincipal.estadoCivil as string,
      rg: responsavelPrincipal.rg,
      orgaoExpeditor: responsavelPrincipal.orgaoExpeditor,
      dataExpedicao: this.formatDateBR(responsavelPrincipal.dataExpedicao),
      cpf: responsavelPrincipal.cpf,
      pessoaJuridica: responsavelPrincipal.pessoaJuridica,
      celular: responsavelPrincipal.celular,
      email: responsavelPrincipal.email,
      financeiro: responsavelPrincipal.financeiro,
      etapaAtual: responsavelPrincipal.etapaAtual,
      endereco: {
        id: responsavelPrincipal.endereco.id,
        cep: responsavelPrincipal.endereco.cep,
        rua: responsavelPrincipal.endereco.rua,
        numero: responsavelPrincipal.endereco.numero,
        complemento: responsavelPrincipal.endereco.complemento,
        cidade: responsavelPrincipal.endereco.cidade,
        uf: responsavelPrincipal.endereco.uf,
        bairro: responsavelPrincipal.endereco.bairro,
      },
      criadoEm: this.formatDateTimeBR(responsavelPrincipal.criadoEm),
      atualizadoEm: this.formatDateTimeBR(responsavelPrincipal.atualizadoEm),
      ativo: responsavelPrincipal.ativo,
    });

    const seen = new Set<string>();
    seen.add(responsavelPrincipal.id);
    for (const alunoResp of matricula.aluno.alunoResponsaveis) {
      const resp = alunoResp.responsavel;
      if (!seen.has(resp.id)) {
        seen.add(resp.id);
        responsaveis.push({
          id: resp.id,
          nome: resp.nome,
          genero: resp.genero as string,
          dataNascimento: this.formatDateBR(resp.dataNascimento),
          estadoCivil: resp.estadoCivil as string,
          rg: resp.rg,
          orgaoExpeditor: resp.orgaoExpeditor,
          dataExpedicao: this.formatDateBR(resp.dataExpedicao),
          cpf: resp.cpf,
          pessoaJuridica: resp.pessoaJuridica,
          celular: resp.celular,
          email: resp.email,
          financeiro: resp.financeiro,
          etapaAtual: resp.etapaAtual,
          endereco: {
            id: resp.endereco.id,
            cep: resp.endereco.cep,
            rua: resp.endereco.rua,
            numero: resp.endereco.numero,
            complemento: resp.endereco.complemento,
            cidade: resp.endereco.cidade,
            uf: resp.endereco.uf,
            bairro: resp.endereco.bairro,
          },
          criadoEm: this.formatDateTimeBR(resp.criadoEm),
          atualizadoEm: this.formatDateTimeBR(resp.atualizadoEm),
          ativo: resp.ativo,
        });
      }
    }

    return responsaveis;
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
