// Local: sabio-forno-api/src/insumos/insumos.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateInsumoDto } from './dto/create-insumo.dto';
import { UpdateInsumoDto } from './dto/update-insumo.dto';

@Injectable()
export class InsumosService {
  constructor(private readonly prisma: PrismaService) {}

  create(organizationId: number, createInsumoDto: CreateInsumoDto) {
    return this.prisma.insumo.create({
      data: {
        ...createInsumoDto,
        organizationId: organizationId,
      },
    });
  }

  findAll(organizationId: number) {
    return this.prisma.insumo.findMany({
      where: { organizationId },
    });
  }

  async findOne(organizationId: number, id: number) {
    const insumo = await this.prisma.insumo.findFirst({
      where: { id, organizationId },
    });
    if (!insumo) {
      throw new UnauthorizedException('Insumo não encontrado ou não pertence à sua organização.');
    }
    return insumo;
  }

  async update(organizationId: number, id: number, updateInsumoDto: UpdateInsumoDto) {
    await this.findOne(organizationId, id); // Reutiliza a verificação de permissão
    return this.prisma.insumo.update({
      where: { id },
      data: updateInsumoDto,
    });
  }

  async remove(organizationId: number, id: number) {
    await this.findOne(organizationId, id); // Reutiliza a verificação de permissão
    return this.prisma.insumo.delete({
      where: { id },
    });
  }
}