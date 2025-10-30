// Local: sabio-forno-api/src/despesas/despesas.service.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDespesaDto } from './dto/create-despesa.dto';

@Injectable()
export class DespesasService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria uma nova despesa diária, garantindo que o fechamento de caixa
   * pertence à unidade correta.
   */
  async create(unidadeId: number, createDespesaDto: CreateDespesaDto) {
    const fechamento = await this.prisma.fechamentoCaixa.findFirst({
      where: { id: createDespesaDto.fechamentoCaixaId, unidadeId },
    });
    if (!fechamento) {
      throw new UnauthorizedException('Fechamento de caixa inválido ou não pertence a esta unidade.');
    }

    return this.prisma.despesaDiaria.create({
      data: createDespesaDto,
    });
  }

  /**
   * Remove uma despesa diária, garantindo que ela pertence à unidade correta.
   */
  async remove(unidadeId: number, id: number) {
    const despesa = await this.prisma.despesaDiaria.findFirst({
      where: { id, fechamentoCaixa: { unidadeId } },
    });
    if (!despesa) {
      throw new UnauthorizedException('Despesa não encontrada ou não pertence a esta unidade.');
    }

    return this.prisma.despesaDiaria.delete({
      where: { id },
    });
  }

  /**
   * --- NOVA FUNÇÃO ---
   * Busca todas as despesas diárias de uma unidade para um mês/ano específico.
   */
  async findDespesasByMonth(unidadeId: number, ano: number, mes: number) {
    const primeiroDiaDoMes = new Date(ano, mes - 1, 1);
    const ultimoDiaDoMes = new Date(ano, mes, 0);

    return this.prisma.despesaDiaria.findMany({
      where: {
        fechamentoCaixa: {
          unidadeId: unidadeId,
          data: {
            gte: primeiroDiaDoMes,
            lte: ultimoDiaDoMes,
          },
        },
      },
      include: {
        // Inclui o fechamento para pegarmos a data exata
        fechamentoCaixa: {
          select: {
            data: true,
          },
        },
      },
      orderBy: {
        fechamentoCaixa: {
          data: 'asc',
        },
      },
    });
  }
}