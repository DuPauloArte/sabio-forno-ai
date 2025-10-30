// Local: sabio-forno-api/src/caixa/caixa.controller.ts

import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  ParseIntPipe,
  UseGuards,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { CaixaService } from './caixa.service';
import { UpdateCaixaDto } from './dto/update-caixa.dto';
import { PdfService } from 'src/pdf/pdf.service';

@UseGuards(AuthGuard('jwt'))
@Controller('caixa')
export class CaixaController {
  constructor(
    private readonly caixaService: CaixaService,
    private readonly pdfService: PdfService,
  ) {}

  @Get('export-pdf/:data')
  async exportPdf(
    @Query('unidadeId', ParseIntPipe) unidadeId: number,
    @Param('data') data: string,
    @Res() res: Response,
  ) {
    const fechamento = await this.caixaService.findOrCreateByDate(unidadeId, data);
    if (!fechamento || !fechamento.pagamentos) {
      return res.status(404).send('Dados de fechamento não encontrados.');
    }
    const pdfBuffer = await this.pdfService.generateFechamentoCaixaPdf(fechamento);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=fechamento-${data}.pdf`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @Get(':data')
  findOrCreate(
    @Query('unidadeId', ParseIntPipe) unidadeId: number,
    @Param('data') data: string,
  ) {
    return this.caixaService.findOrCreateByDate(unidadeId, data);
  }

  @Patch(':id')
  update(
    @Query('unidadeId', ParseIntPipe) unidadeId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCaixaDto: UpdateCaixaDto,
  ) {
    return this.caixaService.update(unidadeId, id, updateCaixaDto);
  }
}