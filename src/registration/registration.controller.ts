import { Body, Controller, Get, Param, Post, Res, Req } from "@nestjs/common";
import type { Response } from "express";
import { ApiBadRequestResponse, ApiCreatedResponse, ApiOperation, ApiResponse, ApiTags, ApiOkResponse } from "@nestjs/swagger";
import { RegistrationService } from "./registration.service";
import { Etapa1ResponsavelDto } from "./dto/etapa1-responsavel.dto";
import { Etapa2EnderecoDto } from "./dto/etapa2-endereco.dto";
import { Etapa3AlunoDto } from "./dto/etapa3-aluno.dto";
import { Etapa3bEnderecoAlunoDto } from "./dto/etapa3b-endereco-aluno.dto";
import { CadastroStatusDto } from "./dto/status.dto";
import { ResponsavelResponseDto } from "./dto/responsavel-response.dto";
import { JwtService } from "@nestjs/jwt";

@ApiTags('cadastro')
@Controller('cadastro')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService, private readonly jwt: JwtService) {}

  private extractToken(req: any): string | null {
    let token: string | null = null;
    const auth = req?.headers?.authorization as string | undefined;
    if (auth && auth.startsWith('Bearer ')) token = auth.substring(7);
    if (!token && req?.cookies) token = req.cookies['access_token'] || null;
    return token;
  }

  @Post('iniciar')
  @ApiOperation({ summary: 'Inicia pré-matrícula', description: 'Cria responsável e matrícula (etapa 1).' })
  @ApiCreatedResponse({ description: 'Matrícula iniciada.', schema: { example: { matriculaId: 'uuid', responsavelId: 'uuid', etapaAtual: 1 } } })
  async iniciar(@Body() dto: Etapa1ResponsavelDto, @Res({ passthrough: true }) res: Response, @Req() req: any) {
    let usuarioEmail: string | undefined = undefined;
    let usuarioId: string | undefined = undefined;
    const token = this.extractToken(req);
    if (token) {
      try {
        const payload: any = this.jwt.verify(token, { secret: process.env.JWT_SECRET || 'secret-key-change-in-production' });
        usuarioEmail = payload?.email;
        usuarioId = payload?.sub;
      } catch {}
    }
    const result = await this.registrationService.iniciarMatricula(dto, usuarioEmail, usuarioId);
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('matricula_id', result.matriculaId, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'none',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, 
    } as any);
    return result;
  }

  @Post('etapa-2/:matriculaId')
  @ApiOperation({ summary: 'Etapa 2 - Endereço Responsável', description: 'Atualiza endereço e contatos do responsável para a matrícula.' })
  @ApiResponse({ status: 200, description: 'Endereço registrado.', schema: { example: { matriculaId: 'uuid', etapaAtual: 2 } } })
  async etapa2(@Param('matriculaId') matriculaId: string, @Body() dto: Etapa2EnderecoDto) {
    return this.registrationService.updateStep2Matricula(matriculaId, dto);
  }

  @Post('etapa-3/:matriculaId')
  @ApiOperation({ summary: 'Etapa 3 - Aluno', description: 'Registra aluno para a matrícula.' })
  @ApiResponse({ status: 201, description: 'Aluno cadastrado.', schema: { example: { matriculaId: 'uuid', alunoId: 'uuid', etapaAtual: 3, necessitaEtapa3b: false } } })
  async etapa3(@Param('matriculaId') matriculaId: string, @Body() dto: Etapa3AlunoDto) {
    return this.registrationService.createAlunoMatricula(matriculaId, dto);
  }

  @Post('etapa-3b/:matriculaId/:alunoId')
  @ApiOperation({ summary: 'Etapa 3B - Endereço próprio do aluno', description: 'Completa endereço do aluno quando não mora com responsável.' })
  async etapa3b(@Param('matriculaId') matriculaId: string, @Param('alunoId') alunoId: string, @Body() dto: Etapa3bEnderecoAlunoDto) {
    return this.registrationService.createEnderecoAlunoMatricula(matriculaId, alunoId, dto);
  }

  @Get('status/:matriculaId')
  @ApiOperation({ summary: 'Status da Matrícula', description: 'Retorna progresso e pendências da matrícula.' })
  async status(@Param('matriculaId') matriculaId: string): Promise<CadastroStatusDto> {
    return this.registrationService.getStatusMatricula(matriculaId);
  }

  @Get('responsaveis/:matriculaId')
  @ApiOperation({ 
    summary: 'Lista responsáveis da matrícula', 
    description: 'Retorna todos os responsáveis associados à matrícula especificada.' 
  })
  @ApiOkResponse({ 
    description: 'Lista de responsáveis retornada com sucesso', 
    type: [ResponsavelResponseDto] 
  })
  @ApiBadRequestResponse({ description: 'Matrícula não encontrada' })
  async getResponsaveis(@Param('matriculaId') matriculaId: string): Promise<ResponsavelResponseDto[]> {
    return this.registrationService.getResponsaveisMatricula(matriculaId);
  }

  @Post('integrar-sponte/:matriculaId')
  @ApiOperation({ summary: 'Integra manual com Sponte', description: 'Envia dados do aluno/responsável da matrícula.' })
  async integrarSponte(@Param('matriculaId') matriculaId: string) {
    return this.registrationService.integrateSponteMatricula(matriculaId);
  }
}
