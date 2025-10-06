import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.use(cookieParser(process.env.COOKIE_SECRET));

  if (process.env.NODE_ENV !== "production") {
    app.use((req, _res, next) => {
      if (req.cookies && Object.keys(req.cookies).length > 0) {
        console.log("Cookies recebidos:", req.cookies);
      }
      next();
    });
  }
  
  app.enableCors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle("Sistema de Pré-Matrícula")
    .setDescription(
      "API para sistema de pré-matrícula com autenticação e gestão de usuários desenvolvida para o Colégio SEICE",
    )
    .setVersion("1.0")
    .addTag("auth", "Operações de autenticação")
    .addTag("system", "Operações do sistema")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Insira o token JWT",
      },
      "JWT-auth",
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document, {
    customSiteTitle: "Pré-Matrícula API",
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #353535ff }
      .swagger-ui .info .title { font-size: 3rem }
    `,
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Aplicação rodando em: http://localhost:${port}`);
  console.log(`📚 Documentação Swagger: http://localhost:${port}/api`);
}
void bootstrap();
