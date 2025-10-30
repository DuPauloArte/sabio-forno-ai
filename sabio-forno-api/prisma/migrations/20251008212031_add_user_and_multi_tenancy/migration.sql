/*
  Warnings:

  - A unique constraint covering the columns `[userId,nome]` on the table `CustoFixo` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,data]` on the table `FechamentoCaixa` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `CustoFixo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `FechamentoCaixa` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Insumo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Receita` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."CustoMensal" DROP CONSTRAINT "CustoMensal_custoFixoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Pagamento" DROP CONSTRAINT "Pagamento_fechamentoCaixaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ReceitaInsumo" DROP CONSTRAINT "ReceitaInsumo_insumoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ReceitaInsumo" DROP CONSTRAINT "ReceitaInsumo_receitaId_fkey";

-- DropIndex
DROP INDEX "public"."CustoFixo_nome_key";

-- DropIndex
DROP INDEX "public"."FechamentoCaixa_data_key";

-- AlterTable
ALTER TABLE "CustoFixo" ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "FechamentoCaixa" ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Insumo" ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Receita" ADD COLUMN     "userId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CustoFixo_userId_nome_key" ON "CustoFixo"("userId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "FechamentoCaixa_userId_data_key" ON "FechamentoCaixa"("userId", "data");

-- AddForeignKey
ALTER TABLE "Insumo" ADD CONSTRAINT "Insumo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receita" ADD CONSTRAINT "Receita_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceitaInsumo" ADD CONSTRAINT "ReceitaInsumo_receitaId_fkey" FOREIGN KEY ("receitaId") REFERENCES "Receita"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceitaInsumo" ADD CONSTRAINT "ReceitaInsumo_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "Insumo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustoFixo" ADD CONSTRAINT "CustoFixo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustoMensal" ADD CONSTRAINT "CustoMensal_custoFixoId_fkey" FOREIGN KEY ("custoFixoId") REFERENCES "CustoFixo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FechamentoCaixa" ADD CONSTRAINT "FechamentoCaixa_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_fechamentoCaixaId_fkey" FOREIGN KEY ("fechamentoCaixaId") REFERENCES "FechamentoCaixa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
