// Local: sabio-forno-api/src/pagamentos/pagamentos.service.ts

import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePagamentoDto } from './dto/create-pagamento.dto';
import { StatusPagamento } from '@prisma/client'; // Importa o Enum

@Injectable()
export class PagamentosService {
  constructor(private readonly prisma: PrismaService) {}

  // --- GERENCIAMENTO DE CUSTOS REGISTRADOS (Leitura) ---

  /**
   * Busca todos os custos registrados para uma unidade em um mês/ano específico.
   */
  async findCustosRegistradosByMonth(unidadeId: number, ano: number, mes: number) {
    return this.prisma.custoRegistrado.findMany({
      where: {
        unidadeId: unidadeId,
        ano: ano,
        mes: mes,
      },
      orderBy: {
        dataPagamento: 'asc', // Ordena pela data
      },
    });
  }

  // --- GERENCIAMENTO DE PAGAMENTOS (Criação e Deleção) ---

  /**
   * Cria um novo registro de Pagamento (que era o antigo "Boleto Pago")
   * E TAMBÉM cria o CustoRegistrado correspondente.
   */
  async createPagamentoAndCusto(unidadeId: number, createPagamentoDto: CreatePagamentoDto) {
    // 1. Garante que o fechamento de caixa pertence à unidade correta
    const fechamentoCaixa = await this.prisma.fechamentoCaixa.findFirst({
      where: { id: createPagamentoDto.fechamentoCaixaId, unidadeId },
    });
    if (!fechamentoCaixa) {
      throw new UnauthorizedException('Fechamento de caixa inválido ou não pertence a esta unidade.');
    }

    // 2. Extrai dados e define o mês/ano
    const { descricao, valor, data } = createPagamentoDto;
    const dataPagamento = new Date(data);
    const mes = dataPagamento.getMonth() + 1;
    const ano = dataPagamento.getFullYear();

    // 3. Usa uma transação para criar ambos os registros
    return this.prisma.$transaction(async (prisma) => {
      // Cria o CustoRegistrado (sempre como PAGO)
      const custo = await prisma.custoRegistrado.create({
        data: {
          nome: descricao, // Usa a descrição do pagamento como nome do custo
          valor: valor,
          mes: mes,
          ano: ano,
          dataPagamento: dataPagamento,
          status: StatusPagamento.PAGO, // Sempre PAGO
          unidadeId: unidadeId,
        },
      });

      // Cria o Pagamento (agora é apenas um registro histórico no caixa)
      const pagamento = await prisma.pagamento.create({
        data: {
          descricao: descricao,
          valor: valor,
          data: dataPagamento,
          fechamentoCaixaId: fechamentoCaixa.id,
          // Não há mais link direto para CustoMensalId
        },
      });
      return pagamento; // Retorna o pagamento criado
    });
  }

  /**
   * Deleta um Pagamento E o CustoRegistrado correspondente (se possível).
   * ATENÇÃO: Esta lógica assume uma relação 1:1 implícita que pode precisar
   * de ajuste dependendo se um pagamento pode quitar múltiplos custos ou vice-versa.
   * Por enquanto, deleta ambos baseando-se na descrição e valor no mesmo dia.
   */
  async deletePagamentoAndCusto(unidadeId: number, id: number) {
    // 1. Encontra o pagamento e garante que pertence à unidade
    const pagamento = await this.prisma.pagamento.findFirst({
      where: { id, fechamentoCaixa: { unidadeId } },
    });
    if (!pagamento) {
      throw new UnauthorizedException('Você não tem permissão para remover este pagamento.');
    }

    // 2. Tenta encontrar o CustoRegistrado correspondente (mesmo dia, nome, valor)
    const dataPagamento = new Date(pagamento.data);
    const mes = dataPagamento.getMonth() + 1;
    const ano = dataPagamento.getFullYear();

    return this.prisma.$transaction(async (prisma) => {
       // Deleta o(s) Custo(s) Registrado(s) correspondente(s)
       await prisma.custoRegistrado.deleteMany({
         where: {
           unidadeId: unidadeId,
           nome: pagamento.descricao,
           valor: pagamento.valor,
           mes: mes,
           ano: ano,
           // Poderíamos adicionar um filtro pela data exata se necessário
         },
       });
       // Deleta o Pagamento
       return prisma.pagamento.delete({ where: { id } });
    });
  }
}