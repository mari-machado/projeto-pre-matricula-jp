-- AlterTable
ALTER TABLE "matriculas" ADD COLUMN     "sponte_aluno_id" INTEGER;

-- CreateIndex
CREATE INDEX "matriculas_sponte_aluno_id_idx" ON "matriculas"("sponte_aluno_id");
