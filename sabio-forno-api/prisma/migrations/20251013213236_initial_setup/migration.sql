/*
  Warnings:

  - You are about to drop the column `unidadeId` on the `Insumo` table. All the data in the column will be lost.
  - Added the required column `organizationId` to the `Insumo` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Insumo" DROP CONSTRAINT "Insumo_unidadeId_fkey";

-- AlterTable
ALTER TABLE "Insumo" DROP COLUMN "unidadeId",
ADD COLUMN     "organizationId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Insumo" ADD CONSTRAINT "Insumo_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
