import { ApiProperty } from '@nestjs/swagger';

class AlunoResumoDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  nome: string;
  @ApiProperty()
  genero: string;
  @ApiProperty()
  dataNascimento: string;
}

class ResponsavelResumoDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  nome: string;
  @ApiProperty()
  email: string;
  @ApiProperty()
  financeiro: boolean;
}

export class MatriculaResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  codigo: string;

  @ApiProperty({ enum: ['PENDENTE', 'INTEGRADA', 'CANCELADA'] })
  status: string;

  @ApiProperty({ type: AlunoResumoDto })
  aluno: AlunoResumoDto;

  @ApiProperty({ type: ResponsavelResumoDto })
  responsavel: ResponsavelResumoDto;

  @ApiProperty()
  criadoEm: string;

  @ApiProperty()
  atualizadoEm: string;
}
