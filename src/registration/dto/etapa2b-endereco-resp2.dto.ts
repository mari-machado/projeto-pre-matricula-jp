import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, Length, ValidateIf } from "class-validator";
import { UF } from "../../prisma/schema-enums";

export class Etapa2bEnderecoResp2Dto {
  @ApiProperty({ example: "01001-000" })
  @IsString()
  @ValidateIf((o: Etapa2bEnderecoResp2Dto) => !o.moraComResponsavelPrincipal)
  @Length(8, 9)
  cep: string;

  @ApiProperty({ example: "Av. Paulista" })
  @IsString()
  @ValidateIf((o: Etapa2bEnderecoResp2Dto) => !o.moraComResponsavelPrincipal)
  @Length(2, 255)
  rua: string;

  @ApiProperty({ example: "1000" })
  @IsString()
  @ValidateIf((o: Etapa2bEnderecoResp2Dto) => !o.moraComResponsavelPrincipal)
  @Length(1, 10)
  numero: string;

  @ApiProperty({ example: "Apto 12", required: false })
  @IsString()
  @IsOptional()
  @Length(0, 100)
  complemento?: string;

  @ApiProperty({ example: "São Paulo" })
  @IsString()
  @ValidateIf((o: Etapa2bEnderecoResp2Dto) => !o.moraComResponsavelPrincipal)
  @Length(2, 100)
  cidade: string;

  @ApiProperty({ enum: UF, example: "SP",  required: false })
  @IsOptional()
  @ValidateIf((o: Etapa2bEnderecoResp2Dto) => !o.moraComResponsavelPrincipal)
  uf: UF;

  @ApiProperty({ example: "Bela Vista" })
  @IsString()
  @ValidateIf((o: Etapa2bEnderecoResp2Dto) => !o.moraComResponsavelPrincipal)
  @Length(2, 100)
  bairro: string;

  @ApiProperty({ example: "+55 11 91234-5678" })
  @IsString()
  @Length(8, 20)
  celular: string;

  @ApiProperty({ example: "email@exemplo.com" })
  @IsEmail()
  @Length(1, 255)
  email: string;
  
  @ApiProperty({ required: false, description: "Se o segundo responsável mora com o primeiro responsável." })
  @IsOptional()
  moraComResponsavelPrincipal?: boolean;
}
