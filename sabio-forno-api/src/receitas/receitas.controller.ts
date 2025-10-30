// Local: sabio-forno-api/src/receitas/receitas.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Query,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReceitasService } from './receitas.service';
import { CreateReceitaDto } from './dto/create-receita.dto';
import { UpdateReceitaDto } from './dto/update-receita.dto';
import type { Response } from 'express';
import { PdfService } from 'src/pdf/pdf.service'; // Importe PdfService

@UseGuards(AuthGuard('jwt'))
@Controller('receitas')
export class ReceitasController {
  constructor(
    private readonly receitasService: ReceitasService,
    private readonly pdfService: PdfService, // Injete o PdfService
  ) {}

  // --- NOVO ENDPOINT DE EXPORTAÇÃO DE FICHA TÉCNICA ---
  @Get(':id/export-pdf')
  async exportFichaTecnica(
    @Query('unidadeId', ParseIntPipe) unidadeId: number,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    // 1. Busca os dados completos da receita (com custos calculados)
    const receitaData = await this.receitasService.findOne(unidadeId, id);
    if (!receitaData) {
      return res.status(404).send('Receita não encontrada.');
    }
    
    // 2. Gera o PDF
    const pdfBuffer = await this.pdfService.generateReceitaDetailPdf(receitaData);

    // 3. Envia o PDF como resposta
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=ficha-tecnica-${receitaData.nome}.pdf`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }




  @Post()
  create(
    @Query('unidadeId', ParseIntPipe) unidadeId: number,
    @Body() createReceitaDto: CreateReceitaDto,
  ) {
    return this.receitasService.create(unidadeId, createReceitaDto);
  }

  @Get()
  findAll(@Query('unidadeId', ParseIntPipe) unidadeId: number) {
    return this.receitasService.findAll(unidadeId);
  }

  @Get(':id')
  findOne(
    @Query('unidadeId', ParseIntPipe) unidadeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.receitasService.findOne(unidadeId, id);
  }

  @Patch(':id')
  update(
    @Query('unidadeId', ParseIntPipe) unidadeId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReceitaDto: UpdateReceitaDto,
  ) {
    return this.receitasService.update(unidadeId, id, updateReceitaDto);
  }

  @Delete(':id')
  remove(
    @Query('unidadeId', ParseIntPipe) unidadeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.receitasService.remove(unidadeId, id);
  }
}