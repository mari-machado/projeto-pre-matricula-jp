import { Module } from '@nestjs/common';
import { MatriculasService } from './matriculas.service';
import { MatriculasController } from './matriculas.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [MatriculasController],
  providers: [MatriculasService, PrismaService],
  exports: [MatriculasService],
})
export class MatriculasModule {}
