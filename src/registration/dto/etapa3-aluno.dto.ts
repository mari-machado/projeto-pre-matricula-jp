import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsDateString, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Length } from "class-validator";
import { Genero, EstadoCivil } from "../../prisma/schema-enums";

export class Etapa3AlunoDto {
  @ApiProperty({ example: "Aluno Matrícula Teste" })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ enum: Genero })
  @IsEnum(Genero)
  genero: Genero;

  @ApiProperty({ example: "2015-02-01" })
  @IsDateString()
  dataNascimento: string;

  @ApiProperty({ example: "Cidade Teste" })
  @IsString()
  @IsNotEmpty()
  cidadeNatal: string;

  @ApiProperty({ example: "123.456.789-00" })
  @IsString()
  @IsNotEmpty()
  @Length(11, 14)
  cpf: string;

  @ApiProperty({ enum: EstadoCivil })
  @IsEnum(EstadoCivil)
  estadoCivil: EstadoCivil;

  @ApiProperty({ example: "(11) 1234-5678", required: false })
  @IsString()
  @IsOptional()
  telefone?: string;

  @ApiProperty({ example: "(11) 91234-5678" })
  @IsString()
  @IsNotEmpty()
  celular: string;

  @ApiProperty({ example: "(11) 91234-5678" })
  @IsString()
  @IsNotEmpty()
  whatsapp: string;

  @ApiProperty({ example: "aluno@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  moraComResponsavel: boolean;
}
