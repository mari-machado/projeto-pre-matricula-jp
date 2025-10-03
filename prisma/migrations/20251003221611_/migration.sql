-- CreateEnum
CREATE TYPE "Genero" AS ENUM ('MASCULINO', 'FEMININO', 'TRANSGÊNERO', 'NEUTRO', 'NAO_BINARIO');

-- CreateEnum
CREATE TYPE "EstadoCivil" AS ENUM ('SOLTEIRO', 'CASADO', 'DIVORCIADO', 'SEPARADO', 'VIUVO', 'UNIAO_ESTAVEL');

-- CreateEnum
CREATE TYPE "UF" AS ENUM ('AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO');

-- CreateTable
CREATE TABLE "enderecos" (
    "id" TEXT NOT NULL,
    "cep" VARCHAR(9) NOT NULL,
    "rua" VARCHAR(255) NOT NULL,
    "numero" VARCHAR(10) NOT NULL,
    "complemento" VARCHAR(100),
    "cidade" VARCHAR(100) NOT NULL,
    "uf" "UF" NOT NULL,
    "bairro" VARCHAR(100) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enderecos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "responsaveis" (
    "id" TEXT NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "genero" "Genero" NOT NULL,
    "data_nascimento" DATE NOT NULL,
    "profissao" VARCHAR(100) NOT NULL,
    "naturalidade" VARCHAR(100) NOT NULL,
    "estado_civil" "EstadoCivil" NOT NULL,
    "nacionalidade" VARCHAR(50) NOT NULL DEFAULT 'Brasileira',
    "rg" VARCHAR(20) NOT NULL,
    "cpf" VARCHAR(14) NOT NULL,
    "celular" VARCHAR(15) NOT NULL,
    "contato_whatsapp" VARCHAR(15),
    "email" VARCHAR(255) NOT NULL,
    "endereco_id" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "responsaveis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alunos" (
    "id" TEXT NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "genero" "Genero" NOT NULL,
    "data_nascimento" DATE NOT NULL,
    "cidade_natal" VARCHAR(100) NOT NULL,
    "passaporte" TEXT,
    "cpf" VARCHAR(14),
    "responsavel_id" TEXT NOT NULL,
    "endereco_id" TEXT,
    "mora_com_responsavel" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "alunos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "senha" VARCHAR(255) NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "ultimo_login" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "responsaveis_rg_key" ON "responsaveis"("rg");

-- CreateIndex
CREATE UNIQUE INDEX "responsaveis_cpf_key" ON "responsaveis"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "responsaveis_email_key" ON "responsaveis"("email");

-- CreateIndex
CREATE UNIQUE INDEX "alunos_cpf_key" ON "alunos"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- AddForeignKey
ALTER TABLE "responsaveis" ADD CONSTRAINT "responsaveis_endereco_id_fkey" FOREIGN KEY ("endereco_id") REFERENCES "enderecos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alunos" ADD CONSTRAINT "alunos_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "responsaveis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alunos" ADD CONSTRAINT "alunos_endereco_id_fkey" FOREIGN KEY ("endereco_id") REFERENCES "enderecos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
