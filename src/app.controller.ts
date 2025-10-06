import { Controller, Get, Res } from "@nestjs/common";
import type { Response } from "express";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AppService } from "./app.service";

@ApiTags("system")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: "Status do servidor",
    description: "Verifica se o servidor está ativo e funcionando",
  })
  @ApiResponse({
    status: 200,
    description: "Servidor está funcionando corretamente",
    schema: {
      type: "string",
      example: "Servidor está ativo!",
    },
  })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get("cookie-test")
  @ApiOperation({
    summary: "Teste de cookie",
    description: "Define um cookie de teste e retorna os cookies recebidos na requisição.",
  })
  @ApiResponse({
    status: 200,
    description: "Cookie definido e retornado com sucesso",
    schema: {
      type: "object",
      properties: {
        message: { type: "string" },
        now: { type: "string" },
        receivedCookies: { type: "object" },
      },
    },
  })
  cookieTest(@Res({ passthrough: true }) res: Response) {
    res.cookie("test_cookie", "ok", {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 5 * 60 * 1000,
    });
    return {
      message: "Cookie de teste definido (test_cookie).",
      now: new Date().toISOString(),
      receivedCookies: (res.req as any).cookies || {},
    };
  }
}
