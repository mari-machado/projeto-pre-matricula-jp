-- AlterTable
ALTER TABLE "matriculas" ADD COLUMN     "aluno_cpf" VARCHAR(14),
ADD COLUMN     "aluno_data_nascimento" DATE,
ADD COLUMN     "aluno_genero" "Genero",
ADD COLUMN     "aluno_nome" VARCHAR(255),
ADD COLUMN     "completo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "etapa_atual" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "pend_end_aluno" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "responsavel_cpf" VARCHAR(14),
ADD COLUMN     "responsavel_email" VARCHAR(255),
ADD COLUMN     "responsavel_nome" VARCHAR(255);
