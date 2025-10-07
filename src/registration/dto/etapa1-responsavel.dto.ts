import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, Length } from "class-validator";
import { Genero, EstadoCivil } from "../../prisma/schema-enums";

export class Etapa1ResponsavelDto {
  @ApiProperty({ example: "João da Silva" })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ enum: Genero })
  @IsEnum(Genero)
  genero: Genero;

  @ApiProperty({ example: "1980-05-10" })
  @IsDateString()
  dataNascimento: string;

  @ApiProperty({ example: "Engenheiro" })
  @IsString()
  @IsNotEmpty()
  profissao: string;

  @ApiProperty({ example: "São Paulo" })
  @IsString()
  @IsNotEmpty()
  naturalidade: string;

  @ApiProperty({ enum: EstadoCivil })
  @IsEnum(EstadoCivil)
  estadoCivil: EstadoCivil;

  @ApiProperty({ example: "Brasileira", required: false })
  @IsString()
  @IsOptional()
  nacionalidade?: string;

  @ApiProperty({ example: "123456789" })
  @IsString()
  @IsNotEmpty()
  rg: string;

  @ApiProperty({ example: "123.456.789-00" })
  @IsString()
  @Length(11, 14)
  cpf: string;
}
