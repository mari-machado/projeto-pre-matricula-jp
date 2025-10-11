-- AlterTable
ALTER TABLE "matriculas" ADD COLUMN     "pend_resp2_dados" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pend_resp2_endereco" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "segundo_responsavel_id" TEXT,
ADD COLUMN     "tem_segundo_responsavel" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "matriculas_segundo_responsavel_id_idx" ON "matriculas"("segundo_responsavel_id");

-- AddForeignKey
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_segundo_responsavel_id_fkey" FOREIGN KEY ("segundo_responsavel_id") REFERENCES "responsaveis"("id") ON DELETE SET NULL ON UPDATE CASCADE;
