try {
  require('dotenv').config();
} catch (e) {
}
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import type { Request, Response, NextFunction } from "express";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set("trust proxy", 1);
  
  const allowedOrigins = new Set([
    "http://localhost:3000",
    "https://pre-matricula-one.vercel.app",
  ]);
  
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin as string | undefined;
    if (origin && allowedOrigins.has(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Vary", "Origin");
    }
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Accept, Origin, X-Requested-With",
    );
    res.header(
      "Access-Control-Allow-Methods",
      "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    );
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });

  app.enableCors({
    origin: [
      "http://localhost:3000",
      "https://pre-matricula-one.vercel.app",
    ],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    exposedHeaders: ["Set-Cookie"],
  });
    app.enableShutdownHooks();
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
  .addTag("cadastro", "Fluxo de cadastro em etapas (responsável, endereço, aluno)")
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
