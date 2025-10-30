// Local: sabio-forno-api/src/auth/jwt.strategy.ts

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  /**
   * Esta função é chamada automaticamente pelo NestJS após validar a assinatura do token.
   * O 'payload' é o conteúdo decodificado do token que nós criamos no login.
   * O que for retornado aqui será anexado ao objeto 'request' como 'req.user'.
   */
  // Local: src/auth/jwt.strategy.ts

  async validate(payload: any) {
    return {
      id: payload.sub,
      email: payload.email,
      username: payload.username,
      name: payload.name,
      companyName: payload.companyName,
      role: payload.role,
      orgId: payload.orgId,
      unidadesPermitidas: payload.unidadesPermitidas || [],
      allowedPages: payload.allowedPages || ['caixa'],

      // --- NOVOS CAMPOS DE ASSINATURA ---
      subscriptionStatus: payload.subscriptionStatus,
      unidadeLimit: payload.unidadeLimit,
      planType: payload.planType,
    };
  }
}