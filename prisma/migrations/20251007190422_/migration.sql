/*
  Warnings:

  - The values [TRANSGÊNERO,NEUTRO,NAO_BINARIO] on the enum `Genero` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Genero_new" AS ENUM ('MASCULINO', 'FEMININO');
ALTER TABLE "responsaveis" ALTER COLUMN "genero" TYPE "Genero_new" USING ("genero"::text::"Genero_new");
ALTER TABLE "alunos" ALTER COLUMN "genero" TYPE "Genero_new" USING ("genero"::text::"Genero_new");
ALTER TYPE "Genero" RENAME TO "Genero_old";
ALTER TYPE "Genero_new" RENAME TO "Genero";
DROP TYPE "public"."Genero_old";
COMMIT;

-- AlterTable
ALTER TABLE "alunos" ADD COLUMN     "segundo_responsavel_id" TEXT;

-- AlterTable
ALTER TABLE "responsaveis" ADD COLUMN     "financeiro" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "alunos" ADD CONSTRAINT "alunos_segundo_responsavel_id_fkey" FOREIGN KEY ("segundo_responsavel_id") REFERENCES "responsaveis"("id") ON DELETE SET NULL ON UPDATE CASCADE;
