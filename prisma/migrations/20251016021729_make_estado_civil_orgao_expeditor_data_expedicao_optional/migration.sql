-- AlterTable
ALTER TABLE "alunos" ALTER COLUMN "estado_civil" DROP NOT NULL;

-- AlterTable
ALTER TABLE "responsaveis" ALTER COLUMN "estado_civil" DROP NOT NULL,
ALTER COLUMN "dataExpedicao" DROP NOT NULL,
ALTER COLUMN "orgaoExpeditor" DROP NOT NULL;
