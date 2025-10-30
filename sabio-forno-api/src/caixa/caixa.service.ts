// Local: sabio-forno-api/src/caixa/caixa.service.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateCaixaDto } from './dto/update-caixa.dto';

@Injectable()
export class CaixaService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreateByDate(unidadeId: number, data: string) {
    const dataISO = new Date(data);

    const fechamentoExistente = await this.prisma.fechamentoCaixa.findUnique({
      where: { unidadeId_data: { unidadeId, data: dataISO } },
      // CORREÇÃO: Garante que 'despesasDiarias' sempre seja incluído
      include: { pagamentos: true, despesasDiarias: true },
    });

    if (fechamentoExistente) {
      return fechamentoExistente;
    }

    return this.prisma.fechamentoCaixa.create({
      data: {
        data: dataISO,
        unidadeId: unidadeId,
      },
      // CORREÇÃO: Garante que 'despesasDiarias' sempre seja incluído
      include: { pagamentos: true, despesasDiarias: true },
    });
  }

  async update(unidadeId: number, id: number, updateCaixaDto: UpdateCaixaDto) {
    const fechamento = await this.prisma.fechamentoCaixa.findFirst({
      where: { id, unidadeId },
    });

    if (!fechamento) {
      throw new UnauthorizedException(
        'Você não tem permissão para editar este registro.',
      );
    }

    return this.prisma.fechamentoCaixa.update({
      where: {
        id: id,
      },
      data: { // Garante que apenas os campos corretos sejam atualizados
        vendasDinheiro: updateCaixaDto.vendasDinheiro,
        vendasCartao: updateCaixaDto.vendasCartao,
        trocoDiaSeguinte: updateCaixaDto.trocoDiaSeguinte,
      },
      // CORREÇÃO: Garante que 'despesasDiarias' sempre seja incluído na resposta
      include: { pagamentos: true, despesasDiarias: true },
    });
  }
}