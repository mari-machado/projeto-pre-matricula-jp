import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";
import { Genero, EstadoCivil } from "../../prisma/schema-enums";
import { cpf as cpfValidator } from "cpf-cnpj-validator";

function parseDateInput(value: unknown): Date {
  if (!value) return new Date(NaN);
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const br = value.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
    if (br) {
      const [_, dd, mm, yyyy] = br;
      return new Date(parseInt(yyyy, 10), parseInt(mm, 10) - 1, parseInt(dd, 10));
    }
    return new Date(value);
  }
  const anyVal: any = value as any;
  if (anyVal && typeof anyVal.toISOString === 'function') {
    try { return new Date(anyVal.toISOString()); } catch {}
  }
  try {
    return new Date(anyVal);
  } catch {
    return new Date(NaN);
  }
}

@ValidatorConstraint({ name: "IsCPF", async: false })
class IsCPF implements ValidatorConstraintInterface {
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

@ValidatorConstraint({ name: "IsNotFutureDate", async: false })
class IsNotFutureDate implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    const d = parseDateInput(value);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    return d.getTime() <= now.getTime();
  }
  defaultMessage(): string {
    return "Data não pode ser no futuro";
  }
}

@ValidatorConstraint({ name: "IsAfterNascimento", async: false })
class IsAfterNascimento implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments): boolean {
    const obj: any = args.object || {};
    const dn = parseDateInput(obj.dataNascimento);
    const de = parseDateInput(value);
    if (isNaN(dn.getTime()) || isNaN(de.getTime())) return false;
    return de.getTime() >= dn.getTime();
  }
  defaultMessage(): string {
    return "Data de expedição deve ser posterior à data de nascimento";
  }
}

export class Etapa1ResponsavelDto {
  @ApiProperty({ example: "Responsavel Teste" })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ enum: Genero })
  @IsEnum(Genero)
  genero: Genero;

  @ApiProperty({ example: "10/05/1980", description: "Formato dd/MM/yyyy ou dd-MM-yyyy" })
  @IsString()
  @Matches(/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/)
  dataNascimento: string;

  @ApiProperty({ example: "DETRAN" })
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  orgaoExpeditor: string;

  @ApiProperty({ example: "15/01/2010", description: "Formato dd/MM/yyyy ou dd-MM-yyyy" })
  @IsString()
  @Matches(/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/)
  @Validate(IsNotFutureDate)
  @Validate(IsAfterNascimento)
  dataExpedicao: string;

  @ApiProperty({ enum: EstadoCivil })
  @IsEnum(EstadoCivil)
  estadoCivil: EstadoCivil;

  @ApiProperty({ example: "123456789" })
  @IsString()
  @IsNotEmpty()
  @Length(5, 20)
  @Matches(/^[0-9A-Za-z.\-]+$/, { message: "RG deve conter apenas números, letras, ponto e hífen" })
  rg: string;

  @ApiProperty({ example: "123.456.789-00" })
  @IsString()
  @Length(11, 14)
  @Matches(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, { message: "CPF deve estar no formato 000.000.000-00 ou 00000000000" })
  @Validate(IsCPF)
  cpf: string;

  @ApiProperty({ example: false, description: "Se o responsável é pessoa jurídica" })
  @IsBoolean()
  @IsOptional()
  pessoaJuridica?: boolean;

  @ApiProperty({ example: false, required: false, description: "Se existe um segundo responsável a ser cadastrado (ativa etapas 1b e 2b)." })
  @IsBoolean()
  @IsOptional()
  temSegundoResponsavel?: boolean;

  @ApiProperty({
    example: "MAE",
    required: false,
    description: "Parentesco do responsável com o aluno (ex.: PAI, MAE, TIO, TUTOR...). Se ausente, assume 'PRINCIPAL'.",
  })
  @IsString()
  @IsOptional()
  @Length(2, 50)
  parentesco?: string;
}
