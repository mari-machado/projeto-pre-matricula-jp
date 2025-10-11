import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsDateString, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Length, Matches, Validate, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";
import { Genero, EstadoCivil } from "../../prisma/schema-enums";
import { cpf as cpfValidator } from "cpf-cnpj-validator";

@ValidatorConstraint({ name: "IsCPFAluno", async: false })
class IsCPFAluno implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (!value) return false;
    try {
      return cpfValidator.isValid(value);
    } catch {
      return false;
    }
  }
  defaultMessage(): string {
    return "CPF inválido";
  }
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

  @ApiProperty({ example: "123.456.789-00" })
  @IsString()
  @IsNotEmpty()
  @Length(11, 14)
  @Matches(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, { message: "CPF deve estar no formato 000.000.000-00 ou 00000000000" })
  @Validate(IsCPFAluno)
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
