import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({
    description: "Email do usuário para autenticação",
    example: "admin@example.com",
    format: "email",
  })
  @IsEmail({}, { message: "Email deve ter um formato válido" })
  @IsNotEmpty({ message: "Email é obrigatório" })
  email: string;

  @ApiProperty({
    description: "Senha do usuário",
    example: "123456",
    minLength: 6,
    type: "string",
  })
  @IsString({ message: "Senha deve ser uma string" })
  @IsNotEmpty({ message: "Senha é obrigatória" })
  @MinLength(6, { message: "Senha deve ter pelo menos 6 caracteres" })
  password: string;
}