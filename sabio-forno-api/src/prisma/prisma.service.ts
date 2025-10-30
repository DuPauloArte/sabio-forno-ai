// sabio-forno-api/src/prisma/prisma.service.ts

import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  // --- MODIFICAÇÃO AQUI ---
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'], // Habilita o log de todas as queries
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}