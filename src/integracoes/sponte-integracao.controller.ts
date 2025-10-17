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