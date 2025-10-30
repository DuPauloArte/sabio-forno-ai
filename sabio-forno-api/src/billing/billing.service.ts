// Local: sabio-forno-api/src/billing/billing.service.ts

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import Stripe from 'stripe';
import { SubscriptionStatus } from '@prisma/client'; // Importa nosso Enum

// Interface para os dados do usuário que virão do token JWT
interface AuthUser {
  id: number;
  email: string;
  name: string;
  orgId: number;
  role: 'PAI' | 'FILHO';
  companyName: string;
}

@Injectable()
export class BillingService {
  private stripe: Stripe;

  constructor(private readonly prisma: PrismaService) {
    const apiKey = process.env.STRIPE_API_KEY;
    if (!apiKey) {
      throw new Error('Chave secreta do Stripe (STRIPE_API_KEY) não foi definida.');
    }
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2025-09-30.clover', // Usando a sua versão especificada
    });
  }

  // Função para mapear o plano do Stripe para o limite de unidades
  private getPlanLimit(planType: string): number {
    switch (planType) {
      case 'Pro':
        return 1;
      case 'Elite':
        return 2;
      case 'Master':
        return 3;
      default:
        return 1; // Padrão de segurança
    }
  }

  // Função para IDs de Preço (você já tem)
  private getStripePriceId(planType: 'Pro' | 'Elite' | 'Master'): string {
    const priceMap = {
      Pro: 'price_1SNL3DKAru1nTE6YrB75mFZV',
      Elite: 'price_1SNL4CKAru1nTE6Ygwhb0kFz',
      Master: 'price_1SNL5mKAru1nTE6YvbzIJLR6',
    };
    if (!priceMap[planType]) {
      throw new InternalServerErrorException('Price ID do plano não configurado.');
    }
    return priceMap[planType];
  }

  /**
   * Cria uma sessão de checkout no Stripe para uma organização.
   */
  async createCheckoutSession(user: AuthUser, planType: 'Pro' | 'Elite' | 'Master') {
    const { orgId, email, name } = user;

    const organization = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!organization) {
      throw new InternalServerErrorException('Organização não encontrada.');
    }

    let stripeCustomerId = organization.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await this.stripe.customers.create({
        email: email,
        name: name,
        metadata: {
          orgId: organization.id,
        },
      });
      stripeCustomerId = customer.id;

      await this.prisma.organization.update({
        where: { id: orgId },
        data: { stripeCustomerId: stripeCustomerId },
      });
    }

    const priceId = this.getStripePriceId(planType);

    const successUrl = `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.CLIENT_URL}/payment/cancel`;

    const session = await this.stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card', 'boleto'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        orgId: orgId,
        planType: planType,
      }
    });

    if (!session.url) {
      throw new InternalServerErrorException('Erro ao criar sessão de checkout do Stripe.');
    }
    
    return { url: session.url };
  }

  async handleWebhookEvent(buffer: Buffer, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new InternalServerErrorException('Segredo do Webhook do Stripe não configurado.');
    }

    let event: Stripe.Event;

    try {
      // Constrói e verifica o evento usando a assinatura
      event = this.stripe.webhooks.constructEvent(
        buffer,
        signature,
        webhookSecret,
      );
    } catch (err) {
      console.error(`Erro ao verificar a assinatura do webhook: ${err.message}`);
      throw new InternalServerErrorException(`Webhook Error: ${err.message}`);
    }

    // Processa o evento 'checkout.session.completed'
    // Este é o evento que o Stripe envia quando um checkout (pagamento) é concluído.
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      // Pega os metadados que salvamos durante a criação da sessão
      const orgId = session.metadata?.orgId;
      const planType = session.metadata?.planType;
      const subscriptionId = session.subscription as string; // O ID da nova assinatura
      const stripeCustomerId = session.customer as string;

      if (!orgId || !planType || !subscriptionId || !stripeCustomerId) {
        throw new InternalServerErrorException('Metadados essenciais faltando no evento de checkout.');
      }

      // Atualiza a Organização no nosso banco de dados
      await this.prisma.organization.update({
        where: { id: parseInt(orgId) },
        data: {
          stripeCustomerId: stripeCustomerId,
          subscriptionId: subscriptionId,
          planType: planType,
          unidadeLimit: this.getPlanLimit(planType), // Define o limite de unidades
          subscriptionStatus: SubscriptionStatus.ACTIVE, // MARCA COMO ATIVO
          // A API do Stripe nos informa quando o período atual termina
          currentPeriodEnd: new Date(session.expires_at * 1000), // Converte de timestamp
        },
      });
    }
    
    // Outros eventos (ex: 'customer.subscription.deleted' ou 'customer.subscription.updated')
    // seriam tratados aqui para lidar com cancelamentos ou inadimplência.
    // Por enquanto, o 'completed' é o mais importante.

    return { received: true };
  }
}