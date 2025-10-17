import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { cpf as cpfValidator, cnpj as cnpjValidator } from 'cpf-cnpj-validator';
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

  private normalizeDocumentoPessoa(raw: string | null | undefined, pessoaJuridica: boolean): string {
    const digits = (raw || '').toString().replace(/\D+/g, '');
    if (!digits) return '';
    if (pessoaJuridica) {
      if (!cnpjValidator.isValid(digits)) {
        throw new BadRequestException('CNPJ inválido. Informe um CNPJ válido com 14 dígitos.');
      }
      return digits;
    } else {
      if (!cpfValidator.isValid(digits)) {
        throw new BadRequestException('CPF inválido. Informe um CPF válido com 11 dígitos.');
      }
      return digits;
    }
  }

  private computeEtapaLabel(m: { etapaAtual: number; temSegundoResponsavel?: boolean; pendenteResp2Dados?: boolean; pendenteResp2Endereco?: boolean; pendenteEnderecoAluno?: boolean }): string {

    const e = m.etapaAtual || 0;
    if (e <= 1) {
      return '2';
    }
    if (e === 2) {
      if (m.temSegundoResponsavel) {
        if (m.pendenteResp2Dados) return '1b';
        if (m.pendenteResp2Endereco) return '2b';
      }
      return '3';
    }
    if (e >= 3) {
      return '3b';
    }
    return '2';
  }


  async iniciarMatricula(data: Etapa1ResponsavelDto, usuarioEmail?: string, usuarioId?: string) {
    const estadoCivilOpt = (data as any).estadoCivil === '' ? null : (data as any).estadoCivil;
    const orgaoExpeditorOpt = (data as any).orgaoExpeditor && String((data as any).orgaoExpeditor).trim() === '' ? null : (data as any).orgaoExpeditor;
    const dataExpedicaoOpt = (data as any).dataExpedicao && String((data as any).dataExpedicao).trim() === '' ? null : (data as any).dataExpedicao;
    const doc = this.normalizeDocumentoPessoa((data as any).cpf, !!(data as any).pessoaJuridica);
    let existingResp: any = null;
    if (data.rg || doc) {
      const or: any[] = [];
      if (data.rg) or.push({ rg: data.rg });
      if (doc) or.push({ cpf: doc });
      if (or.length > 0) {
        existingResp = await this.prisma.responsavel.findFirst({
          where: { OR: or },
          select: { id: true, nome: true, cpf: true, enderecoId: true, genero: true, dataNascimento: true, estadoCivil: true, rg: true, orgaoExpeditor: true, dataExpedicao: true, pessoaJuridica: true },
        });
      }
    }

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
          estadoCivil: estadoCivilOpt as any,
          rg: data.rg,
          orgaoExpeditor: orgaoExpeditorOpt as any,
          dataExpedicao: dataExpedicaoOpt ? this.parseDateInput(dataExpedicaoOpt) : null,
          cpf: doc,
          pessoaJuridica: !!data.pessoaJuridica,
          celular: 'PENDENTE',
          email: usuarioEmail || `pending+${Date.now()}-${Math.random().toString(36).slice(2,8)}@temp.local`,
          financeiro: false,
          enderecoId: enderecoPlaceholder.id,
        } as any,
        select: { id: true, nome: true, cpf: true, enderecoId: true },
      });
    } else {
      responsavel = existingResp as any;
    }

    let reuseMatricula: any = null;
    if (usuarioId) {
      reuseMatricula = await this.prisma.matricula.findFirst({ where: { usuarioId, completo: false }, select: { id: true } });
    }
    if (!reuseMatricula && usuarioEmail) {
      reuseMatricula = await this.prisma.matricula.findFirst({ where: { responsavelEmail: usuarioEmail, completo: false }, select: { id: true } });
    }

    const matricula = reuseMatricula
      ? await this.prisma.matricula.update({
          where: { id: reuseMatricula.id },
          data: {
            responsavel: { connect: { id: responsavel.id } },
            responsavelNome: responsavel.nome,
            responsavelCpf: responsavel.cpf,
            responsavelEmail: usuarioEmail || null,
            usuario: usuarioId ? { connect: { id: usuarioId } } : undefined,
            etapaAtual: 1,
          } as any,
          select: { id: true, responsavelId: true, etapaAtual: true, alunoId: true }
        })
      : await this.prisma.matricula.create({
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

    try {
      const exists = await this.prisma.alunoResponsavel.findUnique({
        where: { alunoId_responsavelId: { alunoId: matricula.alunoId, responsavelId: responsavel.id } },
      }).catch(() => null);
      if (!exists) {
        await this.prisma.alunoResponsavel.create({
          data: {
            alunoId: matricula.alunoId,
            responsavelId: responsavel.id,
            tipoParentesco: (data as any).parentesco?.toUpperCase?.() || 'PRINCIPAL',
            responsavelFinanceiro: true,
            responsavelDidatico: true,
          },
        });
      } else {
        await this.prisma.alunoResponsavel.update({
          where: { alunoId_responsavelId: { alunoId: matricula.alunoId, responsavelId: responsavel.id } },
          data: {
            tipoParentesco: exists.tipoParentesco || ((data as any).parentesco?.toUpperCase?.() || 'PRINCIPAL'),
            responsavelFinanceiro: true,
            responsavelDidatico: true,
          },
        });
      }
    } catch (e) {
    }

  const mFull = await this.prisma.matricula.findUnique({ where: { id: matricula.id }, select: { etapaAtual: true, temSegundoResponsavel: true, pendenteResp2Dados: true, pendenteResp2Endereco: true, pendenteEnderecoAluno: true } });
    const etapaAtualLabel = this.computeEtapaLabel(mFull as any);
    return {
      matriculaId: matricula.id,
      responsavelId: matricula.responsavelId,
      etapaAtual: matricula.etapaAtual,
      etapaAtualLabel,
      message: 'Pré-matrícula iniciada com sucesso.'
    };
  }

  async updateStep1bResponsavel2(matriculaId: string, data: Etapa1bResponsavel2Dto) {
  const estadoCivilOpt2 = (data as any).estadoCivil === '' ? null : (data as any).estadoCivil;
  const orgaoExpeditorOpt2 = (data as any).orgaoExpeditor && String((data as any).orgaoExpeditor).trim() === '' ? null : (data as any).orgaoExpeditor;
  const dataExpedicaoOpt2 = (data as any).dataExpedicao && String((data as any).dataExpedicao).trim() === '' ? null : (data as any).dataExpedicao;
  const matriculaRaw = await this.prisma.matricula.findUnique({ where: { id: matriculaId } });
  const matricula: any = matriculaRaw as any;
  if (!matricula) throw new NotFoundException('Matrícula não encontrada');
  if (matricula.completo) throw new BadRequestException('Matrícula já finalizada. Inicie uma nova para continuar.');
  if (!matricula.temSegundoResponsavel) throw new BadRequestException('Segundo responsável não foi informado na etapa inicial');
  if (matricula.etapaAtual < 1) throw new BadRequestException('Sequência inválida');

    const doc2 = this.normalizeDocumentoPessoa((data as any).cpf, !!(data as any).pessoaJuridica);
    let existente = null as any;
    if (doc2) {
      existente = await this.prisma.responsavel.findUnique({ where: { cpf: doc2 } }).catch(() => null);
    }
    if (!existente && data.rg) {
      try {
        existente = await this.prisma.responsavel.findUnique({ where: { rg: data.rg } });
      } catch {}
    }
    if (existente) {
      if (existente.id === matricula.responsavelId) {
        throw new BadRequestException('CPF informado pertence ao responsável principal da matrícula');
      }
      // Não atualize dados de um responsável existente aqui para não impactar outras matrículas; apenas conecte
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
  const mFull = await this.prisma.matricula.findUnique({ where: { id: matriculaId }, select: { etapaAtual: true, temSegundoResponsavel: true, pendenteResp2Dados: true, pendenteResp2Endereco: true, pendenteEnderecoAluno: true } });
      const etapaAtualLabel = this.computeEtapaLabel(mFull as any);
      return { matriculaId, segundoResponsavelId: existente.id, etapaAtual: (mFull as any).etapaAtual, etapaAtualLabel, message: 'Etapa 1B (segundo responsável) concluída com sucesso.' };
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
          estadoCivil: (estadoCivilOpt2 as any),
          rg: data.rg,
          orgaoExpeditor: orgaoExpeditorOpt2 as any,
          dataExpedicao: dataExpedicaoOpt2 ? this.parseDateInput(dataExpedicaoOpt2) : null,
          cpf: doc2,
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
      if (e?.code === 'P2002') {
        const target = Array.isArray(e?.meta?.target) ? e.meta.target.join(',') : String(e?.meta?.target || '');
        if (target.includes('cpf') && doc2) {
          const byCpf = await this.prisma.responsavel.findUnique({ where: { cpf: doc2 } }).catch(() => null);
          if (byCpf) {
            if (byCpf.id === matricula.responsavelId) {
              throw new BadRequestException('CPF informado pertence ao responsável principal da matrícula');
            }
            resp2Id = byCpf.id;
          }
        }
        if (!resp2Id && target.includes('rg') && data.rg) {
          const byRg = await this.prisma.responsavel.findUnique({ where: { rg: data.rg } }).catch(() => null);
          if (byRg) {
            if (byRg.id === matricula.responsavelId) {
              throw new BadRequestException('RG informado pertence ao responsável principal da matrícula');
            }
            resp2Id = byRg.id;
          } else {
            throw new BadRequestException('RG já cadastrado para outro responsável.');
          }
        }
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
  const mFull = await this.prisma.matricula.findUnique({ where: { id: matriculaId }, select: { etapaAtual: true, temSegundoResponsavel: true, pendenteResp2Dados: true, pendenteResp2Endereco: true, pendenteEnderecoAluno: true } });
    const etapaAtualLabel = this.computeEtapaLabel(mFull as any);
    return { matriculaId, segundoResponsavelId: resp2Id!, etapaAtual: (mFull as any).etapaAtual, etapaAtualLabel, message: 'Etapa 1B (segundo responsável) concluída com sucesso.' };
  }

  async updateStep2bEnderecoResp2(matriculaId: string, data: Etapa2bEnderecoResp2Dto) {
  const matriculaRaw = await this.prisma.matricula.findUnique({ where: { id: matriculaId }, include: { segundoResponsavel: { include: { endereco: true } }, responsavel: { include: { endereco: true } } } });
  const matricula: any = matriculaRaw as any;
  if (!matricula) throw new NotFoundException('Matrícula não encontrada');
  if (matricula.completo) throw new BadRequestException('Matrícula já finalizada. Inicie uma nova para continuar.');
  if (!matricula.temSegundoResponsavel)
    throw new BadRequestException('Segundo responsável não indicado na etapa 2');
  if (!matricula.segundoResponsavelId)
    throw new BadRequestException('Etapa 1B (dados do segundo responsável) não concluída');

  const endAtual = matricula.segundoResponsavel?.endereco || null;
    const usePrincipalAddr = !!(data as any).moraComResponsavelPrincipal;
    const principalEnd = matricula.responsavel?.endereco || null;
    if (usePrincipalAddr && !principalEnd) {
      throw new BadRequestException('Responsável principal não possui endereço cadastrado para copiar.');
    }
    const targetAddr = usePrincipalAddr ? {
      cep: principalEnd.cep,
      rua: principalEnd.rua,
      numero: principalEnd.numero,
      complemento: principalEnd.complemento,
      cidade: principalEnd.cidade,
      uf: principalEnd.uf as any,
      bairro: principalEnd.bairro,
    } : {
      cep: data.cep,
      rua: data.rua,
      numero: data.numero,
      complemento: data.complemento,
      cidade: data.cidade,
      uf: data.uf as any,
      bairro: data.bairro,
    } as any;
    const endUpdate = this.buildPartialUpdate(endAtual, targetAddr as any);
    let endId = endAtual?.id;
    if (endAtual && Object.keys(endUpdate).length > 0) {
      const shared2 = await this.prisma.matricula.count({ where: { OR: [ { responsavelId: matricula.segundoResponsavelId! }, { segundoResponsavelId: matricula.segundoResponsavelId! } ], NOT: { id: matriculaId } } });
      if (shared2 === 0) {
        await this.prisma.endereco.update({ where: { id: endAtual.id }, data: endUpdate });
      }
    } else if (!endAtual) {
      const novo = await this.prisma.endereco.create({ data: { ...endUpdate, ...targetAddr } });
      endId = novo.id;
      const shared2 = await this.prisma.matricula.count({ where: { OR: [ { responsavelId: matricula.segundoResponsavelId! }, { segundoResponsavelId: matricula.segundoResponsavelId! } ], NOT: { id: matriculaId } } });
      if (shared2 === 0) {
        await this.prisma.responsavel.update({ where: { id: matricula.segundoResponsavelId! }, data: { enderecoId: endId } });
      }
    }
    await this.prisma.matricula.update({ where: { id: matriculaId }, data: ({
      segRespEnderecoCep: targetAddr.cep,
      segRespEnderecoRua: targetAddr.rua,
      segRespEnderecoNumero: targetAddr.numero,
      segRespEnderecoComplemento: targetAddr.complemento,
      segRespEnderecoCidade: targetAddr.cidade,
      segRespEnderecoUf: targetAddr.uf as any,
      segRespEnderecoBairro: targetAddr.bairro,
    } as any) });
    const celularNorm = this.normalizePhone((data as any).celular, 'Celular');
    const contatoUpdate = this.buildPartialUpdate(matricula.segundoResponsavel as any, { celular: celularNorm as any, email: data.email });
    try {
      if (Object.keys(contatoUpdate).length > 0) {
        const shared = await this.prisma.matricula.count({ where: { OR: [ { responsavelId: matricula.segundoResponsavelId! }, { segundoResponsavelId: matricula.segundoResponsavelId! } ], NOT: { id: matriculaId } } });
        if (shared === 0) {
          await this.prisma.responsavel.update({ where: { id: matricula.segundoResponsavelId! }, data: contatoUpdate as any });
        }
      }
    } catch (e: any) {
      if (e?.code === 'P2002' && e?.meta?.target?.includes('email')) {
        throw new BadRequestException('E-mail já cadastrado para outro responsável.');
      }
      throw e;
    }
  await this.prisma.matricula.update({ where: { id: matriculaId }, data: ({ pendenteResp2Endereco: false, segundoResponsavelEmail: data.email, segundoResponsavelCelular: celularNorm, segundoRespMoraComPrincipal: (data as any).moraComResponsavelPrincipal } as any) });
    const mFull = await this.prisma.matricula.findUnique({ where: { id: matriculaId }, select: { etapaAtual: true, pendenteResp2Dados: true, pendenteResp2Endereco: true, pendenteEnderecoAluno: true } });
    const etapaAtualLabel = this.computeEtapaLabel(mFull as any);
    return { matriculaId, segundoResponsavelId: matricula.segundoResponsavelId, etapaAtual: (mFull as any).etapaAtual, etapaAtualLabel, message: 'Etapa 2B (endereço do segundo responsável) concluída com sucesso.' };
  }

  async updateStep2Matricula(matriculaId: string, data: Etapa2EnderecoDto) {
    const matricula = await this.prisma.matricula.findUnique({ where: { id: matriculaId }, include: { responsavel: { include: { endereco: true } } } });
    if (!matricula) throw new NotFoundException('Matrícula não encontrada');
    if (matricula.completo) throw new BadRequestException('Matrícula já finalizada. Inicie uma nova para continuar.');
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
      const shared = await this.prisma.matricula.count({ where: { OR: [ { responsavelId: matricula.responsavelId }, { segundoResponsavelId: matricula.responsavelId } ], NOT: { id: matriculaId } } });
      if (shared === 0) {
        await this.prisma.endereco.update({ where: { id: enderecoAtual.id }, data: enderecoUpdate });
      }
      await this.prisma.matricula.update({ where: { id: matriculaId }, data: ({
        respEnderecoCep: data.cep,
        respEnderecoRua: data.rua,
        respEnderecoNumero: data.numero,
        respEnderecoComplemento: data.complemento,
        respEnderecoCidade: data.cidade,
        respEnderecoUf: data.uf as any,
        respEnderecoBairro: data.bairro,
      } as any) });
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
      const shared = await this.prisma.matricula.count({ where: { OR: [ { responsavelId: matricula.responsavelId }, { segundoResponsavelId: matricula.responsavelId } ], NOT: { id: matriculaId } } });
      if (shared === 0) {
        await this.prisma.responsavel.update({ where: { id: matricula.responsavelId }, data: { enderecoId } });
      }
        await this.prisma.matricula.update({ where: { id: matriculaId }, data: ({
          respEnderecoCep: data.cep,
          respEnderecoRua: data.rua,
          respEnderecoNumero: data.numero,
          respEnderecoComplemento: data.complemento,
          respEnderecoCidade: data.cidade,
          respEnderecoUf: data.uf as any,
          respEnderecoBairro: data.bairro,
        } as any) });
    }

    const celularNorm = this.normalizePhone((data as any).celular, 'Celular');
    const contatoUpdate = this.buildPartialUpdate<{
      celular?: string | null;
      email?: string | null;
    }>(matricula.responsavel as any, { celular: celularNorm as any, email: data.email });
    try {
      if (Object.keys(contatoUpdate).length > 0) {
        const shared = await this.prisma.matricula.count({ where: { OR: [ { responsavelId: matricula.responsavelId }, { segundoResponsavelId: matricula.responsavelId } ], NOT: { id: matriculaId } } });
        if (shared === 0) {
          await this.prisma.responsavel.update({ where: { id: matricula.responsavelId }, data: contatoUpdate as any });
        }
          await this.prisma.matricula.update({ where: { id: matriculaId }, data: ({ responsavelEmail: data.email, responsavelCelular: celularNorm } as any) });
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
  const mFull = await this.prisma.matricula.findUnique({ where: { id: updated.id }, select: { etapaAtual: true, temSegundoResponsavel: true, pendenteResp2Dados: true, pendenteResp2Endereco: true, pendenteEnderecoAluno: true } });
    const etapaAtualLabel = this.computeEtapaLabel(mFull as any);
    return { matriculaId: updated.id, etapaAtual: updated.etapaAtual, etapaAtualLabel, message: 'Etapa 2 concluída com sucesso.' };
  }

  async createAlunoMatricula(matriculaId: string, data: Etapa3AlunoDto) {
  const matricula = await this.prisma.matricula.findUnique({ where: { id: matriculaId }, include: { responsavel: { include: { endereco: true } }, aluno: true } });
    if (!matricula) throw new NotFoundException('Matrícula não encontrada');
    if (matricula.completo) throw new BadRequestException('Matrícula já finalizada. Inicie uma nova para continuar.');
    if (matricula.etapaAtual > 3) throw new BadRequestException('Etapa já concluída');
    if (matricula.etapaAtual < 2) throw new BadRequestException('Etapa anterior não concluída');

    if (data.cpf) {
      const existente = await this.prisma.aluno.findUnique({ where: { cpf: data.cpf } }).catch(() => null);
      if (existente && existente.id !== matricula.alunoId) {
        throw new BadRequestException('CPF do aluno já cadastrado em outra matrícula.');
      }
    }
    const alunoAtual = matricula.aluno as any;
    const nacionalidadeOpt = (data as any).nacionalidade && String((data as any).nacionalidade).trim() === '' ? null : (data as any).nacionalidade;
    const alunoData = this.buildPartialUpdate(alunoAtual, {
      nome: data.nome,
      genero: data.genero,
      dataNascimento: this.parseDateInput(data.dataNascimento),
      nacionalidade: nacionalidadeOpt as any,
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
        etapaAtual: 3,
      }
    });
  const etapaAtualLabel = this.computeEtapaLabel({ etapaAtual: 3, temSegundoResponsavel: (matricula as any).temSegundoResponsavel, pendenteResp2Dados: (matricula as any).pendenteResp2Dados, pendenteResp2Endereco: (matricula as any).pendenteResp2Endereco, pendenteEnderecoAluno: true });
    return { matriculaId, alunoId: alunoUpdate.id, etapaAtual: 3, etapaAtualLabel, necessitaEtapa3b: true, message: 'Dados do aluno registrados (etapa 3). Endereço do aluno pendente (etapa 3B).' };
  }

  async createEnderecoAlunoMatricula(matriculaId: string, alunoId: string, data: Etapa3bEnderecoAlunoDto) {
  const matricula = await this.prisma.matricula.findUnique({ where: { id: matriculaId }, include: { aluno: { include: { alunoResponsaveis: { include: { responsavel: { include: { endereco: true } } } } } }, responsavel: { include: { endereco: true } } } });
    if (!matricula) throw new NotFoundException('Matrícula não encontrada');
    if (matricula.completo) throw new BadRequestException('Matrícula já finalizada. Inicie uma nova para continuar.');
    if (matricula.alunoId !== alunoId) throw new BadRequestException('Aluno não pertence à matrícula');
  const aluno = matricula.aluno;
  if (!aluno) throw new NotFoundException('Aluno não encontrado');

    if (data.moraComResponsavel) {
      const telRaw = (data as any).telefone;
      const telVal = telRaw == null ? undefined : (String(telRaw).trim() === '' ? '' : this.normalizePhone(telRaw, 'Telefone'));
      const celRaw = (data as any).celular;
      const celVal = celRaw == null ? undefined : (String(celRaw).trim() === '' ? '' : this.normalizePhone(celRaw, 'Celular'));
      const rawWhats = (data as any).whatsapp;
      const whatsNorm = (rawWhats == null || String(rawWhats).trim() === '') ? null : this.normalizePhone(rawWhats, 'WhatsApp');
      const emailRaw = (data as any).email;
      const emailVal = emailRaw == null ? undefined : (String(emailRaw).trim() === '' ? '' : emailRaw);
      const nomeAlvo = (data.moraComResponsavelNome || '').trim();
      if (!nomeAlvo) {
        throw new BadRequestException('Quando "moraComResponsavel" é true, o campo "moraComResponsavelNome" não pode ser vazio.');
      }
      const responsaveis = ((aluno as any).alunoResponsaveis?.map((ar: any) => ar.responsavel) || []) as any[];
      if (matricula.responsavel && !responsaveis.some(r => r.id === matricula.responsavel.id)) {
        responsaveis.push(matricula.responsavel as any);
      }
      const escolhido = responsaveis.find((r: any) => (r?.nome || '').trim().toLowerCase() === nomeAlvo.toLowerCase());
      if (!escolhido) {
        throw new BadRequestException('Responsável inválido: informe um responsável da matrícula em "moraComResponsavelNome".');
      }
      const end = escolhido.endereco;
      if (!end) {
        throw new BadRequestException('Responsável selecionado não possui endereço cadastrado');
      }
      const alunoEndAtual = aluno as any;
      const alunoEndData = this.buildPartialUpdate(alunoEndAtual, {
        moraComResponsavel: true as any,
  telefone: (telVal as any),
  celular: (celVal as any),
  whatsapp: (whatsNorm as any),
  email: emailVal as any,
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
      const telRaw = (data as any).telefone;
      const telVal = telRaw == null ? undefined : (String(telRaw).trim() === '' ? '' : this.normalizePhone(telRaw, 'Telefone'));
      const celRaw = (data as any).celular;
      const celVal = celRaw == null ? undefined : (String(celRaw).trim() === '' ? '' : this.normalizePhone(celRaw, 'Celular'));
      const rawWhats = (data as any).whatsapp;
      const whatsNorm = (rawWhats == null || String(rawWhats).trim() === '') ? null : this.normalizePhone(rawWhats, 'WhatsApp');
      const emailRaw = (data as any).email;
      const emailVal = emailRaw == null ? undefined : (String(emailRaw).trim() === '' ? '' : emailRaw);
      const alunoEndAtual = aluno as any;
      const alunoEndData = this.buildPartialUpdate(alunoEndAtual, {
        moraComResponsavel: false as any,
  telefone: (telVal as any),
  celular: (celVal as any),
  whatsapp: (whatsNorm as any),
  email: emailVal as any,
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
    const m2: any = await this.prisma.matricula.findUnique({ where: { id: matriculaId }, include: { responsavel: true } });
    const isCompleta = !m2?.temSegundoResponsavel || (!(m2?.pendenteResp2Dados) && !(m2?.pendenteResp2Endereco));
    const snapshotData: any = {};
    if (!m2?.responsavelNome) snapshotData.responsavelNome = m2?.responsavel?.nome || null;
    if (!m2?.responsavelEmail) snapshotData.responsavelEmail = m2?.responsavel?.email || null;
    if (!m2?.responsavelCpf) snapshotData.responsavelCpf = (m2?.responsavel as any)?.cpf || null;
  await this.prisma.matricula.update({ where: { id: matriculaId }, data: { etapaAtual: 3, pendenteEnderecoAluno: false, completo: isCompleta, ...snapshotData } });
  const mAfter = await this.prisma.matricula.findUnique({ where: { id: matriculaId }, select: { etapaAtual: true, temSegundoResponsavel: true, pendenteResp2Dados: true, pendenteResp2Endereco: true, pendenteEnderecoAluno: true } });
    const etapaAtualLabel = this.computeEtapaLabel(mAfter as any);
    return { matriculaId, alunoId, etapaAtual: 3, etapaAtualLabel, completo: isCompleta, message: 'Endereço do aluno (etapa 3B) concluído com sucesso.' };
  }

  async getStatusMatricula(matriculaId: string): Promise<CadastroStatusDto> {
    const mRaw = await this.prisma.matricula.findUnique({ where: { id: matriculaId } });
    const m: any = mRaw as any;
    if (!m) throw new NotFoundException('Matrícula não encontrada');
    const etapaAtualLabel = this.computeEtapaLabel({
      etapaAtual: m.etapaAtual,
      temSegundoResponsavel: m.temSegundoResponsavel,
      pendenteResp2Dados: m.pendenteResp2Dados,
      pendenteResp2Endereco: m.pendenteResp2Endereco,
      pendenteEnderecoAluno: m.pendenteEnderecoAluno,
    });
    return {
      responsavelId: m.responsavelId,
      etapaAtual: m.etapaAtual,
      etapaAtualLabel: etapaAtualLabel as any,
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
  orgaoExpeditor: responsavelPrincipal.orgaoExpeditor || '',
      dataExpedicao: this.formatDateBR(responsavelPrincipal.dataExpedicao),
      cpf: responsavelPrincipal.cpf,
      pessoaJuridica: responsavelPrincipal.pessoaJuridica,
  celular: (matricula as any)?.responsavelCelular || responsavelPrincipal.celular,
  email: (matricula as any)?.responsavelEmail || responsavelPrincipal.email,
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
          orgaoExpeditor: resp.orgaoExpeditor || '',
          dataExpedicao: this.formatDateBR(resp.dataExpedicao),
          cpf: resp.cpf,
          pessoaJuridica: resp.pessoaJuridica,
          celular: (matricula as any)?.segundoResponsavelCelular && resp.id === (matricula as any)?.segundoResponsavelId ? (matricula as any)?.segundoResponsavelCelular : resp.celular,
          email: (matricula as any)?.segundoResponsavelEmail && resp.id === (matricula as any)?.segundoResponsavelId ? (matricula as any)?.segundoResponsavelEmail : resp.email,
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
    const aluno = await this.prisma.aluno.findUnique({ where: { id: alunoId }, include: { responsavel: { include: { endereco: true } }, alunoResponsaveis: { include: { responsavel: { include: { endereco: true } } } } } });
    if (!aluno) throw new NotFoundException('Aluno não encontrado');
    const resp = aluno.responsavel as any;
    const enderecoResp = resp.endereco;
    const generoMap = (g: string | null | undefined) => {
      if (!g) return '';
      const v = String(g).trim().toUpperCase();
      if (v === 'M' || v === 'MASCULINO') return 'M';
      if (v === 'F' || v === 'FEMININO') return 'F';
      if (v === 'T' || v === 'TRANSGÊNERO' || v === 'TRANSGENERO') return 'T';
      if (v === 'GN' || v === 'NEUTRO') return 'GN';
      if (v === 'NB' || v === 'NÃO-BINÁRIO' || v === 'NAO-BINARIO' || v === 'NAO BINARIO') return 'NB';
      return '';
    };
    const formatDate = (isoOrDate: string | Date) => {
      const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
      return new Date(d).toISOString().slice(0,19);
    };
    const sanitize = (v: any) => {
      if (v == null) return '';
      const s = String(v).trim();
      if (!s || s.toUpperCase() === 'PENDENTE' || s.toUpperCase() === 'S/N') return '';
      return s;
    };
    const asUf = (uf: any) => (uf ? String(uf).toUpperCase() : '');
    const cidadeComUf = (cidade?: string | null, uf?: any) => {
      const c = sanitize(cidade);
      if (!c) return '';
      if (c.includes('|')) return c;
      const U = asUf(uf);
      return U ? `${c}|${U}` : c;
    };
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
      const nacionalidade = (aluno as any).nacionalidade && String((aluno as any).nacionalidade).trim()
        ? String((aluno as any).nacionalidade).trim()
        : 'Brasileiro(a)';
      const cidadeNatal = cidadeComUf((aluno as any).cidadeNatal, (aluno as any).uf);
      const cidadeAtual = cidadeComUf((aluno as any).cidade || enderecoResp?.cidade, (aluno as any).uf || enderecoResp?.uf);
      sponteAlunoResult = await this.sponte.insertAluno({
        nCodigoCliente: clienteCodigo,
        sToken: clienteToken,
        sNome: sanitize(aluno.nome),
        dDataNascimento: formatDate(aluno.dataNascimento),
        sCidade: cidadeAtual,
        sBairro: sanitize(aluno.bairro || enderecoResp?.bairro),
        sCEP: sanitize(aluno.cep || enderecoResp?.cep),
        sEndereco: sanitize(aluno.rua || enderecoResp?.rua),
        nNumeroEndereco: sanitize(aluno.numero || enderecoResp?.numero),
        sEmail: sanitize((aluno as any).email),
        sTelefone: sanitize((aluno as any).telefone),
        sCPF: sanitize(aluno.cpf),
        sRG: sanitize((aluno as any).rg),
        sCelular: sanitize((aluno as any).celular),
        sObservacao: 'Pré-matrícula (envio via API)',
        sSexo: generoMap(aluno.genero?.toString()),
        sProfissao: sanitize((aluno as any).profissao),
        sCidadeNatal: cidadeNatal,
        sNacionalidade: nacionalidade,
        sRa: sanitize((aluno as any).ra),
        sNumeroMatricula: sanitize((aluno as any).numeroMatricula),
        sSituacao: 'INTERESSE',
        sCursoInteresse: sanitize((aluno as any).cursoInteresse),
      });
      if (sponteAlunoResult) {
        const idMatch = sponteAlunoResult.match(/<AlunoID>(\d+)<\/AlunoID>/i) || sponteAlunoResult.match(/<IdAluno>(\d+)<\/IdAluno>/i);
        if (idMatch) sponteAlunoId = parseInt(idMatch[1], 10);
      }
      if (!sponteAlunoId) {
        const msg = parseRetornoOperacao(sponteAlunoResult) || 'Falha ao inserir aluno no Sponte';
        return { alunoId, erro: true, detalhe: msg, alunoResult: sponteAlunoResult };
      }
      try {
        await this.prisma.matricula.updateMany({ where: { alunoId }, data: { sponteAlunoId } });
      } catch (_) {
      }
      const mapParentesco = (p?: string | null) => {
        const v = (p || '').toString().normalize('NFD').replace(/\p{Diacritic}/gu,'').toUpperCase().trim();
        if (v === 'PAI') return -1;
        if (v === 'MAE') return -2;
        if (v === 'TUTOR' || v === 'RESPONSAVEL' || v === 'OUTRO' || v === 'PRINCIPAL') return -3;
        return -3;
      };
      const sanitizeNumber = (v: any) => {
        const s = sanitize(v);
        if (!s) return '';
        const digits = s.replace(/\D+/g, '');
        return digits;
      };

      const inserted: Array<{ responsavelId: string, result: string }> = [];
      const seen = new Set<string>();
      const allLinks = aluno.alunoResponsaveis || [];
      const doInsert = async (link: any) => {
        const r = link.responsavel as any;
        if (!r || seen.has(r.id)) return;
        seen.add(r.id);
        const end = r.endereco;
        const nTipoPessoa = r.pessoaJuridica ? 2 : 1; // 1 = Física, 2 = Jurídica
        const nParentesco = mapParentesco(link?.tipoParentesco);
        const lResponsavelFinanceiro = !!link?.responsavelFinanceiro;
        const lResponsavelDidatico = !!link?.responsavelDidatico;
        const result = await this.sponte.insertResponsavel({
          nCodigoCliente: clienteCodigo,
          sToken: clienteToken,
          sNome: sanitize(r.nome),
          dDataNascimento: formatDate((r as any).dataNascimento || new Date()),
          nParentesco,
          sCEP: sanitize(end?.cep),
          sEndereco: sanitize(end?.rua),
          nNumeroEndereco: sanitizeNumber(end?.numero),
          sRG: sanitize((r as any).rg),
          sCPFCNPJ: sanitize((r as any).cpf),
          sCidade: cidadeComUf(end?.cidade, end?.uf),
          sBairro: sanitize(end?.bairro),
          sEmail: sanitize((r as any).email),
          sTelefone: '',
          sCelular: sanitize((r as any).celular),
          nAlunoID: sponteAlunoId,
          lResponsavelFinanceiro,
          lResponsavelDidatico,
          sObservacao: `Responsável (${link?.tipoParentesco || 'PRINCIPAL'})`,
          sSexo: generoMap(r.genero?.toString()),
          sProfissao: sanitize((r as any).profissao),
          nTipoPessoa,
          sComplementoEndereco: sanitize(end?.complemento),
        });
        inserted.push({ responsavelId: r.id, result });
      };

      for (const link of allLinks) {
        await doInsert(link);
      }
      if (!seen.has(resp.id)) {
        await doInsert({ responsavel: resp, tipoParentesco: 'PRINCIPAL', responsavelFinanceiro: true, responsavelDidatico: true });
      }

      const principalInserted = inserted.find(x => x.responsavelId === resp.id)?.result || null;
      return { alunoId, sponteAlunoId, alunoResult: sponteAlunoResult, responsavelResult: principalInserted, responsaveisResult: inserted };
    } catch (e: any) {
      return { alunoId, erro: true, detalhe: e.message || 'Falha integração Sponte', alunoResult: sponteAlunoResult };
    }
  }
}
