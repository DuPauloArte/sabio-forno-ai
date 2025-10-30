// Local: sabio-forno-api/src/despesas/despesas.controller.ts

import {
  Controller,
  Post,
  Body,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
  Query,
  Request,
  Get, // Adiciona Get
  Res, // Adiciona Res
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DespesasService } from './despesas.service';
import { CreateDespesaDto } from './dto/create-despesa.dto';
import { PdfService } from 'src/pdf/pdf.service'; // Importa PdfService
import type { Response } from 'express'; // Importa Response

@UseGuards(AuthGuard('jwt'))
@Controller('despesas')
export class DespesasController {
  constructor(
    private readonly despesasService: DespesasService,
    private readonly pdfService: PdfService, // Injete o PdfService
  ) {}

  @Post()
  create(
    @Query('unidadeId', ParseIntPipe) unidadeId: number,
    @Body() createDespesaDto: CreateDespesaDto,
  ) {
    return this.despesasService.create(unidadeId, createDespesaDto);
  }

  @Delete(':id')
  remove(
    @Query('unidadeId', ParseIntPipe) unidadeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.despesasService.remove(unidadeId, id);
  }

  // --- NOVO ENDPOINT PARA RELATÓRIO MENSAL (DADOS) ---
  @Get('mensal/:ano/:mes')
  findDespesasByMonth(
    @Query('unidadeId', ParseIntPipe) unidadeId: number,
    @Param('ano', ParseIntPipe) ano: number,
    @Param('mes', ParseIntPipe) mes: number,
  ) {
    return this.despesasService.findDespesasByMonth(unidadeId, ano, mes);
  }

  // --- NOVO ENDPOINT PARA RELATÓRIO MENSAL (PDF) ---
  @Get('mensal/:ano/:mes/export-pdf')
  async exportDespesasMensais(
    @Query('unidadeId', ParseIntPipe) unidadeId: number,
    @Param('ano', ParseIntPipe) ano: number,
    @Param('mes', ParseIntPipe) mes: number,
    @Res() res: Response,
  ) {
    // 1. Busca os dados
    const despesas = await this.despesasService.findDespesasByMonth(unidadeId, ano, mes);
    
    // 2. Calcula o total
    const totalDespesas = despesas.reduce((acc, d) => acc + Number(d.valor), 0);
    
    // 3. Monta o payload para o PDF
    const reportData = { despesas, ano, mes, totalDespesas };
    
    // 4. Gera o PDF
    const pdfBuffer = await this.pdfService.generateDespesasMensaisPdf(reportData);

    // 5. Envia o PDF como resposta
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=relatorio-despesas-${ano}-${mes}.pdf`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }
}