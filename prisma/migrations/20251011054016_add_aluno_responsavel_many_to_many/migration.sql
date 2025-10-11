-- CreateTable
CREATE TABLE "aluno_responsaveis" (
    "id" TEXT NOT NULL,
    "aluno_id" TEXT NOT NULL,
    "responsavel_id" TEXT NOT NULL,
    "tipo_parentesco" VARCHAR(50) NOT NULL,
    "responsavel_financeiro" BOOLEAN NOT NULL DEFAULT false,
    "responsavel_didatico" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aluno_responsaveis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "aluno_responsaveis_aluno_id_responsavel_id_key" ON "aluno_responsaveis"("aluno_id", "responsavel_id");

-- AddForeignKey
ALTER TABLE "aluno_responsaveis" ADD CONSTRAINT "aluno_responsaveis_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aluno_responsaveis" ADD CONSTRAINT "aluno_responsaveis_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "responsaveis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
