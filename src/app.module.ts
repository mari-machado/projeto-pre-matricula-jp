import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { RegistrationModule } from "./registration/registration.module";
import { MatriculasModule } from "./matriculas/matriculas.module";

@Module({
  imports: [AuthModule, RegistrationModule, MatriculasModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
