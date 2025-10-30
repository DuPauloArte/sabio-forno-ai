/*
  Warnings:

  - You are about to drop the column `despesasGerais` on the `FechamentoCaixa` table. All the data in the column will be lost.
  - You are about to drop the column `custoMensalId` on the `Pagamento` table. All the data in the column will be lost.
  - You are about to drop the `CustoFixo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CustoMensal` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PAI', 'FILHO');

-- DropForeignKey
ALTER TABLE "public"."CustoFixo" DROP CONSTRAINT "CustoFixo_unidadeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CustoMensal" DROP CONSTRAINT "CustoMensal_custoFixoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Pagamento" DROP CONSTRAINT "Pagamento_custoMensalId_fkey";

-- DropIndex
DROP INDEX "public"."Pagamento_custoMensalId_key";

-- AlterTable
ALTER TABLE "FechamentoCaixa" DROP COLUMN "despesasGerais";

-- AlterTable
ALTER TABLE "Pagamento" DROP COLUMN "custoMensalId";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "paiId" INTEGER,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'PAI',
ADD COLUMN     "username" TEXT,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "companyName" DROP NOT NULL;

-- DropTable
DROP TABLE "public"."CustoFixo";

-- DropTable
DROP TABLE "public"."CustoMensal";

-- CreateTable
CREATE TABLE "CustoRegistrado" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "valor" DECIMAL(65,30) NOT NULL,
    "status" "StatusPagamento" NOT NULL DEFAULT 'PAGO',
    "dataPagamento" DATE NOT NULL,
    "unidadeId" INTEGER NOT NULL,

    CONSTRAINT "CustoRegistrado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DespesaDiaria" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(65,30) NOT NULL,
    "fechamentoCaixaId" INTEGER NOT NULL,

    CONSTRAINT "DespesaDiaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UnidadesPermitidas" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UnidadesPermitidas_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_UnidadesPermitidas_B_index" ON "_UnidadesPermitidas"("B");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_paiId_fkey" FOREIGN KEY ("paiId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustoRegistrado" ADD CONSTRAINT "CustoRegistrado_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DespesaDiaria" ADD CONSTRAINT "DespesaDiaria_fechamentoCaixaId_fkey" FOREIGN KEY ("fechamentoCaixaId") REFERENCES "FechamentoCaixa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UnidadesPermitidas" ADD CONSTRAINT "_UnidadesPermitidas_A_fkey" FOREIGN KEY ("A") REFERENCES "Unidade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UnidadesPermitidas" ADD CONSTRAINT "_UnidadesPermitidas_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
