import { Body, Controller, Get, Param, Post } from "@nestjs/common";
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
  async iniciar(@Body() dto: Etapa1ResponsavelDto) {
    return this.registrationService.iniciarMatricula(dto);
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
