import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { InsumosModule } from './insumos/insumos.module';
import { ReceitasModule } from './receitas/receitas.module';
import { CaixaModule } from './caixa/caixa.module';
import { PagamentosModule } from './pagamentos/pagamentos.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuthModule } from './auth/auth.module';
import { UnidadesModule } from './unidades/unidades.module';
import { DespesasModule } from './despesas/despesas.module';
import { BillingModule } from './billing/billing.module';


@Module({
  imports: [PrismaModule, InsumosModule, ReceitasModule, CaixaModule, PagamentosModule, DashboardModule, AuthModule, UnidadesModule, DespesasModule, BillingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
