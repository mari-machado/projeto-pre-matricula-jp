import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, Matches, IsBoolean, ValidateIf } from "class-validator";
import { UF } from "../../prisma/schema-enums";
import { IsEnum } from "class-validator";

export class Etapa3bEnderecoAlunoDto {
  @ApiProperty({ example: true, description: 'Indica se o aluno mora com o responsável' })
  @IsBoolean()
  moraComResponsavel: boolean;

  @ApiProperty({ example: 'Maria Silva', required: false, description: 'Nome do responsável com quem o aluno mora (escolhido a partir da lista de responsáveis desta matrícula). Obrigatório quando moraComResponsavel = true.' })
  @IsString()
  @ValidateIf((o: Etapa3bEnderecoAlunoDto) => o?.moraComResponsavel === true)
  @IsNotEmpty({ message: 'Quando "moraComResponsavel" é true, o campo "moraComResponsavelNome" é obrigatório.' })
  moraComResponsavelNome?: string;

  @ApiProperty({ example: "(11) 1234-5678", required: false, description: 'Opcional; pode ser string vazia' })
  @IsString()
  @IsOptional()
  @Length(0, 20)
  telefone?: string;

  @ApiProperty({ example: "(11) 91234-5678", required: false, description: 'Opcional; pode ser string vazia' })
  @IsString()
  @IsOptional()
  @Length(0, 20)
  celular?: string;

  @ApiProperty({ example: "(11) 91234-5678", required: false, description: 'Opcional; pode ser vazio' })
  @IsString()
  @IsOptional()
  @Length(0, 20)
  whatsapp?: string;

  @ApiProperty({ example: "aluno@example.com", required: false, description: 'Opcional; pode ser string vazia' })
  @IsOptional()
  @Length(0, 255)
  @ValidateIf((o: Etapa3bEnderecoAlunoDto) => (o.email ?? '') !== '')
  @IsEmail()
  email?: string;

  @ApiProperty({ example: "01234-567" })
  @IsString()
  @IsOptional()
  @Length(8, 9)
  cep?: string;

  @ApiProperty({ example: "Rua das Flores" })
  @IsString()
  @IsOptional()
  rua?: string;

  @ApiProperty({ example: "123" })
  @IsString()
  @IsOptional()
  numero?: string;

  @ApiProperty({ example: "Apto 12", required: false })
  @IsString()
  @IsOptional()
  complemento?: string;

  @ApiProperty({ example: "Centro" })
  @IsString()
  @IsOptional()
  bairro?: string;

  @ApiProperty({ example: "Campinas" })
  @IsString()
  @IsOptional()
  cidade?: string;

  @ApiProperty({ enum: UF, required: false })
  @IsEnum(UF)
  @IsOptional()
  uf?: UF;
}
