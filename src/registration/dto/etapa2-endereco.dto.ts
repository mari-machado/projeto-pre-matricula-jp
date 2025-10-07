import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, Length, IsEnum } from "class-validator";

export enum UF {
  AC = "AC",
  AL = "AL",
  AP = "AP",
  AM = "AM",
  BA = "BA",
  CE = "CE",
  DF = "DF",
  ES = "ES",
  GO = "GO",
  MA = "MA",
  MT = "MT",
  MS = "MS",
  MG = "MG",
  PA = "PA",
  PB = "PB",
  PR = "PR",
  PE = "PE",
  PI = "PI",
  RJ = "RJ",
  RN = "RN",
  RS = "RS",
  RO = "RO",
  RR = "RR",
  SC = "SC",
  SP = "SP",
  SE = "SE",
  TO = "TO"
}

export class Etapa2EnderecoDto {
  @ApiProperty({ example: "01001-000" })
  @IsString()
  @Matches(/^[0-9]{5}-?[0-9]{3}$/)
  cep: string;

  @ApiProperty({ example: "Praça da Sé" })
  @IsString()
  @IsNotEmpty()
  rua: string;

  @ApiProperty({ example: "100" })
  @IsString()
  @IsNotEmpty()
  numero: string;

  @ApiProperty({ example: "Apto 12", required: false })
  @IsString()
  @IsOptional()
  complemento?: string;

  @ApiProperty({ example: "São Paulo" })
  @IsString()
  @IsNotEmpty()
  cidade: string;

  @ApiProperty({ enum: UF, example: "SP" })
  @IsEnum(UF)
  uf: UF;

  @ApiProperty({ example: "Sé" })
  @IsString()
  @IsNotEmpty()
  bairro: string;

  @ApiProperty({ example: "(11) 91234-5678" })
  @IsString()
  @IsNotEmpty()
  celular: string;

  @ApiProperty({ example: "(11) 91234-5678", required: false })
  @IsString()
  @IsOptional()
  contatoWhatsapp?: string;

  @ApiProperty({ example: "responsavel@example.com" })
  @IsEmail()
  email: string;
}
