/*
  Warnings:

  - You are about to drop the column `endereco_id` on the `alunos` table. All the data in the column will be lost.
  - You are about to drop the column `passaporte` on the `alunos` table. All the data in the column will be lost.
  - You are about to drop the column `contato_whatsapp` on the `responsaveis` table. All the data in the column will be lost.
  - You are about to drop the column `nacionalidade` on the `responsaveis` table. All the data in the column will be lost.
  - You are about to drop the column `naturalidade` on the `responsaveis` table. All the data in the column will be lost.
  - You are about to drop the column `profissao` on the `responsaveis` table. All the data in the column will be lost.
  - Added the required column `celular` to the `alunos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cidade` to the `alunos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `alunos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estado_civil` to the `alunos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `telefone` to the `alunos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `whatsapp` to the `alunos` table without a default value. This is not possible if the table is not empty.
  - Made the column `cpf` on table `alunos` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `dataExpedicao` to the `responsaveis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orgaoExpeditor` to the `responsaveis` table without a default value. This is not possible if the table is not empty.
  - Made the column `endereco_id` on table `responsaveis` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."alunos" DROP CONSTRAINT "alunos_endereco_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."responsaveis" DROP CONSTRAINT "responsaveis_endereco_id_fkey";

-- AlterTable with defaults to avoid NULL violations on existing rows
ALTER TABLE "alunos" DROP COLUMN "endereco_id",
DROP COLUMN "passaporte",
ADD COLUMN     "bairro" VARCHAR(100),
ADD COLUMN     "celular" VARCHAR(15) NOT NULL DEFAULT 'PENDENTE',
ADD COLUMN     "cep" VARCHAR(9),
ADD COLUMN     "cidade" VARCHAR(100) NOT NULL DEFAULT 'PENDENTE',
ADD COLUMN     "complemento" VARCHAR(100),
ADD COLUMN     "email" VARCHAR(255) NOT NULL DEFAULT 'aluno@temp.local',
ADD COLUMN     "estado_civil" "EstadoCivil" NOT NULL DEFAULT 'SOLTEIRO',
ADD COLUMN     "numero" VARCHAR(10),
ADD COLUMN     "rua" VARCHAR(255),
ADD COLUMN     "telefone" VARCHAR(15) NOT NULL DEFAULT 'PENDENTE',
ADD COLUMN     "uf" "UF",
ADD COLUMN     "whatsapp" VARCHAR(15) NOT NULL DEFAULT 'PENDENTE';

-- Backfill CPF to avoid NOT NULL violation (dev-safe placeholder)
UPDATE "alunos" SET "cpf" = '000.000.000-00' WHERE "cpf" IS NULL;

ALTER TABLE "alunos" ALTER COLUMN "cpf" SET NOT NULL;

-- AlterTable
ALTER TABLE "enderecos" ALTER COLUMN "uf" DROP NOT NULL;

-- AlterTable responsaveis: add non-null columns with defaults
ALTER TABLE "responsaveis" DROP COLUMN "contato_whatsapp",
DROP COLUMN "nacionalidade",
DROP COLUMN "naturalidade",
DROP COLUMN "profissao",
ADD COLUMN     "dataExpedicao" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
ADD COLUMN     "orgaoExpeditor" TEXT NOT NULL DEFAULT 'N/I',
ALTER COLUMN "endereco_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "responsaveis" ADD CONSTRAINT "responsaveis_endereco_id_fkey" FOREIGN KEY ("endereco_id") REFERENCES "enderecos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
