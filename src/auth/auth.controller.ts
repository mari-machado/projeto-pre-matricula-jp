import { Body, Controller, Post, Get, UseGuards, Request } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import {
  LoginResponseDto,
  StatusResponseDto,
  ErrorResponseDto,
} from "./dto/response.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@ApiTags("auth")
@Controller("home")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @ApiOperation({
    summary: "Página inicial do sistema de login",
    description: "Retorna mensagem de boas-vindas da página de login",
  })
  @ApiResponse({
    status: 200,
    description: "Mensagem de boas-vindas retornada com sucesso",
    schema: {
      type: "string",
      example: "Página de Login - Sistema de Pré-Matrícula",
    },
  })
  getHome(): string {
    return "Página de Login - Sistema de Pré-Matrícula";
  }

  @Post("login")
  @ApiOperation({
    summary: "Autenticação de usuário",
    description: "Realiza o login do usuário com email e senha",
  })
  @ApiBody({
    type: LoginDto,
    description: "Dados de login do usuário",
  })
  @ApiResponse({
    status: 200,
    description: "Login realizado com sucesso",
    type: LoginResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Dados de entrada inválidos",
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "Credenciais inválidas",
    type: ErrorResponseDto,
  })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Get("status")
  @ApiOperation({
    summary: "Status do sistema de autenticação",
    description: "Retorna informações sobre o status e endpoints disponíveis",
  })
  @ApiResponse({
    status: 200,
    description: "Status do sistema retornado com sucesso",
    type: StatusResponseDto,
  })
  getStatus(): StatusResponseDto {
    return {
      message: "Sistema de autenticação ativo",
      timestamp: new Date().toISOString(),
      endpoints: {
        login: "POST /home/login",
        status: "GET /home/status",
        profile: "GET /home/profile (protegida)",
      },
    };
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Perfil do usuário autenticado",
    description: "Retorna dados do usuário autenticado (requer token JWT)",
  })
  @ApiResponse({
    status: 200,
    description: "Dados do usuário retornados com sucesso",
    schema: {
      type: "object",
      properties: {
        message: { type: "string", example: "Dados do usuário autenticado" },
        user: {
          type: "object",
          properties: {
            id: { type: "string", example: "550e8400-e29b-41d4-a716-446655440001" },
            email: { type: "string", example: "admin@example.com" },
            name: { type: "string", example: "Administrador" },
          },
        },
        tokenInfo: {
          type: "object",
          properties: {
            isValid: { type: "boolean", example: true },
            type: { type: "string", example: "Bearer" },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: "Token não fornecido ou inválido",
    type: ErrorResponseDto,
  })
  getProfile(@Request() req: any) {
    return {
      message: "Dados do usuário autenticado",
      user: req.user,
      tokenInfo: {
        isValid: true,
        type: "Bearer",
      },
    };
  }
}
