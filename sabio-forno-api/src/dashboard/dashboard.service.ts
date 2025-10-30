// Local: sabio-forno-api/src/dashboard/dashboard.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

// --- CORREÇÃO AQUI: Adicionamos 'export' na frente da interface ---
export interface MonthlySummaryItem {
  ano: number;
  mes: number;
  label: string;
  vendas: number;
  custos: number;
  saldo: number;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) { }

 // --- FUNÇÃO getStats ATUALIZADA ---
  async getStats(unidadeId: number, ano?: number, mes?: number) {
    const hoje = new Date();
    
    // Define o período: usa o ano/mês fornecido, ou o mês atual como padrão
    const anoAlvo = ano || hoje.getFullYear();
    const mesAlvo = mes ? mes - 1 : hoje.getMonth(); // mes (1-12) -> mês do JS (0-11)

    const primeiroDiaDoMes = new Date(anoAlvo, mesAlvo, 1);
    const ultimoDiaDoMes = new Date(anoAlvo, mesAlvo + 1, 0); // O dia 0 do próximo mês é o último dia deste

    // 1. Agrega Vendas (Entradas)
    const agregacaoCaixa = await this.prisma.fechamentoCaixa.aggregate({
      where: {
        unidadeId: unidadeId,
        data: { gte: primeiroDiaDoMes, lte: ultimoDiaDoMes },
      },
      _sum: { vendasDinheiro: true, vendasCartao: true },
    });
    // ... (resto dos cálculos permanecem os mesmos) ...
    const vendasTotais =
      Number(agregacaoCaixa?._sum?.vendasDinheiro || 0) +
      Number(agregacaoCaixa?._sum?.vendasCartao || 0);

    // 2. Agrega Despesas Diárias (Operacionais)
    const agregacaoDespesas = await this.prisma.despesaDiaria.aggregate({
      where: {
        fechamentoCaixa: {
          unidadeId: unidadeId,
          data: { gte: primeiroDiaDoMes, lte: ultimoDiaDoMes },
        },
      },
      _sum: { valor: true },
    });
    const totalDespesasDiarias = Number(agregacaoDespesas?._sum?.valor || 0);

    // 3. Agrega Custos Registrados (Pagamentos/Boletos)
    const agregacaoPagamentos = await this.prisma.pagamento.aggregate({
      where: {
        fechamentoCaixa: {
          unidadeId: unidadeId,
          data: { gte: primeiroDiaDoMes, lte: ultimoDiaDoMes },
        },
      },
      _sum: { valor: true },
    });
    const totalCustosRegistrados = Number(agregacaoPagamentos?._sum?.valor || 0);

    // 4. Cálculos
    const custosTotais = totalDespesasDiarias + totalCustosRegistrados;
    const saldoDoMes = vendasTotais - custosTotais;

    // 5. Busca Receitas (Mais e Menos Lucrativas)
    // (Estas não dependem do mês, mas sim do catálogo atual da unidade)
    const produtoMaisLucrativo = await this.prisma.receita.findFirst({
      where: { unidadeId: unidadeId },
      orderBy: { lucro_desejado: 'desc' },
    });
    const produtoMenosLucrativo = await this.prisma.receita.findFirst({
      where: { unidadeId: unidadeId },
      orderBy: { lucro_desejado: 'asc' },
    });

    return {
      saldoLiquidoMes: saldoDoMes,
      vendasNoMes: vendasTotais,
      despesasOperacionaisMes: totalDespesasDiarias,
      custosRegistradosMes: totalCustosRegistrados,
      produtoMaisLucrativo: produtoMaisLucrativo?.nome || 'N/D',
      produtoMenosLucrativo: produtoMenosLucrativo?.nome || 'N/D',
    };
  }
  // --- Função para o Gráfico (Corrigida) ---
  async getMonthlySummary(unidadeId: number) {
    const dataHoje = new Date();
    // O array agora usa a interface exportada
    const resultados: MonthlySummaryItem[] = [];

    // Loop pelos últimos 12 meses
    for (let i = 0; i < 12; i++) {
      const dataAlvo = new Date(dataHoje.getFullYear(), dataHoje.getMonth() - i, 1);
      const ano = dataAlvo.getFullYear();
      const mes = dataAlvo.getMonth() + 1;

      const primeiroDiaDoMes = new Date(ano, mes - 1, 1);
      const ultimoDiaDoMes = new Date(ano, mes, 0);

      // 1. Vendas
      const agregacaoCaixa = await this.prisma.fechamentoCaixa.aggregate({
        where: {
          unidadeId: unidadeId,
          data: { gte: primeiroDiaDoMes, lte: ultimoDiaDoMes },
        },
        _sum: { vendasDinheiro: true, vendasCartao: true },
      });
      const vendasTotais =
        Number(agregacaoCaixa?._sum?.vendasDinheiro || 0) +
        Number(agregacaoCaixa?._sum?.vendasCartao || 0);

      // 2. Despesas Diárias (Operacionais)
      const agregacaoDespesas = await this.prisma.despesaDiaria.aggregate({
        where: {
          fechamentoCaixa: {
            unidadeId: unidadeId,
            data: { gte: primeiroDiaDoMes, lte: ultimoDiaDoMes },
          },
        },
        _sum: { valor: true },
      });
      const totalDespesasDiarias = Number(agregacaoDespesas?._sum?.valor || 0);

      // 3. Custos Registrados (Pagamentos/Boletos)
      const agregacaoPagamentos = await this.prisma.pagamento.aggregate({
        where: {
          fechamentoCaixa: {
            unidadeId: unidadeId,
            data: { gte: primeiroDiaDoMes, lte: ultimoDiaDoMes },
          },
        },
        _sum: { valor: true },
      });
      const totalCustosRegistrados = Number(agregacaoPagamentos?._sum?.valor || 0);

      // 4. Cálculos
      const custosTotais = totalDespesasDiarias + totalCustosRegistrados;
      const saldoLiquido = vendasTotais - custosTotais;

      resultados.push({
        ano: ano,
        mes: mes,
        label: `${new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(
          dataAlvo,
        )}/${ano.toString().slice(-2)}`,
        vendas: vendasTotais,
        custos: custosTotais,
        saldo: saldoLiquido,
      });
    }

    return resultados.reverse();
  }
}