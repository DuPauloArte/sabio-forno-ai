// Local: sabio-forno-api/src/receitas/receitas.service.ts

import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client'; // Importa UserRole
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReceitaDto } from './dto/create-receita.dto';
import { UpdateReceitaDto } from './dto/update-receita.dto';

// --- DEFINIÇÕES DE INTERFACE EXPORTADAS ---
// Precisamos exportá-las para que o PdfService possa usá-las.

interface InsumoBase {
  id: number;
  nome: string;
}

interface InsumoCalculado {
  id: number;
  quantidade_usada: number | Prisma.Decimal;
  medida_usada: string;
  custo: number;
  insumo: InsumoBase;
}

// CORREÇÃO: A interface agora está no topo e é exportada
export interface ReceitaDetalhada {
  id: number;
  nome: string;
  rendimento_porcoes: number | null;
  lucro_desejado: Prisma.Decimal;
  valor_praticado: number; // Já corrigido para 'number'
  insumos: InsumoCalculado[];
  custoTotalReceita: number;
  precoSugeridoTotal: number;
  precoSugeridoPorcao: number;
}



@Injectable()
export class ReceitasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(unidadeId: number, createReceitaDto: CreateReceitaDto) {
    const { nome, lucro_desejado, rendimento_porcoes, insumos } =
      createReceitaDto;

    const dataParaCriar: Prisma.ReceitaCreateInput = {
      nome,
      lucro_desejado,
      unidade: { connect: { id: unidadeId } },
      insumos: {
        create: insumos.map((insumo) => ({
          quantidade_usada: insumo.quantidade_usada,
          medida_usada: insumo.medida_usada,
          insumo: { connect: { id: insumo.insumoId } },
        })),
      },
    };

    if (rendimento_porcoes) {
      dataParaCriar.rendimento_porcoes = rendimento_porcoes;
    }

    return this.prisma.receita.create({ data: dataParaCriar });
  }

  findAll(unidadeId: number) {
    return this.prisma.receita.findMany({
      where: { unidadeId },
      select: { id: true, nome: true },
    });
  }

  // CORREÇÃO: A função agora retorna o tipo 'ReceitaDetalhada'
  async findOne(unidadeId: number, id: number): Promise<ReceitaDetalhada> {
    const receita = await this.prisma.receita.findFirst({
      where: { id, unidadeId },
      include: {
        insumos: {
          include: {
            insumo: true,
          },
        },
      },
    });

    if (!receita) {
      throw new NotFoundException(`Receita com ID #${id} não encontrada para esta unidade.`);
    }

    const paraBaseMap = {
      kilo: 1000, quilo: 1000, kilograma: 1000, kg: 1000,
      grama: 1, gramas: 1, g: 1,
      litro: 1000, litros: 1000, l: 1000,
      mililitro: 1, mililitros: 1, ml: 1,
      unidade: 1, unidades: 1, un: 1,
    };

    let custoTotalReceita = 0;
    const insumosCalculados: InsumoCalculado[] = receita.insumos.map((item) => {
      const insumoPrincipal = item.insumo;
      const unidadeCompraNormalizada = insumoPrincipal.unidade_compra.toLowerCase();
      const medidaUsadaNormalizada = item.medida_usada.toLowerCase();
      const fatorCompra = paraBaseMap[unidadeCompraNormalizada] || 1;
      const precoPorUnidadeBase = Number(insumoPrincipal.valor_unidade_compra) / fatorCompra;
      const fatorUso = paraBaseMap[medidaUsadaNormalizada] || 1;
      const quantidadeNaBase = Number(item.quantidade_usada) * fatorUso;
      const custoInsumo = precoPorUnidadeBase * quantidadeNaBase;
      custoTotalReceita += custoInsumo;
      return { ...item, custo: parseFloat(custoInsumo.toFixed(2)) };
    });

    const lucro = 1 + Number(receita.lucro_desejado) / 100;
    const precoSugeridoTotal = custoTotalReceita * lucro;
    const precoSugeridoPorcao =
      receita.rendimento_porcoes && receita.rendimento_porcoes > 0
        ? precoSugeridoTotal / receita.rendimento_porcoes
        : 0;

    return {
      ...receita,
      valor_praticado: Number(receita.valor_praticado), // Garante que é 'number'
      insumos: insumosCalculados,
      custoTotalReceita: parseFloat(custoTotalReceita.toFixed(2)),
      precoSugeridoTotal: parseFloat(precoSugeridoTotal.toFixed(2)),
      precoSugeridoPorcao: parseFloat(precoSugeridoPorcao.toFixed(2)),
    };
  }

  async update(unidadeId: number, id: number, updateReceitaDto: UpdateReceitaDto) {
    const receitaExistente = await this.prisma.receita.findFirst({ where: { id, unidadeId } });
    if (!receitaExistente) {
      throw new UnauthorizedException('Você não tem permissão para editar esta receita.');
    }

    const { insumos, ...receitaData } = updateReceitaDto;

    if (!insumos) {
      await this.prisma.receita.update({
        where: { id },
        data: receitaData,
      });
    } else {
      await this.prisma.$transaction(async (prisma) => {
        await prisma.receita.update({ where: { id }, data: receitaData });
        await prisma.receitaInsumo.deleteMany({ where: { receitaId: id } });
        await prisma.receita.update({
          where: { id },
          data: {
            insumos: {
              create: insumos.map((insumo) => ({
                quantidade_usada: insumo.quantidade_usada,
                medida_usada: insumo.medida_usada,
                insumo: { connect: { id: insumo.insumoId } },
              })),
            },
          },
        });
      });
    }

    return this.findOne(unidadeId, id);
  }

  async remove(unidadeId: number, id: number) {
    const receitaExistente = await this.prisma.receita.findFirst({ where: { id, unidadeId } });
    if (!receitaExistente) {
      throw new UnauthorizedException('Você não tem permissão para remover esta receita.');
    }
    return this.prisma.$transaction(async (prisma) => {
      await prisma.receitaInsumo.deleteMany({ where: { receitaId: id } });
      await prisma.receita.delete({ where: { id } });
    });
  }
}