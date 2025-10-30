// Local: sabio-forno-api/src/dashboard/dashboard.controller.ts

import { Controller, Get, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';

@UseGuards(AuthGuard('jwt'))
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // Endpoint para os STATS (os 5 cards)
  @Get('stats')
  getStats(
    @Query('unidadeId', ParseIntPipe) unidadeId: number,
    // Adiciona parâmetros opcionais de data. O 'ParseIntPipe' com 'optional'
    // garante que eles sejam números se existirem, ou 'undefined' se não.
    @Query('ano', new ParseIntPipe({ optional: true })) ano?: number,
    @Query('mes', new ParseIntPipe({ optional: true })) mes?: number,
  ) {
    return this.dashboardService.getStats(unidadeId, ano, mes);
  }

  // Endpoint para o GRÁFICO (permanece o mesmo)
  @Get('monthly-summary')
  getMonthlySummary(@Query('unidadeId', ParseIntPipe) unidadeId: number) {
    return this.dashboardService.getMonthlySummary(unidadeId);
  }
}