import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { SponteModule } from "../sponte/sponte.module";
import { RegistrationService } from "./registration.service";
import { RegistrationController } from "./registration.controller"

@Module({
  imports: [PrismaModule, SponteModule],
  controllers: [RegistrationController],
  providers: [RegistrationService],
  exports: [RegistrationService],
})
export class RegistrationModule {}
