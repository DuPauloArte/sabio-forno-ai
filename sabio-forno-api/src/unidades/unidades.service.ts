// Local: sabio-forno-api/src/unidades/unidades.service.ts

import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUnidadeDto } from './dto/create-unidade.dto';
import { UpdateUnidadeDto } from './dto/update-unidade.dto';

@Injectable()
export class UnidadesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organizationId: number) {
    // --- LOG DE VERIFICAÇÃO 2 ---
    console.log(`[SERVICE] Executando busca no banco para a Organização ID: ${organizationId}`);
    return this.prisma.unidade.findMany({
      where: { organizationId: organizationId },
    });
  }

  /**
   * --- FUNÇÃO ATUALIZADA (GATING) ---
   * Cria uma nova unidade para uma organização, se o limite do plano permitir.
   */
  async create(organizationId: number, createUnidadeDto: CreateUnidadeDto) {
    
    // 2. Busca a organização e, ao mesmo tempo, conta suas unidades
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        _count: {
          select: { unidades: true }, // Conta as unidades relacionadas
        },
      },
    });

    if (!organization) {
      throw new UnauthorizedException('Organização não encontrada.');
    }

    const currentUnidadeCount = organization._count.unidades;
    const unidadeLimit = organization.unidadeLimit;

    // 3. Impõe o limite do plano (Feature Gating)
    // O plano Imperial (sob consulta) pode ter um limite personalizado,
    // os outros são fixos (1, 2, 3).
    if (currentUnidadeCount >= unidadeLimit) {
      throw new ConflictException(
        `Você atingiu o limite de ${unidadeLimit} unidades do seu plano. Para adicionar mais, por favor, faça um upgrade.`
      );
    }

    // 4. Se o limite permitir, cria a nova unidade
    return this.prisma.unidade.create({
      data: {
        name: createUnidadeDto.name,
        organizationId: organizationId,
      },
    });
  }

  /**
   * Atualiza o nome de uma unidade, verificando a permissão.
   */
  async update(organizationId: number, id: number, updateUnidadeDto: UpdateUnidadeDto) {
    const unidade = await this.prisma.unidade.findFirst({
      where: { id, organizationId },
    });
    if (!unidade) {
      throw new UnauthorizedException('Unidade não encontrada ou não pertence à sua organização.');
    }
    return this.prisma.unidade.update({
      where: { id },
      data: updateUnidadeDto,
    });
  }

  /**
   * Remove uma unidade, verificando a permissão.
   */
  async remove(organizationId: number, id: number) {
    const unidade = await this.prisma.unidade.findFirst({
      where: { id, organizationId },
    });
    if (!unidade) {
      throw new UnauthorizedException('Unidade não encontrada ou não pertence à sua organização.');
    }
    return this.prisma.unidade.delete({ where: { id } });
  }
}