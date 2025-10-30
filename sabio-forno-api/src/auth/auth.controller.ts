// Local: sabio-forno-api/src/auth/auth.controller.ts

import { Controller, Post, Body, Get, UseGuards, Request, Patch, Param, ParseIntPipe, UnauthorizedException, Delete } from '@nestjs/common'; // Adicione Delete
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

  // --- Rotas Protegidas (Exigem Login) ---

  // Rota para o Pai criar um Filho
  @UseGuards(AuthGuard('jwt'))
  @Post('children')
  createChildUser(@Request() req, @Body() createChildUserDto: CreateChildUserDto) {
    const paiId = req.user.id;
    // Validação básica para garantir que apenas um Pai pode criar filhos
    if (req.user.role !== 'PAI') {
        throw new UnauthorizedException('Apenas o usuário principal pode criar usuários filho.');
    }
    return this.authService.createChildUser(paiId, createChildUserDto);
  }

  // Rota para o Pai listar seus Filhos
  @UseGuards(AuthGuard('jwt'))
  @Get('children')
  getChildren(@Request() req) {
    const paiId = req.user.id;
    // Validação básica
    if (req.user.role !== 'PAI') {
        throw new UnauthorizedException('Apenas o usuário principal pode listar usuários filho.');
    }
    return this.authService.findChildren(paiId);
  }

  // --- NOVO ENDPOINT PARA BUSCAR DETALHES DE UM FILHO ---
  @UseGuards(AuthGuard('jwt'))
  @Get('children/:id')
  getChildById(@Request() req, @Param('id', ParseIntPipe) childId: number) {
    const paiId = req.user.id;
    // Validação básica
    if (req.user.role !== 'PAI') {
        throw new UnauthorizedException('Apenas o usuário principal pode ver detalhes de usuários filho.');
    }
    return this.authService.findChildById(paiId, childId);
  }

  // Rota para o Pai atualizar as permissões de um Filho
  @UseGuards(AuthGuard('jwt'))
  @Patch('children/:id/permissions')
  updateChildPermissions(
    @Request() req,
    @Param('id', ParseIntPipe) childId: number,
    @Body() updatePermissionsDto: UpdatePermissionsDto,
  ) {
    const paiId = req.user.id;
    // Validação básica
    if (req.user.role !== 'PAI') {
        throw new UnauthorizedException('Apenas o usuário principal pode modificar permissões.');
    }
    return this.authService.updateChildPermissions(paiId, childId, updatePermissionsDto);
  }

  // --- NOVO ENDPOINT PARA DELETAR USUÁRIO FILHO ---
  @UseGuards(AuthGuard('jwt'))
  @Delete('children/:id')
  deleteChildUser(
    @Request() req,
    @Param('id', ParseIntPipe) childId: number,
  ) {
    const paiId = req.user.id;
    // Validação básica
    if (req.user.role !== 'PAI') {
        throw new UnauthorizedException('Apenas o usuário principal pode deletar usuários filho.');
    }
    return this.authService.deleteChildUser(paiId, childId);
  }

  // --- NOVO ENDPOINT DE ATUALIZAÇÃO DE TOKEN ---
  @UseGuards(AuthGuard('jwt'))
  @Post('refresh-token')
  async refreshToken(
    @Request() req,
    @Body('sessionId') sessionId: string, // Pega o 'sessionId' do corpo
  ) {
    const userId = req.user.id;
    return this.authService.refreshTokenByStripeSession(userId, sessionId);
  }

  // --- NOVO ENDPOINT PARA ATUALIZAR USUÁRIO FILHO ---
  @UseGuards(AuthGuard('jwt'))
  @Patch('children/:id')
  updateChildUser(
    @Request() req,
    @Param('id', ParseIntPipe) childId: number,
    @Body() updateChildUserDto: UpdateChildUserDto,
  ) {
    const paiId = req.user.id;
    // Validação básica
    if (req.user.role !== 'PAI') {
        throw new UnauthorizedException('Apenas o usuário principal pode editar usuários filho.');
    }
    return this.authService.updateChildUser(paiId, childId, updateChildUserDto);
  }
}