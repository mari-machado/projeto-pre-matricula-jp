/*
  Warnings:

  - You are about to drop the column `segundo_responsavel_id` on the `alunos` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "MatriculaStatus" AS ENUM ('PENDENTE', 'INTEGRADA', 'CANCELADA');

-- DropForeignKey
ALTER TABLE "public"."alunos" DROP CONSTRAINT "alunos_segundo_responsavel_id_fkey";

-- AlterTable
ALTER TABLE "alunos" DROP COLUMN "segundo_responsavel_id";

-- CreateTable
CREATE TABLE "matriculas" (
    "id" TEXT NOT NULL,
    "codigo" VARCHAR(30) NOT NULL,
    "aluno_id" TEXT NOT NULL,
    "responsavel_id" TEXT NOT NULL,
    "status" "MatriculaStatus" NOT NULL DEFAULT 'PENDENTE',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matriculas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "matriculas_codigo_key" ON "matriculas"("codigo");

-- CreateIndex
CREATE INDEX "matriculas_aluno_id_idx" ON "matriculas"("aluno_id");

-- CreateIndex
CREATE INDEX "matriculas_responsavel_id_idx" ON "matriculas"("responsavel_id");

-- AddForeignKey
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "responsaveis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
