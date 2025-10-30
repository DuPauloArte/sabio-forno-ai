// Local: sabio-forno-api/src/insumos/insumos.controller.ts
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
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InsumosService } from './insumos.service';
import { CreateInsumoDto } from './dto/create-insumo.dto';
import { UpdateInsumoDto } from './dto/update-insumo.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('insumos')
export class InsumosController {
  constructor(private readonly insumosService: InsumosService) {}

  @Post()
  create(@Request() req, @Body() createInsumoDto: CreateInsumoDto) {
    const organizationId = req.user.orgId;
    return this.insumosService.create(organizationId, createInsumoDto);
  }

  @Get()
  findAll(@Request() req) {
    const organizationId = req.user.orgId;
    return this.insumosService.findAll(organizationId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const organizationId = req.user.orgId;
    return this.insumosService.findOne(organizationId, id);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInsumoDto: UpdateInsumoDto,
  ) {
    const organizationId = req.user.orgId;
    return this.insumosService.update(organizationId, id, updateInsumoDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const organizationId = req.user.orgId;
    return this.insumosService.remove(organizationId, id);
  }
}