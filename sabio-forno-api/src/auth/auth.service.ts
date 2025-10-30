// Local: sabio-forno-api/src/auth/auth.service.ts

import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
// CORREÇÃO: Importa os Enums 'Prisma', 'UserRole' e 'SubscriptionStatus'
import { Prisma, UserRole, SubscriptionStatus } from '@prisma/client';
import { CreateChildUserDto } from './dto/create-child-user.dto';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';
import { UpdateChildUserDto } from './dto/update-child-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, name, companyName } = registerDto;
    const userExists = await this.prisma.user.findUnique({ where: { email } });
    if (userExists) {
      throw new ConflictException('Este email já está em uso.');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const newUser = await this.prisma.$transaction(async (prisma) => {
        const organization = await prisma.organization.create({
          data: {
            name: companyName,
            planType: 'Pro',
            unidadeLimit: 1,
            subscriptionStatus: SubscriptionStatus.INCOMPLETE, // Usa o Enum
          },
        });
        await prisma.unidade.create({ data: { name: 'Unidade Principal', organizationId: organization.id } });
        const user = await prisma.user.create({
          data: {
            email, password: hashedPassword, name, companyName,
            role: UserRole.PAI, organizationId: organization.id,
            allowedPages: ['dashboard', 'caixa', 'insumos', 'receitas', 'custos', 'custos-operacionais', 'conta', 'planos'],
          },
        });
        return user;
      });
      const { password: _, ...userWithoutPassword } = newUser;
      return userWithoutPassword;
    } catch (error) {
      console.error('Prisma Error during registration:', error);
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Login ou senha inválidos.');
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id: user.organizationId },
    });
    if (!organization) {
      throw new InternalServerErrorException('Organização do usuário não encontrada.');
    }

    let unidadesDaOrg = await this.prisma.unidade.findMany({
      where: { organizationId: user.organizationId },
      select: { id: true, name: true },
    });
    
    let unidadesPermitidas = unidadesDaOrg;
    let allowedPages: string[] = ['dashboard', 'caixa', 'insumos', 'receitas', 'custos', 'custos-operacionais', 'conta', 'planos'];

    if (user.role === UserRole.FILHO) {
      const userWithPermissions = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: { unidadesPermitidas: { select: { id: true, name: true } } },
      });
      unidadesPermitidas = userWithPermissions?.unidadesPermitidas || [];
      allowedPages = userWithPermissions?.allowedPages || ['caixa'];
    }

    const payload = {
      sub: user.id, email: user.email, username: user.username, name: user.name,
      companyName: user.companyName, role: user.role, orgId: user.organizationId,
      unidades: unidadesDaOrg, unidadesPermitidas: unidadesPermitidas,
      allowedPages: allowedPages,
      subscriptionStatus: organization.subscriptionStatus,
      unidadeLimit: organization.unidadeLimit,
      planType: organization.planType,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  private async validateUser(loginIdentifier: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: loginIdentifier }, { username: loginIdentifier }] },
    });
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async createChildUser(paiId: number, createChildUserDto: CreateChildUserDto) {
    const { username, password, name } = createChildUserDto;
    const pai = await this.prisma.user.findUnique({ where: { id: paiId } });
    if (!pai) { throw new NotFoundException('Usuário pai não encontrado.'); }
    const usernameExists = await this.prisma.user.findUnique({ where: { username } });
    if (usernameExists) { throw new ConflictException('Este nome de usuário já está em uso.'); }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newChild = await this.prisma.user.create({
      data: {
        username, password: hashedPassword, name, role: UserRole.FILHO,
        organizationId: pai.organizationId, paiId: paiId,
        allowedPages: ['caixa'],
      },
    });
    const { password: _, ...result } = newChild;
    return result;
  }

  async findChildren(paiId: number) {
    return this.prisma.user.findMany({
      where: { paiId: paiId, role: UserRole.FILHO },
      select: { id: true, username: true, name: true, createdAt: true },
    });
  }

  async findChildById(paiId: number, childId: number) {
    const child = await this.prisma.user.findFirst({
      where: {
        id: childId,
        paiId: paiId,
        role: UserRole.FILHO,
      },
      select: {
        id: true,
        username: true,
        name: true,
        createdAt: true,
        unidadesPermitidas: { select: { id: true, name: true } },
        allowedPages: true,
      },
    });
    if (!child) {
      throw new NotFoundException('Usuário filho não encontrado ou não pertence a você.');
    }
    return child;
  }

  async updateChildPermissions(
    paiId: number,
    childId: number,
    updatePermissionsDto: UpdatePermissionsDto,
  ) {
    const child = await this.prisma.user.findFirst({
      where: { id: childId, paiId: paiId, role: UserRole.FILHO },
    });
    if (!child) {
      throw new UnauthorizedException('Usuário filho não encontrado ou não pertence a você.');
    }
    const unidadesConnectData = updatePermissionsDto.unidadeIds
      ? updatePermissionsDto.unidadeIds.map(id => ({ id }))
      : [];
      
    await this.prisma.user.update({
      where: { id: childId },
      data: {
        unidadesPermitidas: { set: unidadesConnectData },
        allowedPages: updatePermissionsDto.allowedPages || ['caixa'],
      },
    });
    return this.findChildById(paiId, childId);
  }

  async updateChildUser(
    paiId: number,
    childId: number,
    updateChildUserDto: UpdateChildUserDto,
  ) {
    const child = await this.prisma.user.findFirst({
      where: { id: childId, paiId: paiId, role: UserRole.FILHO },
    });
    if (!child) {
      throw new UnauthorizedException('Usuário filho não encontrado ou não pertence a você.');
    }
    const dataToUpdate: Prisma.UserUpdateInput = {
      name: updateChildUserDto.name,
    };
    if (updateChildUserDto.password) {
      dataToUpdate.password = await bcrypt.hash(updateChildUserDto.password, 10);
    }
    const updatedChild = await this.prisma.user.update({
      where: { id: childId },
      data: dataToUpdate,
    });
    const { password: _, ...result } = updatedChild;
    return result;
  }

  async deleteChildUser(paiId: number, childId: number) {
    const child = await this.prisma.user.findFirst({
      where: { id: childId, paiId: paiId, role: UserRole.FILHO },
    });
    if (!child) {
      throw new UnauthorizedException('Usuário filho não encontrado ou não pertence a você.');
    }
    await this.prisma.user.delete({
      where: { id: childId },
    });
    return { message: 'Usuário filho deletado com sucesso.' };
  }

  // --- FUNÇÃO "TROCador de Token" ---
  async refreshTokenByStripeSession(userId: number, sessionId: string) {
    if (!sessionId) {
      throw new UnauthorizedException('ID da Sessão não fornecido.');
    }
    
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user || !user.organization) {
      throw new InternalServerErrorException('Usuário ou Organização não encontrados.');
    }

    // CORREÇÃO: Usa o Enum importado
    if (user.organization.subscriptionStatus !== SubscriptionStatus.ACTIVE) {
      // Se o webhook ainda não atualizou, retorna um erro
      throw new NotFoundException('Assinatura ainda não está ativa. Aguardando confirmação do pagamento.');
    }

    // O pagamento está ATIVO! Geramos um novo token.
    // (A lógica de 'login' pode ser chamada aqui para evitar repetição)
    
    // Por simplicidade, vamos repetir a lógica do payload do login:
    const unidadesDaOrg = await this.prisma.unidade.findMany({
      where: { organizationId: user.organizationId },
      select: { id: true, name: true },
    });
    
    let unidadesPermitidas = unidadesDaOrg;
    let allowedPages: string[] = ['dashboard', 'caixa', 'insumos', 'receitas', 'custos', 'custos-operacionais', 'conta', 'planos'];

    if (user.role === UserRole.FILHO) {
       const userWithPermissions = await this.prisma.user.findUnique({
           where: { id: user.id },
           include: { unidadesPermitidas: { select: { id: true, name: true } } }
       });
       unidadesPermitidas = userWithPermissions?.unidadesPermitidas || [];
       allowedPages = userWithPermissions?.allowedPages || ['caixa'];
    }

    const payload = {
      sub: user.id, email: user.email, username: user.username, name: user.name,
      companyName: user.companyName, role: user.role, orgId: user.organizationId,
      unidades: unidadesDaOrg, unidadesPermitidas: unidadesPermitidas,
      allowedPages: allowedPages,
      subscriptionStatus: user.organization.subscriptionStatus, // Agora 'ACTIVE'
      unidadeLimit: user.organization.unidadeLimit,
      planType: user.organization.planType,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}