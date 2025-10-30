-- CreateTable
CREATE TABLE "Insumo" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "unidade_compra" TEXT NOT NULL,
    "valor_unidade_compra" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "Insumo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receita" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "rendimento_porcoes" INTEGER NOT NULL,
    "lucro_desejado" DECIMAL(65,30) NOT NULL,
    "valor_praticado" DECIMAL(65,30),

    CONSTRAINT "Receita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceitaInsumo" (
    "id" SERIAL NOT NULL,
    "quantidade_usada" DECIMAL(65,30) NOT NULL,
    "medida_usada" TEXT NOT NULL,
    "receitaId" INTEGER NOT NULL,
    "insumoId" INTEGER NOT NULL,

    CONSTRAINT "ReceitaInsumo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ReceitaInsumo" ADD CONSTRAINT "ReceitaInsumo_receitaId_fkey" FOREIGN KEY ("receitaId") REFERENCES "Receita"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceitaInsumo" ADD CONSTRAINT "ReceitaInsumo_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "Insumo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
