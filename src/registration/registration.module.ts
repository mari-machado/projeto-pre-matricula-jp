import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PrismaModule } from "../prisma/prisma.module";
import { SponteModule } from "../sponte/sponte.module";
import { RegistrationService } from "./registration.service";
import { RegistrationController } from "./registration.controller"

@Module({
  imports: [PrismaModule, SponteModule, JwtModule.register({})],
  controllers: [RegistrationController],
  providers: [RegistrationService],
  exports: [RegistrationService],
})
export class RegistrationModule {}
