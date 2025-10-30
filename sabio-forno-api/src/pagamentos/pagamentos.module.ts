// Local: sabio-forno-api/src/pagamentos/pagamentos.module.ts

import { Module } from '@nestjs/common';
import { PagamentosService } from './pagamentos.service';
import { PagamentosController } from './pagamentos.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PdfService } from 'src/pdf/pdf.service';

@Module({
  imports: [PrismaModule],
  controllers: [PagamentosController],
  providers: [PagamentosService, PdfService],
})
export class PagamentosModule {}