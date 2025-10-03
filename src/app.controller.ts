import { Controller, Get } from "@nestjs/common";
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
}
