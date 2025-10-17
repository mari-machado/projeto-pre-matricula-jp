import { BadRequestException, Body, Controller, Get, Header, Param, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SponteService } from '../sponte/sponte.service';
import { UpdateAluno3Dto } from './dto/update-aluno3.dto';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('integrações')
@Controller('integracoes/sponte')
export class SponteIntegracaoController {
  constructor(private readonly sponte: SponteService, private readonly prisma: PrismaService) {}

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

  @Post('alunos/update')
  @ApiOperation({ summary: 'UpdateAlunos3 (Sponte)', description: 'Atualiza dados do aluno e pode vincular responsáveis' })
  @ApiBody({ type: UpdateAluno3Dto })
  @ApiResponse({ status: 200, description: 'XML retornado pelo Sponte (como string).', content: { 'application/xml': {} } })
  @ApiResponse({ status: 400, description: 'Erro retornado pelo Sponte' })
  @Header('Content-Type', 'application/xml; charset=utf-8')
  async updateAluno(@Body() body: UpdateAluno3Dto) {
    const nCodigoClienteEnv = process.env.SPONTE_CODIGO_CLIENTE;
    const nCodigoCliente = nCodigoClienteEnv ? Number(nCodigoClienteEnv) : NaN;
    if (!Number.isFinite(nCodigoCliente)) {
      return '<error>SPONTE_CODIGO_CLIENTE não configurado no .env</error>';
    }
    const sToken = process.env.SPONTE_TOKEN;
    if (!sToken) {
      return '<error>SPONTE_TOKEN não configurado no .env</error>';
    }
    let fetchedAlunoXml: string | null = null;
    if (body?.nAlunoID != null) {
      try {
        fetchedAlunoXml = await this.sponte.getAlunos({ nCodigoCliente, sToken, sParametrosBusca: `AlunoID=${body.nAlunoID}` });
        const alunoBlockMatch = fetchedAlunoXml.match(/<wsAluno>([\s\S]*?)<\/wsAluno>/i);
        if (alunoBlockMatch) {
          const alunoBlock = alunoBlockMatch[1];
          const ciMatch = alunoBlock.match(/<CursoInteresse>([\s\S]*?)<\/CursoInteresse>/i);
          const cursosRaw = (ciMatch ? ciMatch[1] : '').trim();
          const cursos = cursosRaw
            ? cursosRaw.split(';').map((s) => s.trim()).filter((s) => s.length > 0)
            : [];
          if (cursos.length === 0) {
            throw new BadRequestException('Aluno não possui curso de interesse no Sponte. Adicione ao menos um curso de interesse e tente novamente.');
          }
        }
      } catch (e) {
        if (e instanceof BadRequestException) throw e;
      }
    }

    try {
      let targetAlunoId: string | null = null;
      let cpfDigits: string | null = null;
      if (body?.sCPF) {
        cpfDigits = String(body.sCPF).replace(/\D+/g, '') || null;
      }
      if (!cpfDigits && fetchedAlunoXml) {
        const cpfMatch = fetchedAlunoXml.match(/<CPF>([\s\S]*?)<\/CPF>/i);
        const cpfRaw = cpfMatch ? cpfMatch[1]?.trim() : '';
        cpfDigits = cpfRaw ? cpfRaw.replace(/\D+/g, '') : null;
      }
      if (cpfDigits) {
        const byCpf = await this.prisma.aluno.findUnique({ where: { cpf: cpfDigits }, select: { id: true } }).catch(() => null);
        if (byCpf) targetAlunoId = byCpf.id;
      }
      if (targetAlunoId) {
        const parseCidadeUf = (val?: string) => {
          if (!val) return { cidade: undefined as any, uf: undefined as any };
          const parts = String(val).split('|');
          const cidade = (parts[0] || '').trim() || undefined;
          const uf = (parts[1] || '').trim().toUpperCase() || undefined;
          return { cidade, uf } as { cidade?: string; uf?: any };
        };
        const dataAluno: Record<string, any> = {};
        if (body.sNome !== undefined) dataAluno.nome = body.sNome;
        if (body.dDataNascimento !== undefined) dataAluno.dataNascimento = new Date(body.dDataNascimento);
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
        if (body.sCelular !== undefined) dataAluno.celular = body.sCelular;
        if (body.sCPF !== undefined) dataAluno.cpf = String(body.sCPF).replace(/\D+/g, '');
        if (body.sCidadeNatal !== undefined) {
          const { cidade: cnCidade } = parseCidadeUf(body.sCidadeNatal);
          if (cnCidade !== undefined) dataAluno.cidadeNatal = cnCidade;
        }
        if (body.sSexo !== undefined) {
          const sx = String(body.sSexo).trim().toUpperCase();
          if (sx === 'M') dataAluno.genero = 'MASCULINO';
          else if (sx === 'F') dataAluno.genero = 'FEMININO';
        }
        if (Object.keys(dataAluno).length > 0) {
          const updated = await this.prisma.aluno.update({ where: { id: targetAlunoId }, data: dataAluno, select: { id: true } });
          const snapshot: Record<string, any> = {};
          if (dataAluno.nome !== undefined) snapshot.alunoNome = dataAluno.nome;
          if (dataAluno.cpf !== undefined) snapshot.alunoCpf = dataAluno.cpf;
          if (dataAluno.genero !== undefined) snapshot.alunoGenero = dataAluno.genero;
          if (dataAluno.dataNascimento !== undefined) snapshot.alunoDataNascimento = dataAluno.dataNascimento;
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
}