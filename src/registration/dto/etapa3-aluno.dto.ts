import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsNotEmpty, IsString, Length, Matches, Validate, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";
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

  @ApiProperty({ example: "01/02/2015", description: "Formato dd/MM/yyyy" })
  @IsString()
  @Matches(/^\d{2}\/\d{2}\/\d{4}$/)
  dataNascimento: string;

  @ApiProperty({ example: "Cidade Teste" })
  @IsString()
  @IsNotEmpty()
  cidadeNatal: string;

  @ApiProperty({ example: "Brasileira" })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  nacionalidade: string;

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

  @ApiProperty({ example: true })
  @IsBoolean()
  moraComResponsavel: boolean;
}
