// Local: sabio-forno-api/src/insumos/insumos.module.ts
import { Module } from '@nestjs/common';
import { InsumosService } from './insumos.service';
import { InsumosController } from './insumos.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule], // Adicionado para injetar o PrismaService no controller
  controllers: [InsumosController],
  providers: [InsumosService],
})
export class InsumosModule {}