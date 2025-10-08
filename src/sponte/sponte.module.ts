import { Module } from '@nestjs/common';
import { SponteService } from './sponte.service';

@Module({
  providers: [SponteService],
  exports: [SponteService],
})
export class SponteModule {}
