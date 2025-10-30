// Local: src/receitas/receitas.module.ts
import { Module } from '@nestjs/common';
import { ReceitasService } from './receitas.service';
import { ReceitasController } from './receitas.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PdfService } from 'src/pdf/pdf.service';

@Module({
  imports: [PrismaModule],
  controllers: [ReceitasController],
  providers: [ReceitasService, PdfService],
})
export class ReceitasModule {}