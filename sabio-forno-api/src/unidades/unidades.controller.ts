// Local: sabio-forno-api/src/unidades/unidades.controller.ts

import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UnidadesService } from './unidades.service';
import { CreateUnidadeDto } from './dto/create-unidade.dto';
import { UpdateUnidadeDto } from './dto/update-unidade.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('unidades')
export class UnidadesController {
  constructor(private readonly unidadesService: UnidadesService) {}

  @Get()
  findAll(@Request() req) {
    const organizationId = req.user.orgId;
    // --- LOG DE VERIFICAÇÃO 1 ---
    console.log(`[CONTROLLER] Chamando 'findAll' para a Organização ID: ${organizationId}`);
    return this.unidadesService.findAll(organizationId);
  }

  /**
   * Cria uma nova unidade para a organização do usuário logado.
   */
  @Post()
  create(@Request() req, @Body() createUnidadeDto: CreateUnidadeDto) {
    const organizationId = req.user.orgId;
    return this.unidadesService.create(organizationId, createUnidadeDto);
  }

  /**
   * Atualiza o nome de uma unidade específica da organização do usuário.
   */
  @Patch(':id')
  update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUnidadeDto: UpdateUnidadeDto,
  ) {
    const organizationId = req.user.orgId;
    return this.unidadesService.update(organizationId, id, updateUnidadeDto);
  }

  /**
   * Remove uma unidade específica da organização do usuário.
   */
  @Delete(':id')
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const organizationId = req.user.orgId;
    return this.unidadesService.remove(organizationId, id);
  }
}