import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString, Length, Matches, Validate, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";
import { IsDateStringOrDate } from "./validators/is-date-string-or-date";
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

  @ApiProperty({ example: "01/02/2015", description: "Aceita dd/MM/yyyy, dd-MM-yyyy, MM/dd/yyyy, MM-dd-yyyy ou yyyy-MM-dd (string)" })
  @Validate(IsDateStringOrDate)
  dataNascimento: string;

  @ApiProperty({ example: "Cidade Teste" })
  @IsString()
  @IsNotEmpty()
  cidadeNatal: string;

  @ApiProperty({ example: "Brasileira", required: false, description: "Opcional" })
  @IsString()
  @IsOptional()
  nacionalidade?: string;

  @ApiProperty({ example: "123.456.789-00" })
  @IsString()
  @IsNotEmpty()
  @Length(11, 14)
  @Matches(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, { message: "CPF deve estar no formato 000.000.000-00 ou 00000000000" })
  @Validate(IsCPFAluno)
  cpf: string;

  @ApiProperty({ enum: EstadoCivil, required: false })
  @IsEnum(EstadoCivil)
  @IsOptional()
  estadoCivil?: EstadoCivil;
}
