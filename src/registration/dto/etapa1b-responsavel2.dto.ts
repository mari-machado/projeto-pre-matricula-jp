import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, Length, Matches, Validate, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";
import { Genero, EstadoCivil } from "../../prisma/schema-enums";
import { cpf as cpfValidator } from "cpf-cnpj-validator";

@ValidatorConstraint({ name: "IsCPF", async: false })
class IsCPF2 implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (!value) return false;
    try { return cpfValidator.isValid(value); } catch { return false; }
  }
  defaultMessage(): string { return "CPF inválido"; }
}

export class Etapa1bResponsavel2Dto {
  @ApiProperty({ example: "Responsavel 2" })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ enum: Genero })
  @IsEnum(Genero)
  genero: Genero;

  @ApiProperty({ example: "01/01/1985", description: "Formato dd/MM/yyyy" })
  @IsString()
  @Matches(/^\d{2}\/\d{2}\/\d{4}$/)
  dataNascimento: string;

  @ApiProperty({ example: "SSP" })
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  orgaoExpeditor: string;

  @ApiProperty({ example: "10/03/2012", description: "Formato dd/MM/yyyy" })
  @IsString()
  @Matches(/^\d{2}\/\d{2}\/\d{4}$/)
  dataExpedicao: string;

  @ApiProperty({ enum: EstadoCivil })
  @IsEnum(EstadoCivil)
  estadoCivil: EstadoCivil;

  @ApiProperty({ example: "987654321" })
  @IsString()
  @IsNotEmpty()
  @Length(5, 20)
  @Matches(/^[0-9A-Za-z.\-]+$/)
  rg: string;

  @ApiProperty({ example: "123.456.789-00" })
  @IsString()
  @Length(11, 14)
  @Matches(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/)
  @Validate(IsCPF2)
  cpf: string;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  pessoaJuridica?: boolean;

  @ApiProperty({ example: "PAI", required: false, description: "Parentesco com o aluno." })
  @IsString()
  @IsOptional()
  @Length(2, 50)
  parentesco?: string;
}
