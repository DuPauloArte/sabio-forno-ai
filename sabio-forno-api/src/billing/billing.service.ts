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
      apiVersion: '2025-09-30.clover', // Sua versão de API especificada
    });
  }

  // --- FUNÇÃO QUE FALTAVA (Erro 1) ---
  /**
   * Mapeia nosso nome de plano para o limite de unidades.
   */
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

  /**
   * Mapeia nossos nomes de planos para os Price IDs do Stripe.
   */
  private getStripePriceId(planType: 'Pro' | 'Elite' | 'Master'): string {
    const priceMap = {
      Pro: process.env.STRIPE_PRO_PRICE_ID || 'price_1SNL3DKAru1nTE6YrB75mFZV',
      Elite: process.env.STRIPE_ELITE_PRICE_ID || 'price_1SNL4CKAru1nTE6Ygwhb0kFz',
      Master: process.env.STRIPE_MASTER_PRICE_ID || 'price_1SNL5mKAru1nTE6YvbzIJLR6',
    };
    if (!priceMap[planType] || !priceMap[planType].startsWith('price_')) {
      throw new InternalServerErrorException(
        `Price ID do plano "${planType}" não configurado ou é inválido.`
      );
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
        metadata: { orgId: organization.id.toString() },
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
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        orgId: orgId.toString(),
        planType: planType,
      },
      subscription_data: {
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'cancel',
          },
        },
      },
      payment_method_collection: 'if_required',
    });

    if (!session.url) {
      throw new InternalServerErrorException('Erro ao criar sessão de checkout do Stripe.');
    }
    return { url: session.url };
  }

  /**
   * Processa eventos recebidos do Stripe (Webhooks).
   */
  async handleWebhookEvent(buffer: Buffer, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new InternalServerErrorException('Segredo do Webhook do Stripe não configurado.');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(buffer, signature, webhookSecret);
    } catch (err) {
      console.error(`Erro ao verificar a assinatura do webhook: ${err.message}`);
      throw new InternalServerErrorException(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      if (!session.subscription) {
          throw new InternalServerErrorException('ID da Assinatura não encontrado no checkout.');
      }
      
      // --- CORREÇÃO DE TIPO (Erro 2) ---
      // Forçamos o tipo para Stripe.Subscription, que é o que a API retorna
      const subscription = await this.stripe.subscriptions.retrieve(
        session.subscription as string
      ) as Stripe.Subscription; // Tipagem explícita

      const orgId = session.metadata?.orgId;
      const planType = session.metadata?.planType;
      const stripeCustomerId = session.customer as string;

      if (!orgId || !planType || !stripeCustomerId) {
        throw new InternalServerErrorException('Metadados essenciais faltando no evento de checkout.');
      }

      // --- Este é o bloco que você me enviou ---
      await this.prisma.organization.update({
  where: { id: parseInt(orgId) },
  data: {
    stripeCustomerId: stripeCustomerId,
    subscriptionId: subscription.id,
    planType: planType,
    unidadeLimit: this.getPlanLimit(planType),
    subscriptionStatus: SubscriptionStatus.ACTIVE,
    currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
  },
});
    }

    if (event.type === 'customer.subscription.updated') {
        const subscription = event.data.object as Stripe.Subscription;
        if (subscription.status === 'past_due' || subscription.status === 'canceled') {
            const org = await this.prisma.organization.findFirst({
                where: { subscriptionId: subscription.id }
            });
            if (org) {
                await this.prisma.organization.update({
                    where: { id: org.id },
                    data: {
                        subscriptionStatus: subscription.status === 'past_due' ? SubscriptionStatus.PAST_DUE : SubscriptionStatus.CANCELED
                    }
                });
            }
        }
    }

    return { received: true };
  }
}