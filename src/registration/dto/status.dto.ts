import { ApiProperty } from "@nestjs/swagger";

export class CadastroStatusDto {
  @ApiProperty({ example: "uuid-responsavel" })
  responsavelId: string;

  @ApiProperty({ example: 2, description: "Etapa atual (1,2,3)" })
  etapaAtual: number;

  @ApiProperty({ description: "Indica se cadastro completo", example: false })
  completo: boolean;
}
