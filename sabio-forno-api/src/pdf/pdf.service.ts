// Local: sabio-forno-api/src/pdf/pdf.service.ts

import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit'; // Importação corrigida
import { FechamentoCaixa, Pagamento, DespesaDiaria, CustoRegistrado } from '@prisma/client';
import { Writable } from 'stream'; // Necessário para a função streamToBuffer
import { ReceitaDetalhada } from 'src/receitas/receitas.service';

// Tipagem atualizada para incluir a nova relação 'despesasDiarias'
type FechamentoCompleto = FechamentoCaixa & {
  pagamentos: Pagamento[];
  despesasDiarias: DespesaDiaria[];
};

// Tipagem para o Relatório de Custos (nova)
type CustosMensaisReport = {
  custos: CustoRegistrado[];
  mes: number;
  ano: number;
  totalCustos: number;
};

// --- NOVA TIPAGEM ---
// Tipagem para o novo Relatório de Despesas Operacionais
type DespesasMensaisReport = {
  despesas: (DespesaDiaria & { fechamentoCaixa: { data: Date } })[];
  mes: number;
  ano: number;
  totalDespesas: number;
};



@Injectable()
export class PdfService {

  // Função auxiliar para converter o stream do PDF em um Buffer
  private streamToBuffer(stream: PDFKit.PDFDocument): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', (error) => reject(error));
    });
  }

  /**
   * Gera um buffer de PDF para o relatório de fechamento de caixa diário.
   * @param dados Objeto FechamentoCompleto contendo os dados do dia.
   * @returns Promise<Buffer> com o conteúdo do PDF.
   */
  async generateFechamentoCaixaPdf(
    dados: FechamentoCompleto,
  ): Promise<Buffer> {
    // Instanciação corrigida
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // --- Constantes de Layout ---
    const pageMargin = 50;
    const contentWidth = doc.page.width - pageMargin * 2;
    const col1X = pageMargin;
    const col2X = pageMargin + contentWidth * 0.7; // Coluna para valores (70% da largura)

    // --- Cálculos (Com conversão Decimal -> Number) ---
    const vendasTotais =
      Number(dados.vendasDinheiro || 0) + Number(dados.vendasCartao || 0);
    const totalPagamentos =
      dados.pagamentos.reduce((acc, p) => acc + Number(p.valor || 0), 0);
    const totalDespesasDiarias =
      dados.despesasDiarias.reduce((acc, d) => acc + Number(d.valor || 0), 0);
    const saidasTotais = totalDespesasDiarias; // Apenas despesas operacionais
    const saldoLiquido = vendasTotais - saidasTotais;

    // --- Geração do Conteúdo do PDF ---

    // Cabeçalho
    this.addTitle(doc, 'Relatório de Fechamento de Caixa');
    this.addSubtitle(
      doc,
      `Data: ${new Date(dados.data).toLocaleDateString('pt-BR', {
        timeZone: 'UTC', // Garante a data correta
      })}`,
    );

    // Resumo do Dia
    this.addSectionTitle(doc, 'Resumo do Dia');
    this.addRow(doc, '(+) Vendas Totais:', this.formatCurrency(vendasTotais));
    this.addRow(doc, '(-) Saídas Totais (Operacionais):', this.formatCurrency(saidasTotais));
    doc.moveDown(0.5);
    this.addRow(doc, 'Saldo Líquido do Dia:', this.formatCurrency(saldoLiquido), true);
    doc.moveDown(1.5);

    // Detalhamento das Entradas e Fechamento
    this.addSectionTitle(doc, 'Detalhamento');
    this.addRow(doc, 'Vendas em Dinheiro:', this.formatCurrency(Number(dados.vendasDinheiro || 0)));
    this.addRow(doc, 'Vendas no Cartão:', this.formatCurrency(Number(dados.vendasCartao || 0)));
    this.addRow(doc, 'Troco para o dia seguinte:', this.formatCurrency(Number(dados.trocoDiaSeguinte || 0)));
    doc.moveDown(1.5);

    // Despesas Diárias Detalhadas
    if (dados.despesasDiarias.length > 0) {
      this.addSectionTitle(doc, 'Despesas Diárias');
      dados.despesasDiarias.forEach((d) => {
        this.addRow(doc, `- ${d.descricao}:`, this.formatCurrency(Number(d.valor || 0)));
      });
      doc.moveDown(0.5);
      this.addRow(doc, 'Total Despesas Diárias:', this.formatCurrency(totalDespesasDiarias), true);
      doc.moveDown(1.5);
    }

    // Custos Registrados (Boletos Pagos)
    if (dados.pagamentos.length > 0) {
      this.addSectionTitle(doc, 'Custos Registrados no Dia (Boletos/Fornecedores)');
      dados.pagamentos.forEach((p) => {
        this.addRow(doc, `- ${p.descricao}:`, this.formatCurrency(Number(p.valor || 0)));
      });
      doc.moveDown(0.5);
      this.addRow(doc, 'Total Custos Registrados:', this.formatCurrency(totalPagamentos), true);
    }

    // --- Finalização (Usando a nova abordagem) ---
    doc.end(); // Finaliza o documento (essencial!)
    return this.streamToBuffer(doc); // Converte o stream finalizado para Buffer
  }

  // -------------------------------------------------------------------
  // --- NOVA FUNÇÃO: Geração do PDF de Custos Mensais ---
  // -------------------------------------------------------------------
  async generateCustosMensaisPdf(
    dados: CustosMensaisReport,
  ): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const { custos, mes, ano, totalCustos } = dados;

    const mesStr = new Date(ano, mes - 1).toLocaleString('pt-BR', { month: 'long' });
    
    // Título
    this.addTitle(doc, `Relatório de Custos Mensais`);
    this.addSubtitle(doc, `${mesStr.charAt(0).toUpperCase() + mesStr.slice(1)} / ${ano}`);

    // Resumo
    this.addSectionTitle(doc, 'Resumo do Mês');
    this.addRow(doc, 'Total de Custos Registrados:', this.formatCurrency(totalCustos), true);
    doc.moveDown(1.5);

    // Detalhamento (Tabela)
    this.addSectionTitle(doc, 'Detalhamento dos Custos');
    
    // Cabeçalho da Tabela
    const tableTop = doc.y;
    doc.font('Helvetica-Bold');
    doc.text('Descrição do Custo', 50, tableTop, { width: 250 });
    doc.text('Data Pagamento', 300, tableTop, { width: 100 });
    doc.text('Valor Pago', 400, tableTop, { width: 150, align: 'right' });
    doc.moveDown(1);
    doc.font('Helvetica');

    // Linhas da Tabela
    custos.forEach(custo => {
      const y = doc.y;
      doc.text(custo.nome, 50, y, { width: 250 });
      doc.text(new Date(custo.dataPagamento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }), 300, y, { width: 100 });
      doc.text(this.formatCurrency(Number(custo.valor)), 400, y, { width: 150, align: 'right' });
      doc.moveDown(0.7);
    });

    // Finalização
    doc.end();
    return this.streamToBuffer(doc);
  }



  // -------------------------------------------------------------------
  // --- NOVA FUNÇÃO: Geração do PDF de Ficha Técnica (Receita) ---
  // -------------------------------------------------------------------
  async generateReceitaDetailPdf(
    receita: ReceitaDetalhada,
  ): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Título
    this.addTitle(doc, `Ficha Técnica - ${receita.nome}`);
    doc.moveDown(1.5);

    // Resumo de Custos e Preços
    this.addSectionTitle(doc, 'Resumo Financeiro');
    this.addRow(doc, 'Custo Total da Receita:', this.formatCurrency(receita.custoTotalReceita), true);
    this.addRow(doc, `Preço Sugerido Ideal (${Number(receita.lucro_desejado)}%):`, this.formatCurrency(receita.precoSugeridoTotal), true);
    if (receita.rendimento_porcoes && receita.rendimento_porcoes > 0) {
      this.addRow(doc, `Preço Sugerido por Porção (${receita.rendimento_porcoes} porções):`, this.formatCurrency(receita.precoSugeridoPorcao), true);
    }
    doc.moveDown(1.5);

    // Detalhamento (Tabela de Insumos)
    this.addSectionTitle(doc, 'Ingredientes (Insumos)');

    // Cabeçalho da Tabela
    const tableTop = doc.y;
    doc.font('Helvetica-Bold');
    doc.text('Insumo', 50, tableTop, { width: 300 });
    doc.text('Quantidade', 350, tableTop, { width: 100, align: 'right' });
    doc.text('Custo (R$)', 450, tableTop, { width: 100, align: 'right' });
    doc.moveDown(1);
    doc.font('Helvetica');

    // Linhas da Tabela
    receita.insumos.forEach(item => {
      const y = doc.y;
      doc.text(item.insumo?.nome || 'Insumo inválido', 50, y, { width: 300 });
      doc.text(`${item.quantidade_usada} ${item.medida_usada}`, 350, y, { width: 100, align: 'right' });
      doc.text(this.formatCurrency(item.custo), 450, y, { width: 100, align: 'right' });
      doc.moveDown(0.7);
    });

    // Finalização
    doc.end();
    return this.streamToBuffer(doc);
  }


  // -------------------------------------------------------------------
  // --- NOVA FUNÇÃO: Geração do PDF de Custos Operacionais (Despesas) ---
  // -------------------------------------------------------------------
  async generateDespesasMensaisPdf(
    dados: DespesasMensaisReport,
  ): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const { despesas, mes, ano, totalDespesas } = dados;

    const mesStr = new Date(ano, mes - 1).toLocaleString('pt-BR', { month: 'long' });
    
    // Título
    this.addTitle(doc, `Relatório de Custos Operacionais (Despesas Diárias)`);
    this.addSubtitle(doc, `${mesStr.charAt(0).toUpperCase() + mesStr.slice(1)} / ${ano}`);

    // Resumo
    this.addSectionTitle(doc, 'Resumo do Mês');
    this.addRow(doc, 'Total de Despesas Operacionais:', this.formatCurrency(totalDespesas), true);
    doc.moveDown(1.5);

    // Detalhamento (Tabela)
    this.addSectionTitle(doc, 'Detalhamento das Despesas');
    
    // Cabeçalho da Tabela
    const tableTop = doc.y;
    doc.font('Helvetica-Bold');
    doc.text('Descrição da Despesa', 50, tableTop, { width: 300 });
    doc.text('Data', 350, tableTop, { width: 100 });
    doc.text('Valor (R$)', 450, tableTop, { width: 100, align: 'right' });
    doc.moveDown(1);
    doc.font('Helvetica');

    // Linhas da Tabela
    despesas.forEach(despesa => {
      const y = doc.y;
      doc.text(despesa.descricao, 50, y, { width: 300 });
      doc.text(new Date(despesa.fechamentoCaixa.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }), 350, y, { width: 100 });
      doc.text(this.formatCurrency(Number(despesa.valor)), 450, y, { width: 100, align: 'right' });
      doc.moveDown(0.7);
    });

    // Finalização
    doc.end();
    return this.streamToBuffer(doc);
  }


  // --- Definição Completa das Funções Auxiliares ---
  private formatCurrency = (value: number | null | undefined): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(value || 0));
  };
  private addTitle(doc: PDFKit.PDFDocument, text: string) {
    doc.fontSize(18).font('Helvetica-Bold').text(text, { align: 'center' });
    doc.moveDown(0.5);
  };
  private addSubtitle(doc: PDFKit.PDFDocument, text: string) {
    doc.fontSize(12).font('Helvetica').text(text, { align: 'center' });
    doc.moveDown(1.5);
  };
  private addSectionTitle(doc: PDFKit.PDFDocument, text: string) {
    const col1X = 50; // Margem definida no construtor
    const contentWidth = doc.page.width - 50 * 2;
    doc.fontSize(13).font('Helvetica-Bold').text(text);
    doc.lineWidth(0.5).moveTo(col1X, doc.y).lineTo(col1X + contentWidth, doc.y).stroke();
    doc.moveDown(0.7);
    doc.font('Helvetica'); // Reset font
  };
  private addRow(
    doc: PDFKit.PDFDocument,
    label: string,
    value: string,
    isBold = false,
  ) {
    const pageMargin = 50;
    const contentWidth = doc.page.width - pageMargin * 2;
    const col1X = pageMargin;
    const col2X = pageMargin + contentWidth * 0.7;
    const currentY = doc.y;
    doc.fontSize(11).font(isBold ? 'Helvetica-Bold' : 'Helvetica');
    // Define a posição X explicitamente para garantir alinhamento
    doc.text(label, col1X, currentY, { width: contentWidth * 0.65, align: 'left' });
    doc.text(value, col2X, currentY, { width: contentWidth * 0.3, align: 'right' });
    doc.moveDown(0.7); // Ajusta o espaçamento entre linhas
    doc.font('Helvetica'); // Reset font
  };
}