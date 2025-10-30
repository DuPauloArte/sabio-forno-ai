import { Module } from '@nestjs/common';
import { DespesasService } from './despesas.service';
import { DespesasController } from './despesas.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PdfService } from 'src/pdf/pdf.service'; // Importe o PdfService

@Module({
  imports: [PrismaModule],
  controllers: [DespesasController],
  providers: [DespesasService, PdfService], // Adicione PdfService aqui
})
export class DespesasModule {}