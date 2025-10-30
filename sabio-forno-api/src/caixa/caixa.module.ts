// Local: sabio-forno-api/src/caixa/caixa.module.ts

import { Module } from '@nestjs/common';
import { CaixaService } from './caixa.service';
import { CaixaController } from './caixa.controller';
import { PdfService } from 'src/pdf/pdf.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CaixaController],
  providers: [CaixaService, PdfService],
})
export class CaixaModule {}