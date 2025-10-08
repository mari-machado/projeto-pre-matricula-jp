import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, Length } from "class-validator";
import { UF } from "../../prisma/schema-enums";
import { IsEnum } from "class-validator";

export class Etapa3bEnderecoAlunoDto {
  @ApiProperty({ example: "01234-567" })
  @IsString()
  @IsNotEmpty()
  @Length(8, 9)
  cep: string;

  @ApiProperty({ example: "Rua das Flores" })
  @IsString()
  @IsNotEmpty()
  rua: string;

  @ApiProperty({ example: "123" })
  @IsString()
  @IsNotEmpty()
  numero: string;

  @ApiProperty({ example: "Apto 12", required: false })
  @IsString()
  @IsOptional()
  complemento?: string;

  @ApiProperty({ example: "Centro" })
  @IsString()
  @IsNotEmpty()
  bairro: string;

  @ApiProperty({ example: "Campinas" })
  @IsString()
  @IsNotEmpty()
  cidade: string;

  @ApiProperty({ enum: UF })
  @IsEnum(UF)
  uf: UF;
}
