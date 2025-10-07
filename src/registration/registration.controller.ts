import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBadRequestResponse, ApiCreatedResponse, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { RegistrationService } from "./registration.service";
import { Etapa1ResponsavelDto } from "./dto/etapa1-responsavel.dto";
import { Etapa2EnderecoDto } from "./dto/etapa2-endereco.dto";
import { Etapa3AlunoDto } from "./dto/etapa3-aluno.dto";
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
  @ApiOperation({ summary: 'Cadastro Etapa 3 - Aluno', description: 'Registra os dados iniciais do aluno e conclui o cadastro.' })
  @ApiResponse({ status: 201, description: 'Aluno cadastrado.', schema: { example: { alunoId: 'uuid', etapaAtual: 3 } } })
  async etapa3(@Param('responsavelId') responsavelId: string, @Body() dto: Etapa3AlunoDto) {
    return this.registrationService.createStep3(responsavelId, dto);
  }

  @Get('status/:responsavelId')
  @ApiOperation({ summary: 'Status do Cadastro', description: 'Retorna a etapa atual e se está completo.' })
  @ApiResponse({ status: 200, type: CadastroStatusDto })
  async status(@Param('responsavelId') responsavelId: string): Promise<CadastroStatusDto> {
    return this.registrationService.getStatus(responsavelId);
  }
}
