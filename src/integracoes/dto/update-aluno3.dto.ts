import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateAluno3Dto {
  @ApiProperty({ description: 'Código do aluno no Sponte', type: Number })
  @IsInt()
  nAlunoID!: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  sNome?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  sMidia?: string;

  @ApiPropertyOptional({ description: 'YYYY-MM-DD', type: String })
  @IsOptional()
  @IsString()
  dDataNascimento?: string;

  @ApiPropertyOptional({ description: 'Cidade ou Cidade|UF', type: String })
  @IsOptional()
  @IsString()
  sCidade?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  sBairro?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  sCEP?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  sEndereco?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  nNumeroEndereco?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  sComplementoEndereco?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  sCPF?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  sRG?: string;

  @ApiPropertyOptional({ description: 'ID do responsável financeiro', type: String })
  @IsOptional()
  @IsString()
  nResponsavelFinanceiroID?: string;

  @ApiPropertyOptional({ description: 'ID do responsável didático', type: String })
  @IsOptional()
  @IsString()
  nResponsavelDidaticoID?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  sEmail?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  sTelefone?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  sCelular?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  sObservacao?: string;

  @ApiPropertyOptional({ description: 'F, M, T, GN, NB', type: String })
  @IsOptional()
  @IsString()
  sSexo?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  sProfissao?: string;

  @ApiPropertyOptional({ description: 'Cidade ou Cidade|UF', type: String })
  @IsOptional()
  @IsString()
  sCidadeNatal?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  sRa?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  sNumeroMatricula?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  sSituacao?: string;

  @ApiPropertyOptional({ description: 'Ex.: 1;2;3', type: String })
  @IsOptional()
  @IsString()
  sCursoInteresse?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  sInfoBloqueada?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  sOrigemNome?: string;
}
