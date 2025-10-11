import { Body, Controller, Get, Param, Post, Res, Req, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ApiBadRequestResponse, ApiCreatedResponse, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { RegistrationService } from "./registration.service";
import { Etapa1ResponsavelDto } from "./dto/etapa1-responsavel.dto";
import { Etapa2EnderecoDto } from "./dto/etapa2-endereco.dto";
import { Etapa3AlunoDto } from "./dto/etapa3-aluno.dto";
import { Etapa3bEnderecoAlunoDto } from "./dto/etapa3b-endereco-aluno.dto";
import { CadastroStatusDto } from "./dto/status.dto";

@ApiTags('cadastro')
@Controller('cadastro')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Post('iniciar')
  @ApiOperation({ summary: 'Inicia pré-matrícula', description: 'Cria responsável e matrícula (etapa 1).' })
  @ApiCreatedResponse({ description: 'Matrícula iniciada.', schema: { example: { matriculaId: 'uuid', responsavelId: 'uuid', etapaAtual: 1 } } })
  @UseGuards(JwtAuthGuard)
  async iniciar(@Body() dto: Etapa1ResponsavelDto, @Res({ passthrough: true }) res: Response, @Req() req: any) {
    const usuarioEmail: string | undefined = req?.user?.email;
    const result = await this.registrationService.iniciarMatricula(dto, usuarioEmail);
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

  @Post('integrar-sponte/:matriculaId')
  @ApiOperation({ summary: 'Integra manual com Sponte', description: 'Envia dados do aluno/responsável da matrícula.' })
  async integrarSponte(@Param('matriculaId') matriculaId: string) {
    return this.registrationService.integrateSponteMatricula(matriculaId);
  }
}
