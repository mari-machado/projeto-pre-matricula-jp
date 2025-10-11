-- AlterTable
ALTER TABLE "matriculas" ADD COLUMN     "usuario_id" TEXT;

-- CreateIndex
CREATE INDEX "matriculas_usuario_id_idx" ON "matriculas"("usuario_id");

-- AddForeignKey
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
