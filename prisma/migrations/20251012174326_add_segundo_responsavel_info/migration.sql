/*
  Warnings:

  - You are about to alter the column `segundo_responsavel_celular` on the `matriculas` table. The data in that column could be lost. The data in that column will be cast from `VarChar(20)` to `VarChar(15)`.

*/
-- AlterTable
ALTER TABLE "matriculas" ADD COLUMN     "segundo_responsavel_nome" VARCHAR(255),
ALTER COLUMN "segundo_responsavel_celular" SET DATA TYPE VARCHAR(15);
