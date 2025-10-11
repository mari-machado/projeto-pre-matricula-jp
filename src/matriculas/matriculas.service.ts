import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MatriculaResponseDto } from './dto/matricula-response.dto';

@Injectable()
export class MatriculasService {
  constructor(private readonly prisma: PrismaService) {}

  private map(m: any): MatriculaResponseDto {
    return {
      id: m.id,
      codigo: m.codigo,
      status: m.status,
      aluno: {
        id: m.aluno.id,
        nome: m.aluno.nome,
        genero: m.aluno.genero,
        dataNascimento: m.aluno.dataNascimento.toISOString().substring(0, 10),
      },
      responsavel: {
        id: m.responsavel.id,
        nome: m.responsavel.nome,
        email: m.responsavel.email,
        financeiro: m.responsavel.financeiro,
      },
      criadoEm: m.criadoEm.toISOString(),
      atualizadoEm: m.atualizadoEm.toISOString(),
    };
  }

  async findOne(id: string): Promise<MatriculaResponseDto> {
    const matricula = await this.prisma.matricula.findUnique({
      where: { id },
      include: { aluno: true, responsavel: true },
    });
    if (!matricula) throw new NotFoundException('Matrícula não encontrada');
    return this.map(matricula);
  }

  async listByResponsavel(responsavelId: string): Promise<{ total: number; items: MatriculaResponseDto[] }> {
    const [matriculas, total] = await Promise.all([
      this.prisma.matricula.findMany({
        where: { responsavelId },
        orderBy: { criadoEm: 'desc' },
        include: { aluno: true, responsavel: true },
      }),
      this.prisma.matricula.count({ where: { responsavelId } })
    ]);
    return { total, items: matriculas.map(m => this.map(m)) };
  }

  async listByUsuario(usuarioId: string): Promise<{ total: number; items: any[] }> {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');

    const responsaveis = await this.prisma.responsavel.findMany({ where: { email: usuario.email } });
    if (responsaveis.length === 0) return { total: 0, items: [] };
    const responsavelIds = responsaveis.map(r => r.id);

    const matriculas = await this.prisma.matricula.findMany({
      where: { responsavelId: { in: responsavelIds } },
      orderBy: { criadoEm: 'desc' },
      include: {
        aluno: true,
        responsavel: { include: { endereco: true } },
      },
    });

    const items = matriculas.map(m => ({
      id: m.id,
      codigo: m.codigo,
      status: m.status,
      criadoEm: m.criadoEm.toISOString(),
      atualizadoEm: m.atualizadoEm.toISOString(),
      aluno: m.aluno && {
        id: m.aluno.id,
        nome: m.aluno.nome,
        genero: m.aluno.genero,
        dataNascimento: m.aluno.dataNascimento.toISOString().substring(0,10),
        cidadeNatal: m.aluno.cidadeNatal,
        cpf: m.aluno.cpf,
        moraComResponsavel: m.aluno.moraComResponsavel,
        endereco: (m.aluno.cidade || m.aluno.cep || m.aluno.rua) ? {
          id: null,
          cep: m.aluno.cep || null,
          rua: m.aluno.rua || null,
          numero: m.aluno.numero || null,
          complemento: m.aluno.complemento || null,
          bairro: m.aluno.bairro || null,
          cidade: m.aluno.cidade || null,
          uf: m.aluno.uf || null,
        } : null,
      },
      responsavel: m.responsavel && {
        id: m.responsavel.id,
        nome: m.responsavel.nome,
        genero: m.responsavel.genero,
        dataNascimento: m.responsavel.dataNascimento.toISOString().substring(0,10),
        estadoCivil: (m.responsavel as any).estadoCivil,
        rg: (m.responsavel as any).rg,
        cpf: (m.responsavel as any).cpf,
        celular: (m.responsavel as any).celular,
        email: m.responsavel.email,
        financeiro: m.responsavel.financeiro,
        etapaAtual: (m.responsavel as any).etapaAtual,
        endereco: m.responsavel.endereco ? {
          id: m.responsavel.endereco.id,
          cep: m.responsavel.endereco.cep,
          rua: m.responsavel.endereco.rua,
          numero: m.responsavel.endereco.numero,
          complemento: m.responsavel.endereco.complemento,
          bairro: m.responsavel.endereco.bairro,
          cidade: m.responsavel.endereco.cidade,
          uf: m.responsavel.endereco.uf,
        } : null,
      },
    }));

    return { total: items.length, items };
  }

  async findMostRecentForUsuario(usuarioId: string): Promise<MatriculaResponseDto> {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');

    const responsaveis = await this.prisma.responsavel.findMany({ where: { email: usuario.email } });
    const responsavelIds = responsaveis.map(r => r.id);

    const matricula = await this.prisma.matricula.findFirst({
      where: {
        OR: [
          responsavelIds.length > 0 ? { responsavelId: { in: responsavelIds } } : undefined,
          { responsavelEmail: usuario.email },
        ].filter(Boolean) as any,
      },
      orderBy: { atualizadoEm: 'desc' },
      include: { aluno: true, responsavel: true },
    });

    if (!matricula) throw new NotFoundException('Nenhuma matrícula encontrada');
    return this.map(matricula);
  }
}
