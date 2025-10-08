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

  @Post('etapa-1')
  @ApiOperation({ summary: 'Cadastro Etapa 1 - Responsável', description: 'Cria o registro inicial do responsável (dados pessoais).' })
  @ApiCreatedResponse({ description: 'Responsável criado (etapa 1 iniciada).', schema: { example: { id: 'uuid', etapaAtual: 1 } } })
  async etapa1(@Body() dto: Etapa1ResponsavelDto) {
    return this.registrationService.createStep1(dto);
  }

  @Post('etapa-2/:responsavelId')
  @ApiOperation({ summary: 'Cadastro Etapa 2 - Endereço/Comunicação', description: 'Atualiza endereço e contatos do responsável.' })
  @ApiResponse({ status: 200, description: 'Endereço e contato registrados.', schema: { example: { id: 'uuid', etapaAtual: 2 } } })
  @ApiBadRequestResponse({ description: 'Sequência inválida ou etapa já concluída.' })
  async etapa2(@Param('responsavelId') responsavelId: string, @Body() dto: Etapa2EnderecoDto) {
    return this.registrationService.updateStep2(responsavelId, dto);
  }

  @Post('etapa-3/:responsavelId')
  @ApiOperation({ summary: 'Cadastro Etapa 3 - Aluno', description: 'Registra os dados iniciais do aluno. Se moraComResponsavel=false, requer etapa 3B.' })
  @ApiResponse({ status: 201, description: 'Aluno cadastrado (parcial ou completo).', schema: { example: { alunoId: 'uuid', etapaAtual: 2, necessitaEtapa3b: true } } })
  async etapa3(@Param('responsavelId') responsavelId: string, @Body() dto: Etapa3AlunoDto) {
    return this.registrationService.createStep3(responsavelId, dto);
  }

  @Post('etapa-3b/:alunoId')
  @ApiOperation({ summary: 'Cadastro Etapa 3B - Endereço próprio do aluno', description: 'Completa cadastro quando o aluno não mora com o responsável.' })
  @ApiResponse({ status: 201, description: 'Endereço do aluno salvo.', schema: { example: { alunoId: 'uuid', etapaAtual: 3, completo: true } } })
  async etapa3b(@Param('alunoId') alunoId: string, @Body() dto: Etapa3bEnderecoAlunoDto) {
    return this.registrationService.createStep3b(alunoId, dto);
  }

  @Get('status/:responsavelId')
  @ApiOperation({ summary: 'Status do Cadastro', description: 'Retorna a etapa atual, pendências e se está completo.' })
  @ApiResponse({ status: 200, schema: { example: { responsavelId: 'uuid', etapaAtual: 2, pendenteEnderecoAluno: true, completo: false } } })
  async status(@Param('responsavelId') responsavelId: string): Promise<CadastroStatusDto> {
    return this.registrationService.getStatus(responsavelId);
  }

  @Post('integrar-sponte/:alunoId')
  @ApiOperation({ summary: 'Integração manual com Sponte', description: 'Envia dados do aluno e responsável para o Sponte sob demanda.' })
  @ApiResponse({ status: 201, description: 'Integração realizada (ou tentativa registrada).', schema: { example: { alunoId: 'uuid', sponteAlunoId: 12345 } } })
  async integrarSponte(@Param('alunoId') alunoId: string) {
    return this.registrationService.integrateSponte(alunoId);
  }
}
