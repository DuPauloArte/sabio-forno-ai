-- CreateEnum
CREATE TYPE "StatusPagamento" AS ENUM ('PENDENTE', 'PAGO');

-- CreateTable
CREATE TABLE "CustoFixo" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "valorPadrao" DECIMAL(65,30),
    "diaVencimentoPadrao" INTEGER,

    CONSTRAINT "CustoFixo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustoMensal" (
    "id" SERIAL NOT NULL,
    "mes" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "valor" DECIMAL(65,30) NOT NULL,
    "status" "StatusPagamento" NOT NULL DEFAULT 'PENDENTE',
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "custoFixoId" INTEGER NOT NULL,

    CONSTRAINT "CustoMensal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FechamentoCaixa" (
    "id" SERIAL NOT NULL,
    "data" DATE NOT NULL,
    "vendasDinheiro" DECIMAL(65,30),
    "vendasCartao" DECIMAL(65,30),
    "despesasGerais" DECIMAL(65,30),
    "trocoDiaSeguinte" DECIMAL(65,30),

    CONSTRAINT "FechamentoCaixa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pagamento" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(65,30) NOT NULL,
    "data" DATE NOT NULL,
    "fechamentoCaixaId" INTEGER NOT NULL,
    "custoMensalId" INTEGER,

    CONSTRAINT "Pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustoFixo_nome_key" ON "CustoFixo"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "CustoMensal_custoFixoId_mes_ano_key" ON "CustoMensal"("custoFixoId", "mes", "ano");

-- CreateIndex
CREATE UNIQUE INDEX "FechamentoCaixa_data_key" ON "FechamentoCaixa"("data");

-- CreateIndex
CREATE UNIQUE INDEX "Pagamento_custoMensalId_key" ON "Pagamento"("custoMensalId");

-- AddForeignKey
ALTER TABLE "CustoMensal" ADD CONSTRAINT "CustoMensal_custoFixoId_fkey" FOREIGN KEY ("custoFixoId") REFERENCES "CustoFixo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_fechamentoCaixaId_fkey" FOREIGN KEY ("fechamentoCaixaId") REFERENCES "FechamentoCaixa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_custoMensalId_fkey" FOREIGN KEY ("custoMensalId") REFERENCES "CustoMensal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
