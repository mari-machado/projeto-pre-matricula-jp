/*
  Warnings:

  - A unique constraint covering the columns `[rg,usuario_id]` on the table `responsaveis` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cpf,usuario_id]` on the table `responsaveis` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email,usuario_id]` on the table `responsaveis` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `usuario_id` to the `responsaveis` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."responsaveis_cpf_key";

-- DropIndex
DROP INDEX "public"."responsaveis_email_key";

-- DropIndex
DROP INDEX "public"."responsaveis_rg_key";

-- AlterTable
ALTER TABLE "responsaveis" ADD COLUMN     "usuario_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "responsaveis_rg_usuario_id_key" ON "responsaveis"("rg", "usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "responsaveis_cpf_usuario_id_key" ON "responsaveis"("cpf", "usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "responsaveis_email_usuario_id_key" ON "responsaveis"("email", "usuario_id");

-- AddForeignKey
ALTER TABLE "responsaveis" ADD CONSTRAINT "responsaveis_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
