import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MatriculasService } from './matriculas.service';
import { MatriculaResponseDto } from './dto/matricula-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('matriculas')
@Controller('matriculas')
export class MatriculasController {
  constructor(private readonly service: MatriculasService) {}

  @Get('responsavel/:responsavelId')
  @ApiOperation({ summary: 'Lista matrículas do responsável', description: 'Retorna contador total e array de matrículas' })
  @ApiOkResponse({ schema: { example: { total: 2, items: [ { id: 'uuid', codigo: 'MAT-001', status: 'PENDENTE', aluno: { id: 'uuidA', nome: 'Aluno X', genero: 'MASCULINO', dataNascimento: '2015-02-10' }, responsavel: { id: 'uuidR', nome: 'Resp Y', email: 'r@y.com', financeiro: false }, criadoEm: '2025-10-08T12:00:00.000Z', atualizadoEm: '2025-10-08T12:00:00.000Z' } ] } } })
  listByResponsavel(@Param('responsavelId') responsavelId: string) {
    return this.service.listByResponsavel(responsavelId);
  }

  @Get('usuario/:usuarioId')
  @ApiOperation({ summary: 'Lista geral de matrículas do usuário', description: 'Baseado no e-mail do usuário, agrega todas as matrículas dos responsáveis associados.' })
  @ApiOkResponse({ schema: { example: { total: 1, items: [{ id: 'uuidM', codigo: 'MAT-2025-001', status: 'PENDENTE', criadoEm: '2025-10-08T12:00:00.000Z', atualizadoEm: '2025-10-08T12:10:00.000Z', aluno: { id: 'uuidA', nome: 'Aluno X', genero: 'MASCULINO', dataNascimento: '2015-02-10', cidadeNatal: 'Cidade', cpf: '000.000.000-00', moraComResponsavel: true, endereco: { id: 'end1', cep: '00000-000', rua: 'Rua Teste', numero: '123', complemento: null, bairro: 'Centro', cidade: 'Cidade', uf: 'SP' } }, responsavel: { id: 'uuidR', nome: 'Resp Y', genero: 'MASCULINO', dataNascimento: '1980-01-01', estadoCivil: 'CASADO', rg: '11.111.111-1', cpf: '111.111.111-11', celular: '(11) 98888-7777', email: 'resp@teste.com', financeiro: false, etapaAtual: 3, endereco: { id: 'end2', cep: '00000-000', rua: 'Rua Resp', numero: '45', complemento: 'Ap 10', bairro: 'Bairro', cidade: 'Cidade', uf: 'SP' } } }] } } })
  listByUsuario(@Param('usuarioId') usuarioId: string) {
    return this.service.listByUsuario(usuarioId);
  }

  @Get('recente')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtém a matrícula mais recente do usuário logado', description: 'Baseado no usuário autenticado (cookie de login), retorna a matrícula mais recentemente atualizada vinculada ao e-mail dele.' })
  @ApiOkResponse({ description: 'Dados detalhados da matrícula mais recente' })
  getMinhaMatriculaRecente(@Req() req: any) {
    const userId = req.user?.id as string;
    return this.service.findMostRecentForUsuarioDetailed(userId);
  }

  @Get('atual-id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtém apenas o id da matrícula atual', description: 'Retorna o id da matrícula mais recentemente atualizada para o usuário autenticado.' })
  @ApiOkResponse({ schema: { example: { matriculaId: 'uuid-matricula' } } })
  async getAtualId(@Req() req: any) {
    const userId = req.user?.id as string;
    const dto = await this.service.findMostRecentForUsuario(userId);
    return { matriculaId: dto.id };
  }

  @Get('aluno-id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtém alunoId pelo token', description: 'Retorna o alunoId da matrícula mais recente vinculada ao usuário autenticado (Authorization/Cookie).' })
  @ApiOkResponse({ description: 'alunoId retornado', schema: { example: { alunoId: 'uuid' } } })
  async getAlunoId(@Req() req: any) {
    const userId = req.user?.id as string;
    return this.service.getAlunoIdForUsuario(userId);
  }

  @Get(':id')
  @ApiOkResponse({ type: MatriculaResponseDto })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
