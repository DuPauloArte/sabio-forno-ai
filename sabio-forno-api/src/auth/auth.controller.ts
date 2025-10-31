// Local: sabio-forno-api/src/auth/auth.controller.ts

import {
  Controller, Post, Body, Get, UseGuards,
  Request, Patch, Param, ParseIntPipe,
  UnauthorizedException, Delete
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CreateChildUserDto } from './dto/create-child-user.dto';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';
import { UpdateChildUserDto } from './dto/update-child-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // --- Rotas Públicas ---
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // --- Rotas Protegidas ---

  @UseGuards(AuthGuard('jwt'))
  @Post('children')
  createChildUser(@Request() req, @Body() createChildUserDto: CreateChildUserDto) {
    const paiId = req.user.id;
    if (req.user.role !== 'PAI') {
        throw new UnauthorizedException('Apenas o usuário principal pode criar usuários filho.');
    }
    return this.authService.createChildUser(paiId, createChildUserDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('children')
  getChildren(@Request() req) {
    const paiId = req.user.id;
    if (req.user.role !== 'PAI') {
        throw new UnauthorizedException('Apenas o usuário principal pode listar usuários filho.');
    }
    return this.authService.findChildren(paiId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('children/:id')
  getChildById(@Request() req, @Param('id', ParseIntPipe) childId: number) {
    const paiId = req.user.id;
    if (req.user.role !== 'PAI') {
        throw new UnauthorizedException('Apenas o usuário principal pode ver detalhes de usuários filho.');
    }
    return this.authService.findChildById(paiId, childId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('children/:id/permissions')
  updateChildPermissions(
    @Request() req,
    @Param('id', ParseIntPipe) childId: number,
    @Body() updatePermissionsDto: UpdatePermissionsDto,
  ) {
    const paiId = req.user.id;
    if (req.user.role !== 'PAI') {
        throw new UnauthorizedException('Apenas o usuário principal pode modificar permissões.');
    }
    return this.authService.updateChildPermissions(paiId, childId, updatePermissionsDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('children/:id')
  updateChildUser(
    @Request() req,
    @Param('id', ParseIntPipe) childId: number,
    @Body() updateChildUserDto: UpdateChildUserDto,
  ) {
    const paiId = req.user.id;
    if (req.user.role !== 'PAI') {
        throw new UnauthorizedException('Apenas o usuário principal pode editar usuários filho.');
    }
    return this.authService.updateChildUser(paiId, childId, updateChildUserDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('children/:id')
  deleteChildUser(
    @Request() req,
    @Param('id', ParseIntPipe) childId: number,
  ) {
    const paiId = req.user.id;
    if (req.user.role !== 'PAI') {
        throw new UnauthorizedException('Apenas o usuário principal pode deletar usuários filho.');
    }
    return this.authService.deleteChildUser(paiId, childId);
  }

  // --- NOVO ENDPOINT DE ATUALIZAÇÃO DE TOKEN PÓS-PAGAMENTO ---
  @UseGuards(AuthGuard('jwt'))
  @Post('refresh-token')
  async refreshToken(@Request() req) {
    const userId = req.user.id;
    // Não precisa de DTO, apenas o ID do usuário do token atual
    return this.authService.refreshToken(userId);
  }
}