/*
  Warnings:

  - You are about to drop the column `userId` on the `CustoFixo` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `FechamentoCaixa` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Insumo` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Receita` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[unidadeId,nome]` on the table `CustoFixo` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[unidadeId,data]` on the table `FechamentoCaixa` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `unidadeId` to the `CustoFixo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unidadeId` to the `FechamentoCaixa` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unidadeId` to the `Insumo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unidadeId` to the `Receita` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."CustoFixo" DROP CONSTRAINT "CustoFixo_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FechamentoCaixa" DROP CONSTRAINT "FechamentoCaixa_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Insumo" DROP CONSTRAINT "Insumo_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Receita" DROP CONSTRAINT "Receita_userId_fkey";

-- DropIndex
DROP INDEX "public"."CustoFixo_userId_nome_key";

-- DropIndex
DROP INDEX "public"."FechamentoCaixa_userId_data_key";

-- AlterTable
ALTER TABLE "CustoFixo" DROP COLUMN "userId",
ADD COLUMN     "unidadeId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "FechamentoCaixa" DROP COLUMN "userId",
ADD COLUMN     "unidadeId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Insumo" DROP COLUMN "userId",
ADD COLUMN     "unidadeId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Receita" DROP COLUMN "userId",
ADD COLUMN     "unidadeId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "organizationId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Organization" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unidade" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "organizationId" INTEGER NOT NULL,

    CONSTRAINT "Unidade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustoFixo_unidadeId_nome_key" ON "CustoFixo"("unidadeId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "FechamentoCaixa_unidadeId_data_key" ON "FechamentoCaixa"("unidadeId", "data");

-- AddForeignKey
ALTER TABLE "Unidade" ADD CONSTRAINT "Unidade_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insumo" ADD CONSTRAINT "Insumo_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receita" ADD CONSTRAINT "Receita_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustoFixo" ADD CONSTRAINT "CustoFixo_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FechamentoCaixa" ADD CONSTRAINT "FechamentoCaixa_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
