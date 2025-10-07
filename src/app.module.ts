import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { RegistrationModule } from "./registration/registration.module";

@Module({
  imports: [AuthModule, RegistrationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
