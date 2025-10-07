import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Etapa1ResponsavelDto } from "./dto/etapa1-responsavel.dto";
import { Etapa2EnderecoDto } from "./dto/etapa2-endereco.dto";
import { Etapa3AlunoDto } from "./dto/etapa3-aluno.dto";
import { CadastroStatusDto } from "./dto/status.dto";

@Injectable()
export class RegistrationService {
  constructor(private prisma: PrismaService) {}

  async createStep1(data: Etapa1ResponsavelDto) {
    const responsavel = await this.prisma.responsavel.create({
      data: {
        nome: data.nome,
        genero: data.genero,
        dataNascimento: new Date(data.dataNascimento),
        profissao: data.profissao,
        naturalidade: data.naturalidade,
        estadoCivil: data.estadoCivil,
        nacionalidade: data.nacionalidade || 'Brasileira',
        rg: data.rg,
        cpf: data.cpf,
        celular: '',
        email: 'pending@temp.local',
        enderecoId: null,
      },
      select: { id: true },
    });
    return responsavel;
  }

  async updateStep2(responsavelId: string, data: Etapa2EnderecoDto) {
    const resp = await this.prisma.responsavel.findUnique({ where: { id: responsavelId } });
    if (!resp) throw new NotFoundException('Responsável não encontrado');
  if ((resp as any).etapaAtual > 2) throw new BadRequestException('Etapa já concluída');
  if ((resp as any).etapaAtual < 1) throw new BadRequestException('Sequência inválida');

    const endereco = await this.prisma.endereco.create({
      data: {
        cep: data.cep,
        rua: data.rua,
        numero: data.numero,
        complemento: data.complemento,
        cidade: data.cidade,
        uf: data.uf,
        bairro: data.bairro,
      },
    });

    const updated = await this.prisma.responsavel.update({
      where: { id: responsavelId },
      data: {
        enderecoId: endereco.id,
        celular: data.celular,
        contatoWhatsapp: data.contatoWhatsapp,
        email: data.email,
      },
      select: { id: true },
    });
    return updated;
  }

  async createStep3(responsavelId: string, data: Etapa3AlunoDto) {
    const resp = await this.prisma.responsavel.findUnique({ where: { id: responsavelId }, include: { endereco: true } });
    if (!resp) throw new NotFoundException('Responsável não encontrado');
  if ((resp as any).etapaAtual > 3) throw new BadRequestException('Etapa já concluída');
  if ((resp as any).etapaAtual < 2) throw new BadRequestException('Etapa anterior não concluída');

    let enderecoId: string | undefined = undefined;
    if (data.moraComResponsavel && resp.enderecoId) {
      enderecoId = resp.enderecoId;
    }

    const aluno = await this.prisma.aluno.create({
      data: {
        nome: data.nome,
        genero: data.genero,
        dataNascimento: new Date(data.dataNascimento),
        cidadeNatal: data.cidadeNatal,
        cpf: data.cpf || null,
        responsavelId: resp.id,
        enderecoId: enderecoId,
        moraComResponsavel: data.moraComResponsavel,
      },
      select: { id: true },
    });

    await this.prisma.responsavel.update({
      where: { id: responsavelId },
      data: { etapaAtual: 3 },
    });

    return { alunoId: aluno.id, etapaAtual: 3 };
  }

  async getStatus(responsavelId: string): Promise<CadastroStatusDto> {
    const resp = await this.prisma.responsavel.findUnique({ where: { id: responsavelId } });
    if (!resp) throw new NotFoundException('Responsável não encontrado');
    return {
      responsavelId: resp.id,
      etapaAtual: (resp as any).etapaAtual,
      completo: (resp as any).etapaAtual >= 3,
    };
  }
}
