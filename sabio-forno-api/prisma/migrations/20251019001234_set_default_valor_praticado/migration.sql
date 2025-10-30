/*
  Warnings:

  - Made the column `valor_praticado` on table `Receita` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Receita" ALTER COLUMN "valor_praticado" SET NOT NULL,
ALTER COLUMN "valor_praticado" SET DEFAULT 0;
