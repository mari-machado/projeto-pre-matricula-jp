import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateResponsaveis2Dto {
  @ApiProperty({ description: 'ID do responsável no Sponte', type: Number })
  @IsInt()
  nResponsavelID!: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  sNome?: string;

  @ApiPropertyOptional({ description: 'YYYY-MM-DD', type: String })
  @IsOptional()
  @IsString()
  dDataNascimento?: string;

  @ApiPropertyOptional({ description: 'Parentesco (-1 Pai, -2 Mãe, -3 Responsável)', type: Number })
  @IsOptional()
  nParentesco?: number;

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
  sRG?: string;

  @ApiPropertyOptional({ description: 'CPF ou CNPJ conforme TipoPessoa', type: String })
  @IsOptional()
  @IsString()
  sCPFCNPJ?: string;

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
  sEmail?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  sTelefone?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  sCelular?: string;

  @ApiPropertyOptional({ description: 'AlunoID do Sponte a vincular (opcional)', type: Number })
  @IsOptional()
  nAlunoID?: number;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  lResponsavelFinanceiro?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  lResponsavelDidatico?: boolean;

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

  @ApiPropertyOptional({ description: '1 – Física ou 2 - Jurídica', type: Number })
  @IsOptional()
  nTipoPessoa?: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  sComplementoEndereco?: string;
}
