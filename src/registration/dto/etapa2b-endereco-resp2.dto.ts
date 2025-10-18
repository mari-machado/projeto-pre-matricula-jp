import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, Length, Validate, ValidateIf, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from "class-validator";
import { UF } from "../../prisma/schema-enums";

@ValidatorConstraint({ name: 'EnderecoVazioQuandoMoraComPrincipal', async: false })
class EnderecoVazioQuandoMoraComPrincipal implements ValidatorConstraintInterface {
  validate(_: any, args: ValidationArguments) {
    const o = args.object as Etapa2bEnderecoResp2Dto;
    if (!o || !o.moraComResponsavelPrincipal) return true;
    const isEmpty = (v: any) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
    const ufEmpty = o.uf === undefined || o.uf === null || String(o.uf).trim() === '';
    return isEmpty(o.cep) && isEmpty(o.rua) && isEmpty(o.numero) && isEmpty(o.complemento) && isEmpty(o.cidade) && ufEmpty && isEmpty(o.bairro);
  }
  defaultMessage(): string {
    return 'Quando moraComResponsavelPrincipal é true, os campos de endereço (cep, rua, numero, complemento, cidade, uf, bairro) devem estar vazios.';
  }
}

export class Etapa2bEnderecoResp2Dto {
  @Validate(EnderecoVazioQuandoMoraComPrincipal)
  @ApiProperty({ example: "01001-000" })
  @IsString()
  @ValidateIf((o: Etapa2bEnderecoResp2Dto) => !o.moraComResponsavelPrincipal)
  @Length(8, 9)
  cep: string;

  @ApiProperty({ example: "Av. Paulista" })
  @IsString()
  @ValidateIf((o: Etapa2bEnderecoResp2Dto) => !o.moraComResponsavelPrincipal)
  @Length(2, 255)
  @Validate(EnderecoVazioQuandoMoraComPrincipal)
  rua: string;

  @ApiProperty({ example: "1000" })
  @IsString()
  @ValidateIf((o: Etapa2bEnderecoResp2Dto) => !o.moraComResponsavelPrincipal)
  @Length(1, 10)
  @Validate(EnderecoVazioQuandoMoraComPrincipal)
  numero: string;

  @ApiProperty({ example: "Apto 12", required: false })
  @IsString()
  @IsOptional()
  @Length(0, 100)
  @Validate(EnderecoVazioQuandoMoraComPrincipal)
  complemento?: string;

  @ApiProperty({ example: "São Paulo" })
  @IsString()
  @ValidateIf((o: Etapa2bEnderecoResp2Dto) => !o.moraComResponsavelPrincipal)
  @Length(2, 100)
  @Validate(EnderecoVazioQuandoMoraComPrincipal)
  cidade: string;

  @ApiProperty({ enum: UF, example: "SP",  required: false })
  @IsOptional()
  @ValidateIf((o: Etapa2bEnderecoResp2Dto) => !o.moraComResponsavelPrincipal)
  @Validate(EnderecoVazioQuandoMoraComPrincipal)
  uf: UF;

  @ApiProperty({ example: "Bela Vista" })
  @IsString()
  @ValidateIf((o: Etapa2bEnderecoResp2Dto) => !o.moraComResponsavelPrincipal)
  @Length(2, 100)
  @Validate(EnderecoVazioQuandoMoraComPrincipal)
  bairro: string;

  @ApiProperty({ example: "+55 11 91234-5678" })
  @IsString()
  @Length(8, 20)
  celular: string;

  @ApiProperty({ example: "email@exemplo.com" })
  @IsEmail()
  @Length(1, 255)
  email: string;
  
  @ApiProperty({ required: false, description: "Se o segundo responsável mora com o primeiro responsável. Quando for true, os campos de endereço devem ser enviados vazios." })
  @IsOptional()
  moraComResponsavelPrincipal?: boolean;
}
