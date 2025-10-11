import { ApiProperty } from "@nestjs/swagger";

export class CadastroStatusDto {
  @ApiProperty({ example: "uuid-responsavel" })
  responsavelId: string;

  @ApiProperty({ example: 2, description: "Etapa atual (1,2,3)" })
  etapaAtual: number;

  @ApiProperty({ description: "Indica se cadastro completo", example: false })
  completo: boolean;

  @ApiProperty({ description: "Se há segundo responsável a cadastrar", example: false })
  temSegundoResponsavel?: boolean;

  @ApiProperty({ description: "Pendente dados do segundo responsável (1b)", example: false })
  pendenteResp2Dados?: boolean;

  @ApiProperty({ description: "Pendente endereço do segundo responsável (2b)", example: false })
  pendenteResp2Endereco?: boolean;
}
