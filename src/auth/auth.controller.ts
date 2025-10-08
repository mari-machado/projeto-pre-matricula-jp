import { Body, Controller, Post, Get, UseGuards, Request, Response } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import type { Response as ExpressResponse, Request as ExpressRequest } from "express";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RequestRegistrationDto } from "./dto/request-registration.dto";
import { ConfirmRegistrationDto } from "./dto/confirm-registration.dto";
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
  async login(
    @Body() loginDto: LoginDto,
    @Response({ passthrough: true }) res: ExpressResponse,
  ): Promise<LoginResponseDto> {
    const result = await this.authService.login(loginDto);
    
    res.cookie("access_token", result.token, {
      httpOnly: true, 
      sameSite: "strict", 
      maxAge: 3600000, 
    });
    
    return result;
  }

  @Post("register/request")
  @ApiOperation({ summary: "Solicitar código de verificação", description: "Envia código para o email informado" })
  @ApiBody({ type: RequestRegistrationDto })
  @ApiResponse({ status: 201, description: "Código enviado" })
  @ApiBadRequestResponse({ description: "Email já registrado ou inválido" })
  async requestRegistration(@Body() dto: RequestRegistrationDto) {
    return this.authService.requestRegistration(dto);
  }

  @Post("register/confirm")
  @ApiOperation({ summary: "Confirmar registro", description: "Valida código e cria o usuário" })
  @ApiBody({ type: ConfirmRegistrationDto })
  @ApiResponse({ status: 201, description: "Usuário criado" })
  @ApiBadRequestResponse({ description: "Código inválido/expirado ou senhas não conferem" })
  async confirmRegistration(@Body() dto: ConfirmRegistrationDto) {
    return this.authService.confirmRegistration(dto);
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
        profile: "GET /home/profile",
        logout: "POST /home/logout",
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

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Logout do usuário",
    description: "Realiza logout limpando o cookie de autenticação",
  })
  @ApiResponse({
    status: 200,
    description: "Logout realizado com sucesso",
    schema: {
      type: "object",
      properties: {
        message: { type: "string", example: "Logout realizado com sucesso" },
        timestamp: { type: "string", example: "2025-10-03T19:30:00.000Z" },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: "Token não fornecido ou inválido",
    type: ErrorResponseDto,
  })
  logout(@Response({ passthrough: true }) res: ExpressResponse) {
    res.clearCookie("access_token", {
      httpOnly: true,
      sameSite: "strict",
    });

    return {
      message: "Logout realizado com sucesso",
      timestamp: new Date().toISOString(),
    };
  }
}
