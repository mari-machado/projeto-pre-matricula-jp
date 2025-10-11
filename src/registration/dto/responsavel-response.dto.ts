import { ApiProperty } from "@nestjs/swagger";

export class EnderecoResponseDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  id: string;

  @ApiProperty({ example: "01234-567" })
  cep: string;

  @ApiProperty({ example: "Rua das Flores" })
  rua: string;

  @ApiProperty({ example: "123" })
  numero: string;

  @ApiProperty({ example: "Apto 45", required: false })
  complemento?: string | null;

  @ApiProperty({ example: "São Paulo" })
  cidade: string;

  @ApiProperty({ example: "SP", required: false })
  uf?: string | null;

  @ApiProperty({ example: "Centro" })
  bairro: string;
}

export class ResponsavelResponseDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440001" })
  id: string;

  @ApiProperty({ example: "João Silva" })
  nome: string;

  @ApiProperty({ example: "MASCULINO" })
  genero: string;

  @ApiProperty({ example: "15/01/1980" })
  dataNascimento: string;

  @ApiProperty({ example: "CASADO" })
  estadoCivil: string;

  @ApiProperty({ example: "12.345.678-9" })
  rg: string;

  @ApiProperty({ example: "SSP-SP" })
  orgaoExpeditor: string;

  @ApiProperty({ example: "15/01/2000" })
  dataExpedicao: string;

  @ApiProperty({ example: "123.456.789-01" })
  cpf: string;

  @ApiProperty({ example: false })
  pessoaJuridica: boolean;

  @ApiProperty({ example: "(11) 99999-9999" })
  celular: string;

  @ApiProperty({ example: "joao@email.com" })
  email: string;

  @ApiProperty({ example: true })
  financeiro: boolean;

  @ApiProperty({ example: 3 })
  etapaAtual: number;

  @ApiProperty({ type: EnderecoResponseDto })
  endereco: EnderecoResponseDto;

  @ApiProperty({ example: "11/10/2025 10:00:00" })
  criadoEm: string;

  @ApiProperty({ example: "11/10/2025 15:30:00" })
  atualizadoEm: string;

  @ApiProperty({ example: true })
  ativo: boolean;
}