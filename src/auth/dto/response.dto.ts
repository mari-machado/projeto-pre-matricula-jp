import { ApiProperty } from "@nestjs/swagger";

export class UserResponseDto {
  @ApiProperty({
    description: "ID único do usuário",
    example: "550e8400-e29b-41d4-a716-446655440001",
  })
  id: string;

  @ApiProperty({
    description: "Email do usuário",
    example: "admin@example.com",
  })
  email: string;

  @ApiProperty({
    description: "Nome do usuário",
    example: "Administrador",
  })
  name: string;
}

export class LoginResponseDto {
  @ApiProperty({
    description: "Mensagem de sucesso do login",
    example: "Login realizado com sucesso",
  })
  message: string;

  @ApiProperty({
    description: "Dados do usuário autenticado",
    type: UserResponseDto,
  })
  user: UserResponseDto;

  @ApiProperty({
    description: "Token de autenticação",
    example: "fake-jwt-token-for-1",
  })
  token: string;

  @ApiProperty({
    description: "Indica se o email de confirmação foi enviado",
    example: true,
  })
  emailSent: boolean;
}

export class StatusResponseDto {
  @ApiProperty({
    description: "Mensagem de status do sistema",
    example: "Sistema de autenticação ativo",
  })
  message: string;

  @ApiProperty({
    description: "Timestamp da consulta",
    example: "2025-10-03T19:30:00.000Z",
  })
  timestamp: string;

  @ApiProperty({
    description: "Endpoints disponíveis",
    example: {
      login: "POST /home/login",
      status: "GET /home/status",
    },
  })
  endpoints: object;
}

export class ErrorResponseDto {
  @ApiProperty({
    description: "Código de status HTTP",
    example: 401,
  })
  statusCode: number;

  @ApiProperty({
    description: "Mensagem de erro",
    example: "Credenciais inválidas",
  })
  message: string;

  @ApiProperty({
    description: "Tipo do erro",
    example: "Não autorizado",
  })
  error: string;
}