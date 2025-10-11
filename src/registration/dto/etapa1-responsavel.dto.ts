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
import { IsDateStringOrDate } from "./validators/is-date-string-or-date";
import { cpf as cpfValidator } from "cpf-cnpj-validator";

function parseDateInput(value: unknown): Date {
  if (!value) return new Date(NaN);
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) {
      const [_, yyyy, mm, dd] = iso;
      return new Date(parseInt(yyyy,10), parseInt(mm,10)-1, parseInt(dd,10));
    }
    const dmyOrMdy = value.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
    if (dmyOrMdy) {
      const [_, a, b, yyyy] = dmyOrMdy;
      const A = parseInt(a, 10);
      const B = parseInt(b, 10);
      const Y = parseInt(yyyy, 10);
      let day = A, month = B;
      if (A > 12 && B <= 12) { day = A; month = B; }
      else if (B > 12 && A <= 12) { day = B; month = A; }
      return new Date(Y, month - 1, day);
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

  @ApiProperty({ example: "10/05/1980", description: "Aceita dd/MM/yyyy, dd-MM-yyyy, MM/dd/yyyy, MM-dd-yyyy ou yyyy-MM-dd (string)" })
  @Validate(IsDateStringOrDate)
  dataNascimento: string;

  @ApiProperty({ example: "DETRAN" })
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  orgaoExpeditor: string;

  @ApiProperty({ example: "15/01/2010", description: "Aceita dd/MM/yyyy, dd-MM-yyyy, MM/dd/yyyy, MM-dd-yyyy ou yyyy-MM-dd (string)" })
  @Validate(IsDateStringOrDate)
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
