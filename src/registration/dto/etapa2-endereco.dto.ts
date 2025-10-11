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

  @ApiProperty({ example: "Rua Teste" })
  @IsString()
  @IsNotEmpty()
  rua: string;

  @ApiProperty({ example: "100" })
  @IsString()
  @IsNotEmpty()
  numero: string;

  @ApiProperty({ example: "Apto Teste", required: false })
  @IsString()
  @IsOptional()
  complemento?: string;

  @ApiProperty({ example: "São Paulo" })
  @IsString()
  @IsNotEmpty()
  cidade: string;

  @ApiProperty({ enum: UF, example: "SP", required: false })
  @IsEnum(UF)
  @IsOptional()
  uf?: UF;

  @ApiProperty({ example: "Bairro Teste" })
  @IsString()
  @IsNotEmpty()
  bairro: string;

  @ApiProperty({ example: "(11) 91234-5678" })
  @IsString()
  @IsNotEmpty()
  celular: string;


  @ApiProperty({ example: "responsavel@examplo.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: false, required: false, description: "Se existe um segundo responsável a ser cadastrado (ativa etapas 1b e 2b)." })
  @IsOptional()
  temSegundoResponsavel?: boolean;
}
