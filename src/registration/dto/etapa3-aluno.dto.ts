import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, Length } from "class-validator";

export enum Genero {
  MASCULINO = "MASCULINO",
  FEMININO = "FEMININO"
}

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

  @ApiProperty({ example: "123.456.789-00", required: false })
  @IsString()
  @IsOptional()
  @Length(11, 14)
  cpf?: string | null;

  @ApiProperty({ example: true })
  @IsBoolean()
  moraComResponsavel: boolean;
}
