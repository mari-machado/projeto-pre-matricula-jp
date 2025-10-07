-- DropForeignKey
ALTER TABLE "public"."responsaveis" DROP CONSTRAINT "responsaveis_endereco_id_fkey";

-- AlterTable
ALTER TABLE "responsaveis" ADD COLUMN     "etapa_atual" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "endereco_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "responsaveis" ADD CONSTRAINT "responsaveis_endereco_id_fkey" FOREIGN KEY ("endereco_id") REFERENCES "enderecos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
