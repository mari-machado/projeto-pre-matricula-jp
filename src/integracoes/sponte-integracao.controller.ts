import { BadRequestException, Body, Controller, Get, Header, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SponteService } from '../sponte/sponte.service';
import { UpdateAluno3Dto } from './dto/update-aluno3.dto';
import { UpdateResponsaveis2Dto } from './dto/update-responsaveis2.dto';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('integrações')
@Controller('integracoes/sponte')
export class SponteIntegracaoController {
  constructor(private readonly sponte: SponteService, private readonly prisma: PrismaService) {}
  private addOneDayForDb(val: string | Date): Date {
    const toDateOnly = (y: number, m: number, d: number) => new Date(y, m, d);
    const addDays = (dt: Date, days: number) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + days);
    if (val instanceof Date) {
      const base = toDateOnly(val.getFullYear(), val.getMonth(), val.getDate());
      return addDays(base, 1);
    }
    const s = String(val).trim();
    const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) {
      const y = parseInt(iso[1], 10);
      const mo = parseInt(iso[2], 10) - 1;
      const d = parseInt(iso[3], 10);
      return new Date(y, mo, d + 1);
    }
    const br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (br) {
      const d = parseInt(br[1], 10);
      const mo = parseInt(br[2], 10) - 1;
      const y = parseInt(br[3], 10);
      return new Date(y, mo, d + 1);
    }
    const parsed = new Date(s);
    if (!isNaN(parsed.getTime())) {
      return addDays(new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()), 1);
    }
    const now = new Date();
    return addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), 1);
  }

  private mapSexoToGeneroEnum(val: any): 'MASCULINO' | 'FEMININO' | undefined {
    if (val === undefined || val === null) return undefined;
    const raw = String(val).trim();
    if (!raw) return undefined;
    const up = raw.toUpperCase();
    if (up === 'M') return 'MASCULINO';
    if (up === 'F') return 'FEMININO';
    const norm = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (norm.startsWith('masc') || norm === 'masculino' || norm === 'homem') return 'MASCULINO';
    if (norm.startsWith('fem') || norm === 'feminino' || norm === 'mulher') return 'FEMININO';
    return undefined;
  }

  @Get('categorias')
  @ApiOperation({ summary: 'GetCategorias (Sponte)', description: 'Recupera categorias via SOAP GetCategorias' })
  @ApiResponse({ status: 200, description: 'XML retornado pelo Sponte (como string).', content: { 'application/xml': {} } })
  @Header('Content-Type', 'application/xml; charset=utf-8')
  async getCategorias(
  ) {
    const nCodigoClienteEnv = process.env.SPONTE_CODIGO_CLIENTE;
    const nCodigoCliente = nCodigoClienteEnv ? Number(nCodigoClienteEnv) : NaN;
    if (!Number.isFinite(nCodigoCliente)) {
      return '<error>SPONTE_CODIGO_CLIENTE não configurado no .env</error>';
    }
    const sToken = process.env.SPONTE_TOKEN;
    if (!sToken) {
      return '<error>SPONTE_TOKEN não configurado no .env</error>';
    }
    const xml = await this.sponte.getCategorias({ nCodigoCliente, sToken });
    return xml;
  }

  @Get('cursos')
  @ApiOperation({ summary: 'GetCursos (Sponte)', description: 'Recupera cursos via SOAP GetCursos' })
  @ApiQuery({ name: 'sParametrosBusca', type: String, required: false, description: 'Texto de busca opcional (ex.: nome do curso)' })
  @ApiResponse({ status: 200, description: 'XML retornado pelo Sponte (como string).', content: { 'application/xml': {} } })
  @Header('Content-Type', 'application/xml; charset=utf-8')
  async getCursos(
    @Query('sParametrosBusca') sParametrosBusca?: string,
    @Query() query?: Record<string, any>,
  ) {
    const nCodigoClienteEnv = process.env.SPONTE_CODIGO_CLIENTE;
    const nCodigoCliente = nCodigoClienteEnv ? Number(nCodigoClienteEnv) : NaN;
    if (!Number.isFinite(nCodigoCliente)) {
      return '<error>SPONTE_CODIGO_CLIENTE não configurado no .env</error>';
    }
    const sToken = process.env.SPONTE_TOKEN;
    if (!sToken) {
      return '<error>SPONTE_TOKEN não configurado no .env</error>';
    }
    let finalBusca = sParametrosBusca;
    if (!finalBusca || /;\s*$/.test(finalBusca)) {
      if (query) {
        const entries = Object.entries(query)
          .filter(([k]) => k !== 'sParametrosBusca')
          .map(([k, v]) => {
            const val = Array.isArray(v) ? v[0] : v;
            return `${String(k).trim()}=${String(val ?? '').trim()}`;
          })
          .filter((p) => p && p.includes('='));
        if (entries.length) {
          finalBusca = entries.join(';');
        }
      }
    }
    if (finalBusca) {
      finalBusca = finalBusca
        .split(';')
        .map((chunk) => chunk.trim())
        .filter((c) => c.length)
        .map((c) => {
          const idx = c.indexOf('=');
          if (idx === -1) return c;
          const left = c.slice(0, idx).trim();
          const right = c.slice(idx + 1).trim();
          return `${left}=${right}`;
        })
        .join(';');
    }

    const xml = await this.sponte.getCursos({ nCodigoCliente, sToken, sParametrosBusca: finalBusca });
    return xml;
  }

  @Get('alunos')
  @ApiOperation({ summary: 'GetAlunos (Sponte)', description: 'Consulta dados de um ou vários alunos via SOAP GetAlunos' })
  @ApiQuery({ name: 'sParametrosBusca', type: String, required: false, description: 'Parâmetros de busca (ex.: Nome=João;CPF=123...)' })
  @ApiResponse({ status: 200, description: 'XML retornado pelo Sponte (como string).', content: { 'application/xml': {} } })
  @Header('Content-Type', 'application/xml; charset=utf-8')
  async getAlunos(
    @Query('sParametrosBusca') sParametrosBusca?: string,
    @Query() query?: Record<string, any>,
  ) {
    const nCodigoClienteEnv = process.env.SPONTE_CODIGO_CLIENTE;
    const nCodigoCliente = nCodigoClienteEnv ? Number(nCodigoClienteEnv) : NaN;
    if (!Number.isFinite(nCodigoCliente)) {
      return '<error>SPONTE_CODIGO_CLIENTE não configurado no .env</error>';
    }
    const sToken = process.env.SPONTE_TOKEN;
    if (!sToken) {
      return '<error>SPONTE_TOKEN não configurado no .env</error>';
    }
    let finalBusca = sParametrosBusca;
    if (!finalBusca || /;\s*$/.test(finalBusca)) {
      if (query) {
        const entries = Object.entries(query)
          .filter(([k]) => k !== 'sParametrosBusca')
          .map(([k, v]) => {
            const val = Array.isArray(v) ? v[0] : v;
            return `${String(k).trim()}=${String(val ?? '').trim()}`;
          })
          .filter((p) => p && p.includes('='));
        if (entries.length) {
          finalBusca = entries.join(';');
        }
      }
    }
    if (finalBusca) {
      finalBusca = finalBusca
        .split(';')
        .map((chunk) => chunk.trim())
        .filter((c) => c.length)
        .map((c) => {
          const idx = c.indexOf('=');
          if (idx === -1) return c;
          const left = c.slice(0, idx).trim();
          const right = c.slice(idx + 1).trim();
          return `${left}=${right}`;
        })
        .join(';');
    }

    const xml = await this.sponte.getAlunos({ nCodigoCliente, sToken, sParametrosBusca: finalBusca });
    return xml;
  }

  @Get('alunos/responsaveis')
  @ApiOperation({ summary: 'Responsáveis do Aluno (Sponte)', description: 'Retorna os IDs e dados básicos dos responsáveis de um aluno via GetAlunos(AlunoID=...)' })
  @ApiQuery({ name: 'id', description: 'AlunoID do Sponte (query)', required: true, type: Number })
  @ApiResponse({ status: 200, description: 'IDs dos responsáveis do aluno', content: { 'application/json': {} } })
  async getResponsaveisPorAluno(@Query('id') id?: string) {
    const nCodigoClienteEnv = process.env.SPONTE_CODIGO_CLIENTE;
    const nCodigoCliente = nCodigoClienteEnv ? Number(nCodigoClienteEnv) : NaN;
    if (!Number.isFinite(nCodigoCliente)) {
      throw new BadRequestException('SPONTE_CODIGO_CLIENTE não configurado no .env');
    }
    const sToken = process.env.SPONTE_TOKEN;
    if (!sToken) {
      throw new BadRequestException('SPONTE_TOKEN não configurado no .env');
    }
    if (!id) {
      throw new BadRequestException('Parâmetro ?id é obrigatório');
    }
    const alunoId = Number(id);
    if (!Number.isFinite(alunoId)) {
      throw new BadRequestException('Parâmetro :id inválido');
    }
    const xml = await this.sponte.getAlunos({ nCodigoCliente, sToken, sParametrosBusca: `AlunoID=${alunoId}` });
    const responsaveis: Array<{ responsavelId: number; nome?: string; parentesco?: string }> = [];
    const seen = new Set<number>();
    const alunoBlocks = Array.from(xml.matchAll(/<wsAluno>([\s\S]*?)<\/wsAluno>/gi));
    for (const m of alunoBlocks) {
      const block = m[1];
      const respSectionMatch = block.match(/<Responsaveis>([\s\S]*?)<\/Responsaveis>/i);
      if (!respSectionMatch) continue;
      const respSection = respSectionMatch[1];
      const respBlocks = Array.from(respSection.matchAll(/<wsResponsaveis>([\s\S]*?)<\/wsResponsaveis>/gi));
      for (const rb of respBlocks) {
        const r = rb[1];
        const idMatch = r.match(/<ResponsavelID>([\s\S]*?)<\/ResponsavelID>/i);
        const nomeMatch = r.match(/<Nome>([\s\S]*?)<\/Nome>/i);
        const parMatch = r.match(/<Parentesco>([\s\S]*?)<\/Parentesco>/i);
        const rid = idMatch ? Number(String(idMatch[1]).trim()) : NaN;
        if (Number.isFinite(rid) && !seen.has(rid)) {
          seen.add(rid);
          responsaveis.push({ responsavelId: rid, nome: nomeMatch?.[1]?.trim() || undefined, parentesco: parMatch?.[1]?.trim() || undefined });
        }
      }
    }
    return { responsavelIds: responsaveis.map(r => r.responsavelId), responsaveis };
  }

  @Post('alunos/update')
  @ApiOperation({ summary: 'UpdateAlunos3 (Sponte)', description: 'Atualiza dados do aluno e pode vincular responsáveis' })
  @ApiBody({ type: UpdateAluno3Dto })
  @ApiResponse({ status: 200, description: 'XML retornado pelo Sponte (como string).', content: { 'application/xml': {} } })
  @ApiResponse({ status: 400, description: 'Erro retornado pelo Sponte' })
  async updateAluno(@Body() body: UpdateAluno3Dto, @Res({ passthrough: true }) res: Response) {
    const nCodigoClienteEnv = process.env.SPONTE_CODIGO_CLIENTE;
    const nCodigoCliente = nCodigoClienteEnv ? Number(nCodigoClienteEnv) : NaN;
    if (!Number.isFinite(nCodigoCliente)) {
      return '<error>SPONTE_CODIGO_CLIENTE não configurado no .env</error>';
    }
    const sToken = process.env.SPONTE_TOKEN;
    if (!sToken) {
      return '<error>SPONTE_TOKEN não configurado no .env</error>';
    }

    try {
      let targetAlunoId: string | null = null;
      let existingAlunoCpfFormat: 'masked' | 'digits' | null = null;
      let cpfDigits: string | null = null;
      if (body?.sCPF) {
        cpfDigits = String(body.sCPF).replace(/\D+/g, '') || null;
      }
      const maskCpf = (d: string) => d.replace(/\D+/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      if (cpfDigits && cpfDigits.length === 11) {
        const cpfMasked = maskCpf(cpfDigits);
        const byCpf = await this.prisma.aluno.findFirst({
          where: { OR: [{ cpf: cpfDigits }, { cpf: cpfMasked }] },
          select: { id: true, cpf: true },
        }).catch(() => null);
        if (byCpf) {
          targetAlunoId = byCpf.id;
          existingAlunoCpfFormat = byCpf.cpf.includes('.') ? 'masked' : 'digits';
        }
      }
      if (!targetAlunoId && body?.nAlunoID != null) {
        const mat = await this.prisma.matricula.findFirst({
          where: { sponteAlunoId: Number(body.nAlunoID) },
          select: { alunoId: true },
        }).catch(() => null);
        if (mat?.alunoId) targetAlunoId = mat.alunoId;
      }
      if (!targetAlunoId && body?.sEmail) {
        const byEmail = await this.prisma.aluno.findFirst({
          where: { email: body.sEmail },
          select: { id: true },
        }).catch(() => null);
        if (byEmail) targetAlunoId = byEmail.id;
      }
      if (targetAlunoId) {
        const parseCidadeUf = (val?: string) => {
          if (!val) return { cidade: undefined as any, uf: undefined as any };
          const parts = String(val).split('|');
          const cidade = (parts[0] || '').trim() || undefined;
          const uf = (parts[1] || '').trim().toUpperCase() || undefined;
          return { cidade, uf } as { cidade?: string; uf?: any };
        };
        const norm = (v?: string | null) => (v == null ? '' : String(v).trim().toLowerCase());
        const digits = (v?: string | null) => (v == null ? '' : String(v).replace(/\D+/g, ''));
        const dataAluno: Record<string, any> = {};
        if (body.sNome !== undefined) dataAluno.nome = body.sNome;
  if (body.dDataNascimento !== undefined) dataAluno.dataNascimento = this.addOneDayForDb(body.dDataNascimento);
        if (body.sCidade !== undefined) {
          const { cidade, uf } = parseCidadeUf(body.sCidade);
          if (cidade !== undefined) dataAluno.cidade = cidade;
          if (uf !== undefined) dataAluno.uf = uf;
        }
        if (body.sBairro !== undefined) dataAluno.bairro = body.sBairro;
        if (body.sCEP !== undefined) dataAluno.cep = body.sCEP;
        if (body.sEndereco !== undefined) dataAluno.rua = body.sEndereco;
        if (body.nNumeroEndereco !== undefined) dataAluno.numero = body.nNumeroEndereco;
        if (body.sComplementoEndereco !== undefined) dataAluno.complemento = body.sComplementoEndereco;
        if (body.sEmail !== undefined) dataAluno.email = body.sEmail;
        if (body.sTelefone !== undefined) dataAluno.telefone = body.sTelefone;
        if (body.sCelular !== undefined) {
          dataAluno.celular = body.sCelular;
          dataAluno.whatsapp = body.sCelular;
        }
        if (body.sCPF !== undefined) {
          const digits = String(body.sCPF).replace(/\D+/g, '');
          if (digits) {
            if (existingAlunoCpfFormat === 'masked') dataAluno.cpf = maskCpf(digits);
            else dataAluno.cpf = digits;
          }
        }
        if (body.sCidadeNatal !== undefined) {
          const { cidade: cnCidade } = parseCidadeUf(body.sCidadeNatal);
          if (cnCidade !== undefined) dataAluno.cidadeNatal = cnCidade;
        }
        if (body.sSexo !== undefined) {
          const genero = this.mapSexoToGeneroEnum(body.sSexo);
          if (genero) dataAluno.genero = genero;
        }
        const anyAddressProvided = [
          body.sCEP,
          body.sEndereco,
          body.nNumeroEndereco,
          body.sComplementoEndereco,
          body.sBairro,
          body.sCidade,
        ].some((v) => v !== undefined);

        if (anyAddressProvided) {
          const rel = await this.prisma.aluno.findUnique({
            where: { id: targetAlunoId },
            select: {
              responsavel: {
                select: {
                  endereco: {
                    select: { cep: true, rua: true, numero: true, complemento: true, bairro: true, cidade: true, uf: true },
                  },
                },
              },
            },
          });
          const respEnd = rel?.responsavel?.endereco;
          if (respEnd) {
            const cidadeUf = body.sCidade !== undefined ? parseCidadeUf(body.sCidade) : { cidade: undefined, uf: undefined };
            const diff = (
              (body.sCEP !== undefined && digits(body.sCEP) !== digits(respEnd.cep)) ||
              (body.sEndereco !== undefined && norm(body.sEndereco) !== norm(respEnd.rua)) ||
              (body.nNumeroEndereco !== undefined && norm(String(body.nNumeroEndereco)) !== norm(respEnd.numero)) ||
              (body.sComplementoEndereco !== undefined && norm(body.sComplementoEndereco) !== norm(respEnd.complemento)) ||
              (body.sBairro !== undefined && norm(body.sBairro) !== norm(respEnd.bairro)) ||
              (body.sCidade !== undefined && (
                norm(cidadeUf.cidade) !== norm(respEnd.cidade) ||
                (cidadeUf.uf ? String(cidadeUf.uf).toUpperCase() : undefined) !== (respEnd.uf ? String(respEnd.uf).toUpperCase() : undefined)
              ))
            );
            if (diff) {
              dataAluno.moraComResponsavel = false;
            }
          }
        }

        if (Object.keys(dataAluno).length > 0) {
          const updated = await this.prisma.aluno.update({ where: { id: targetAlunoId }, data: dataAluno, select: { id: true, cpf: true, nome: true, dataNascimento: true, genero: true } });
          const snapshot: Record<string, any> = {};
          if (dataAluno.nome !== undefined) snapshot.alunoNome = updated.nome;
          if (dataAluno.cpf !== undefined) snapshot.alunoCpf = updated.cpf;
          if (dataAluno.genero !== undefined) snapshot.alunoGenero = updated.genero;
          if (dataAluno.dataNascimento !== undefined) snapshot.alunoDataNascimento = updated.dataNascimento;
          if (Object.keys(snapshot).length > 0) {
            await this.prisma.matricula.updateMany({ where: { alunoId: updated.id }, data: snapshot });
          }
        }
      }
    } catch (err: any) {
      if (err?.code === 'P2002' && String(err?.meta?.target || '').includes('cpf')) {
        throw new BadRequestException('CPF do aluno já cadastrado.');
      }
    }
    const xml = await this.sponte.updateAlunos3({ nCodigoCliente, sToken, ...body });
    const retorno = this.sponte.parseRetornoOperacao(xml);
    const status = this.sponte.extractStatusFromRetorno(retorno || undefined);
    if (retorno) {
      const code = status?.code;
      const description = status?.description || retorno;
      if ((typeof code === 'number' && code !== 1) || (!code && !/sucesso/i.test(retorno))) {
        throw new BadRequestException(`Sponte: ${code ? code + ' - ' : ''}${description}`);
      }
    }
    res.type('application/xml; charset=utf-8');
    return xml;
  }

  @Post('responsaveis/update')
  @ApiOperation({ summary: 'UpdateResponsaveis2 (Sponte)', description: 'Atualiza dados do responsável e pode vincular ao aluno' })
  @ApiBody({ type: UpdateResponsaveis2Dto })
  @ApiResponse({ status: 200, description: 'XML retornado pelo Sponte (como string).', content: { 'application/xml': {} } })
  @ApiResponse({ status: 400, description: 'Erro retornado pelo Sponte' })
  async updateResponsavel(@Body() body: UpdateResponsaveis2Dto, @Res({ passthrough: true }) res: Response) {
    const nCodigoClienteEnv = process.env.SPONTE_CODIGO_CLIENTE;
    const nCodigoCliente = nCodigoClienteEnv ? Number(nCodigoClienteEnv) : NaN;
    if (!Number.isFinite(nCodigoCliente)) {
      return '<error>SPONTE_CODIGO_CLIENTE não configurado no .env</error>';
    }
    const sToken = process.env.SPONTE_TOKEN;
    if (!sToken) {
      return '<error>SPONTE_TOKEN não configurado no .env</error>';
    }

    try {
      const digits = (val?: string) => (val ? String(val).replace(/\D+/g, '') : '');
      const sDoc = digits(body.sCPFCNPJ);
      const email = body.sEmail?.trim();
      const rg = body.sRG?.trim();

      const whereOr: any[] = [];
      if (sDoc) {
        const cpfMasked = sDoc.length === 11 ? sDoc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : null;
        whereOr.push({ cpf: sDoc });
        if (cpfMasked) whereOr.push({ cpf: cpfMasked });
      }
      if (email) whereOr.push({ email });
      if (rg) whereOr.push({ rg });

      if (whereOr.length) {
        const found = await this.prisma.responsavel.findFirst({
          where: { OR: whereOr },
          select: { id: true, cpf: true, enderecoId: true },
        }).catch(() => null);

        if (found) {
          const maskCpf = (doc: string) => doc.replace(/\D+/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
          const parseCidadeUf = (val?: string) => {
            if (!val) return { cidade: undefined as any, uf: undefined as any };
            const parts = String(val).split('|');
            const cidade = (parts[0] || '').trim() || undefined;
            const uf = (parts[1] || '').trim().toUpperCase() || undefined;
            return { cidade, uf } as { cidade?: string; uf?: any };
          };

          const dataResp: Record<string, any> = {};
          if (body.sNome !== undefined) dataResp.nome = body.sNome;
          if (body.dDataNascimento !== undefined) dataResp.dataNascimento = this.addOneDayForDb(body.dDataNascimento);
          if (body.sSexo !== undefined) {
            const genero = this.mapSexoToGeneroEnum(body.sSexo);
            if (genero) dataResp.genero = genero;
          }
          if (body.sEmail !== undefined) dataResp.email = body.sEmail;
          if (body.sTelefone !== undefined) dataResp.telefone = body.sTelefone;
          if (body.sCelular !== undefined) dataResp.celular = body.sCelular;
          if (body.sRG !== undefined) dataResp.rg = body.sRG;
          if (body.lResponsavelFinanceiro !== undefined) dataResp.financeiro = !!body.lResponsavelFinanceiro;
          if (body.nTipoPessoa !== undefined) dataResp.pessoaJuridica = body.nTipoPessoa === 2;
          if (body.sCPFCNPJ !== undefined) {
            const doc = digits(body.sCPFCNPJ);
            if (doc) {
              if (body.nTipoPessoa === 2 || doc.length === 14) {
                dataResp.cpf = doc;
              } else if (doc.length === 11) {
                const keepMasked = found.cpf?.includes('.');
                dataResp.cpf = keepMasked ? maskCpf(doc) : doc;
              }
            }
          }

          let updatedResp: { id: string; nome: string; cpf: string | null; celular: string | null; email: string | null } | null = null;
          if (Object.keys(dataResp).length > 0) {
            updatedResp = await this.prisma.responsavel.update({
              where: { id: found.id },
              data: dataResp,
              select: { id: true, nome: true, cpf: true, celular: true, email: true },
            });
          }

          const dataEnd: Record<string, any> = {};
          if (body.sCEP !== undefined) dataEnd.cep = body.sCEP;
          if (body.sEndereco !== undefined) dataEnd.rua = body.sEndereco;
          if (body.nNumeroEndereco !== undefined) dataEnd.numero = body.nNumeroEndereco;
          if (body.sComplementoEndereco !== undefined) dataEnd.complemento = body.sComplementoEndereco;
          if (body.sBairro !== undefined) dataEnd.bairro = body.sBairro;
          if (body.sCidade !== undefined) {
            const { cidade, uf } = parseCidadeUf(body.sCidade);
            if (cidade !== undefined) dataEnd.cidade = cidade;
            if (uf !== undefined) dataEnd.uf = uf;
          }
          if (Object.keys(dataEnd).length > 0 && found.enderecoId) {
            await this.prisma.endereco.update({ where: { id: found.enderecoId }, data: dataEnd });
          }

          if (updatedResp) {
            const snapPrimary: Record<string, any> = {};
            if (dataResp.nome !== undefined) snapPrimary.responsavelNome = updatedResp.nome;
            if (dataResp.email !== undefined) snapPrimary.responsavelEmail = updatedResp.email;
            if (dataResp.celular !== undefined || dataResp.telefone !== undefined) snapPrimary.responsavelCelular = updatedResp.celular ?? dataResp.telefone ?? null;
            if (dataResp.cpf !== undefined) snapPrimary.responsavelCpf = updatedResp.cpf;
            if (Object.keys(snapPrimary).length > 0) {
              await this.prisma.matricula.updateMany({ where: { responsavelId: updatedResp.id }, data: snapPrimary });
            }

            const snapSecond: Record<string, any> = {};
            if (dataResp.nome !== undefined) snapSecond.segundoResponsavelNome = updatedResp.nome;
            if (dataResp.email !== undefined) snapSecond.segundoResponsavelEmail = updatedResp.email;
            if (dataResp.celular !== undefined || dataResp.telefone !== undefined) snapSecond.segundoResponsavelCelular = updatedResp.celular ?? dataResp.telefone ?? null;
            if (Object.keys(snapSecond).length > 0) {
              await this.prisma.matricula.updateMany({ where: { segundoResponsavelId: updatedResp.id }, data: snapSecond });
            }
          }
        }
      }
    } catch (err: any) {
      if (err?.code === 'P2002') {
        const tgt = String(err?.meta?.target || '');
        if (tgt.includes('cpf')) throw new BadRequestException('CPF/CNPJ do responsável já cadastrado.');
        if (tgt.includes('email')) throw new BadRequestException('E-mail do responsável já cadastrado.');
        if (tgt.includes('rg')) throw new BadRequestException('RG do responsável já cadastrado.');
      }
    }

    const payload: any = { ...body };
    if (payload.nAlunoID == null) {
      if (payload.lResponsavelFinanceiro !== undefined) delete payload.lResponsavelFinanceiro;
      if (payload.lResponsavelDidatico !== undefined) delete payload.lResponsavelDidatico;
      if (payload.nParentesco !== undefined) delete payload.nParentesco;
    }

    const xml = await this.sponte.updateResponsaveis2({ nCodigoCliente, sToken, ...payload });
    const retorno = this.sponte.parseRetornoOperacao(xml);
    const status = this.sponte.extractStatusFromRetorno(retorno || undefined);
    if (retorno) {
      const code = status?.code;
      const description = status?.description || retorno;
      if ((typeof code === 'number' && code !== 1) || (!code && !/sucesso/i.test(retorno))) {
        throw new BadRequestException(`Sponte: ${code ? code + ' - ' : ''}${description}`);
      }
    }
    res.type('application/xml; charset=utf-8');
    return xml;
  }

  @Get('matriculas/sponte-id')
  @ApiOperation({ summary: 'Obter SponteAlunoID por matrícula (query)', description: 'Retorna apenas o sponteAlunoId associado à matrícula, aceitando id ou codigo via query' })
  @ApiQuery({ name: 'id', description: 'ID da matrícula', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Objeto com sponteAlunoId', content: { 'application/json': {} } })
  @ApiResponse({ status: 400, description: 'Matrícula não encontrada ou ainda não integrada ao Sponte.' })
  async getSponteIdByMatriculaQuery(@Query('id') id?: string, @Query('codigo') codigo?: string) {
    const where: any = id ? { id } : (codigo ? { codigo } : null);
    if (!where) {
      throw new BadRequestException('Informe ?id=<uuid>')
    }
    const m = await this.prisma.matricula.findUnique({ where, select: { sponteAlunoId: true } });
    if (!m) {
      throw new BadRequestException('Matrícula não encontrada');
    }
    if (!m.sponteAlunoId) {
      throw new BadRequestException('Matrícula ainda não integrada ao Sponte');
    }
    return { sponteAlunoId: m.sponteAlunoId };
  }

  @Post('matriculas/curso-interesse')
  @ApiOperation({ summary: 'Armazenar curso de interesse na matrícula', description: 'Atualiza a matrícula com o ID do curso de interesse fornecido como string' })
  @ApiBody({ 
    description: 'Dados para atualizar curso de interesse', 
    schema: {
      type: 'object',
      required: ['matriculaId', 'cursoInteresseId'],
      properties: {
        matriculaId: { type: 'string', description: 'UUID da matrícula' },
        cursoInteresseId: { type: 'string', description: 'ID do curso de interesse (como string)' }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Matrícula atualizada com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro na validação dos dados' })
  async atualizarCursoInteresse(
    @Body() body: { matriculaId: string; cursoInteresseId: string }
  ) {
    const { matriculaId, cursoInteresseId } = body;
    
    if (!matriculaId) {
      throw new BadRequestException('matriculaId é obrigatório');
    }
    
    if (!cursoInteresseId) {
      throw new BadRequestException('cursoInteresseId é obrigatório');
    }

    try {
      const matricula = await this.prisma.matricula.findUnique({
        where: { id: matriculaId },
        select: { id: true, codigo: true }
      });

      if (!matricula) {
        throw new BadRequestException('Matrícula não encontrada');
      }

      const updated = await this.prisma.matricula.update({
        where: { id: matriculaId },
        data: { cursoInteresseId },
        select: { id: true, codigo: true, cursoInteresseId: true }
      });

      return {
        message: 'Curso de interesse atualizado com sucesso',
        matricula: {
          id: updated.id,
          codigo: updated.codigo,
          cursoInteresseId: updated.cursoInteresseId
        }
      };
    } catch (err: any) {
      if (err?.code === 'P2025') {
        throw new BadRequestException('Matrícula não encontrada');
      }
      throw err;
    }
  }
}