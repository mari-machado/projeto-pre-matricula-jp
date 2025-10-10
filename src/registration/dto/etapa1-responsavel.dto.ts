import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, Length } from "class-validator";
import { Genero, EstadoCivil } from "../../prisma/schema-enums";

export class Etapa1ResponsavelDto {
  @ApiProperty({ example: "Responsavel Teste" })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ enum: Genero })
  @IsEnum(Genero)
  genero: Genero;

  @ApiProperty({ example: "1980-05-10" })
  @IsDateString()
  dataNascimento: string;

  @ApiProperty({ example: "DETRAN" })
  @IsString()
  @IsNotEmpty()
  orgaoExpeditor: string;

  @ApiProperty({ example: "2010-01-15" })
  @IsDateString()
  dataExpedicao: string;

  @ApiProperty({ enum: EstadoCivil })
  @IsEnum(EstadoCivil)
  estadoCivil: EstadoCivil;


  @ApiProperty({ example: "123456789" })
  @IsString()
  @IsNotEmpty()
  rg: string;

  @ApiProperty({ example: "123.456.789-00" })
  @IsString()
  @Length(11, 14)
  cpf: string;
}
