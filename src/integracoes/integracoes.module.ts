import { Module } from '@nestjs/common';
import { SponteModule } from '../sponte/sponte.module';
import { SponteIntegracaoController } from './sponte-integracao.controller';

@Module({
  imports: [SponteModule],
  controllers: [SponteIntegracaoController],
})
export class IntegracoesModule {}
