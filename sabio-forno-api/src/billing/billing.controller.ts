// Local: sabio-forno-api/src/billing/billing.controller.ts

import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  RawBody,
  InternalServerErrorException, // <-- 1. CORREÇÃO: Importado aqui
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common'; // <-- 2. CORREÇÃO: Importado como tipo
import { BillingService } from './billing.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import type { Request as ExpressRequest } from 'express'; // <-- 3. CORREÇÃO: Importado como tipo

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  /**
   * Endpoint protegido para usuários criarem uma sessão de checkout.
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('create-checkout-session')
  async createCheckoutSession(
    @Request() req,
    @Body() createCheckoutDto: CreateCheckoutDto,
  ) {
    const user = req.user;
    return this.billingService.createCheckoutSession(
      user,
      createCheckoutDto.planType,
    );
  }

  /**
   * Endpoint público que o Stripe usará para nos enviar eventos.
   */
  @Post('webhook')
  async handleStripeWebhook(
    @Request() req: RawBodyRequest<ExpressRequest>, // <-- 4. CORREÇÃO: Usa os tipos importados
  ) {
    const signature = req.headers['stripe-signature'];
    const rawBody = req.rawBody;

    if (!signature) {
      throw new InternalServerErrorException(
        'Cabeçalho Stripe-Signature faltando.',
      );
    }

    // --- CORREÇÃO AQUI ---
    // Verificação 2: Garante que o cabeçalho é uma string única, e não um array
    if (Array.isArray(signature)) {
      throw new InternalServerErrorException(
        'Cabeçalho Stripe-Signature inválido (formato de array).',
      );
    }
    

    if (!rawBody) {
      throw new InternalServerErrorException(
        'Corpo da requisição (rawBody) faltando.',
      );
    }

    return this.billingService.handleWebhookEvent(rawBody, signature);
  }
}