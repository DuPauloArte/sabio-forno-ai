// Local: sabio-forno-api/src/pagamentos/pagamentos.controller.ts

import { Controller, Get, Post, Body, Param, Delete, ParseIntPipe, UseGuards, Query, NotFoundException, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PagamentosService } from './pagamentos.service';
import { CreatePagamentoDto } from './dto/create-pagamento.dto';
import { PdfService } from 'src/pdf/pdf.service'; // Importe PdfService
import type { Response } from 'express';

// Removemos os DTOs e endpoints de CustoFixo e UpdateCustosMensais

@UseGuards(AuthGuard('jwt'))
@Controller('pagamentos') // Mantemos a rota base por simplicidade
export class PagamentosController {
  constructor(
    private readonly pagamentosService: PagamentosService,
    private readonly pdfService: PdfService,
  ) {}

  // --- NOVO ENDPOINT DE EXPORTAÇÃO DE CUSTOS ---
  @Get('custos-registrados/:ano/:mes/export-pdf')
  async exportCustosMensais(
    @Query('unidadeId', ParseIntPipe) unidadeId: number,
    @Param('ano', ParseIntPipe) ano: number,
    @Param('mes', ParseIntPipe) mes: number,
    @Res() res: Response,
  ) {
    // 1. Busca os dados dos custos
    const custos = await this.pagamentosService.findCustosRegistradosByMonth(unidadeId, ano, mes);
    
    // 2. Calcula o total
    const totalCustos = custos.reduce((acc, custo) => acc + Number(custo.valor), 0);
    
    // 3. Monta o payload para o PDF
    const reportData = { custos, ano, mes, totalCustos };
    
    // 4. Gera o PDF
    const pdfBuffer = await this.pdfService.generateCustosMensaisPdf(reportData);

    // 5. Envia o PDF como resposta
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=relatorio-custos-${ano}-${mes}.pdf`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }



  // --- Endpoint para Relatório de Custos Mensais ---
  @Get('custos-registrados/:ano/:mes') // Rota renomeada para clareza
  findCustosRegistradosByMonth(
    @Query('unidadeId', ParseIntPipe) unidadeId: number,
    @Param('ano', ParseIntPipe) ano: number,
    @Param('mes', ParseIntPipe) mes: number,
  ) {
    return this.pagamentosService.findCustosRegistradosByMonth(unidadeId, ano, mes);
  }

  // --- Endpoints para Pagamentos (que também criam Custos) ---
  @Post()
  createPagamentoAndCusto(
    @Query('unidadeId', ParseIntPipe) unidadeId: number,
    @Body() createPagamentoDto: CreatePagamentoDto,
  ) {
    return this.pagamentosService.createPagamentoAndCusto(unidadeId, createPagamentoDto);
  }

  @Delete(':id')
  deletePagamentoAndCusto(
    @Query('unidadeId', ParseIntPipe) unidadeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.pagamentosService.deletePagamentoAndCusto(unidadeId, id);
  }
}