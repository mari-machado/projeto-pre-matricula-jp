import { Body, Controller, Get, Header, Param, Post, Query } from '@nestjs/common';
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
  // sToken vem do .env (SPONTE_TOKEN)
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

  @Post('alunos/update')
  @ApiOperation({ summary: 'UpdateAlunos3 (Sponte)', description: 'Atualiza dados do aluno e pode vincular responsáveis' })
  @ApiBody({ type: UpdateAluno3Dto })
  @ApiResponse({ status: 200, description: 'XML retornado pelo Sponte (como string).', content: { 'application/xml': {} } })
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
    return xml;
  }

  @Get('matriculas/sponte-id')
  @ApiOperation({ summary: 'Obter SponteAlunoID por matrícula', description: 'Retorna apenas o sponteAlunoId associado à matrícula' })
  @ApiParam({ name: 'id', description: 'ID da matrícula', type: String })
  @ApiResponse({ status: 200, description: 'Objeto com sponteAlunoId', content: { 'application/json': {} } })
  async getSponteIdByMatricula(@Param('id') id: string) {
    const m = await this.prisma.matricula.findUnique({ where: { id }, select: { sponteAlunoId: true } });
    if (!m) return { sponteAlunoId: null };
    return { sponteAlunoId: m.sponteAlunoId ?? null };
  }
}
