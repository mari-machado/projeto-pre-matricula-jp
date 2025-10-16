import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MatriculaResponseDto } from './dto/matricula-response.dto';

@Injectable()
export class MatriculasService {
  constructor(private readonly prisma: PrismaService) {}

  private formatDateBR(d: Date | string): string {
    const dt = typeof d === 'string' ? new Date(d) : d;
    if (!dt || isNaN(dt.getTime())) return '';
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yyyy = dt.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  private formatDateTimeBR(d: Date | string): string {
    const dt = typeof d === 'string' ? new Date(d) : d;
    if (!dt || isNaN(dt.getTime())) return '';
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yyyy = dt.getFullYear();
    const hh = String(dt.getHours()).padStart(2, '0');
    const mi = String(dt.getMinutes()).padStart(2, '0');
    const ss = String(dt.getSeconds()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${mi}:${ss}`;
  }

  private map(m: any): MatriculaResponseDto {
    return {
      id: m.id,
      codigo: m.codigo,
      status: m.status,
      aluno: {
        id: m.aluno.id,
        nome: m.aluno.nome,
        genero: m.aluno.genero,
        dataNascimento: this.formatDateBR(m.aluno.dataNascimento),
      },
      responsavel: {
        id: m.responsavel.id,
        nome: m.responsavel.nome,
        email: m.responsavel.email,
        financeiro: m.responsavel.financeiro,
      },
      criadoEm: this.formatDateTimeBR(m.criadoEm),
      atualizadoEm: this.formatDateTimeBR(m.atualizadoEm),
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
    const responsavelIds = responsaveis.map(r => r.id);

    const matriculas = await this.prisma.matricula.findMany({
      where: {
        OR: [
          ({ usuarioId: usuario.id } as any),
          responsavelIds.length > 0 ? { responsavelId: { in: responsavelIds } } : undefined,
          { responsavelEmail: usuario.email },
        ].filter(Boolean) as any,
      },
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
      etapaAtual: (m as any).etapaAtual,
      etapaAtualLabel: (() => {
        const mm: any = m as any;
        const e = mm.etapaAtual || 0;
        if (e <= 1) return '2';
        if (e === 2) {
          if (mm.temSegundoResponsavel) {
            if (mm.pendenteResp2Dados) return '1b';
            if (mm.pendenteResp2Endereco) return '2b';
          }
          return '3';
        }
  if (e >= 3) return '3b';
        return '2';
      })(),
      completo: (m as any).completo,
      criadoEm: this.formatDateTimeBR(m.criadoEm),
      atualizadoEm: this.formatDateTimeBR(m.atualizadoEm),
      aluno: m.aluno && {
        id: m.aluno.id,
        nome: m.aluno.nome,
        genero: m.aluno.genero,
        dataNascimento: this.formatDateBR(m.aluno.dataNascimento),
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
        dataNascimento: this.formatDateBR(m.responsavel.dataNascimento),
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

    let matricula = await this.prisma.matricula.findFirst({
      where: ({ usuarioId: usuario.id } as any),
      orderBy: { atualizadoEm: 'desc' },
      include: { aluno: true, responsavel: true },
    });

    if (!matricula) {
      const responsaveis = await this.prisma.responsavel.findMany({ where: { email: usuario.email } });
      const responsavelIds = responsaveis.map(r => r.id);
      matricula = await this.prisma.matricula.findFirst({
        where: {
          OR: [
            responsavelIds.length > 0 ? { responsavelId: { in: responsavelIds } } : undefined,
            { responsavelEmail: usuario.email },
          ].filter(Boolean) as any,
        },
        orderBy: { atualizadoEm: 'desc' },
        include: { aluno: true, responsavel: true },
      });
    }

    if (!matricula) throw new NotFoundException('Nenhuma matrícula encontrada');
    return this.map(matricula);
  }

  private enderecosIguais(aluno: any, end: any): boolean {
    if (!aluno || !end) return false;
    const norm = (v: any) => (v ?? '').toString().trim().toLowerCase();
    return (
      norm(aluno.cep) === norm(end.cep) &&
      norm(aluno.rua) === norm(end.rua) &&
      norm(aluno.numero) === norm(end.numero) &&
      norm(aluno.complemento) === norm(end.complemento) &&
      norm(aluno.bairro) === norm(end.bairro) &&
      norm(aluno.cidade) === norm(end.cidade) &&
      norm(aluno.uf) === norm(end.uf)
    );
  }

  private buildDetailedPayload(matricula: any) {
    const aluno = matricula.aluno as any;
    const respPrincipal = matricula.responsavel as any;
    const resp2 = matricula.segundoResponsavel as any;

    const responsaveisSet = new Map<string, any>();
    const pushResp = (r: any, extra?: any) => {
      if (!r) return;
      if (!responsaveisSet.has(r.id)) {
        responsaveisSet.set(r.id, {
          id: r.id,
          nome: r.nome,
          genero: r.genero,
          dataNascimento: this.formatDateBR(r.dataNascimento),
          estadoCivil: (r as any).estadoCivil,
          rg: (r as any).rg,
          orgaoExpeditor: (r as any).orgaoExpeditor,
          dataExpedicao: this.formatDateBR((r as any).dataExpedicao),
          cpf: (r as any).cpf,
          pessoaJuridica: (r as any).pessoaJuridica,
          celular: (r as any).celular,
          email: r.email,
          financeiro: r.financeiro,
          endereco: r.endereco
            ? {
                id: r.endereco.id,
                cep: r.endereco.cep,
                rua: r.endereco.rua,
                numero: r.endereco.numero,
                complemento: r.endereco.complemento,
                bairro: r.endereco.bairro,
                cidade: r.endereco.cidade,
                uf: r.endereco.uf,
              }
            : null,
          ...extra,
        });
      } else if (extra) {
        Object.assign(responsaveisSet.get(r.id), extra);
      }
    };

    for (const ar of aluno?.alunoResponsaveis || []) {
      const r = ar.responsavel;
      pushResp(r, {
        tipoParentesco: ar.tipoParentesco,
        responsavelFinanceiro: ar.responsavelFinanceiro,
        responsavelDidatico: ar.responsavelDidatico,
      });
    }
    pushResp(respPrincipal);
    pushResp(resp2);

    let moraComResponsavelNome: string | null = null;
    if (aluno?.moraComResponsavel) {
      if (respPrincipal?.endereco && this.enderecosIguais(aluno, respPrincipal.endereco)) {
        moraComResponsavelNome = respPrincipal.nome;
      } else if (resp2?.endereco && this.enderecosIguais(aluno, resp2.endereco)) {
        moraComResponsavelNome = resp2.nome;
      } else {
        for (const ar of aluno?.alunoResponsaveis || []) {
          const r = ar.responsavel;
          if (r?.endereco && this.enderecosIguais(aluno, r.endereco)) {
            moraComResponsavelNome = r.nome;
            break;
          }
        }
      }
    }

    const etapaAtualLabel = (() => {
      const e = matricula.etapaAtual || 0;
      if (e <= 1) return '2';
      if (e === 2) {
        if (matricula.temSegundoResponsavel) {
          if (matricula.pendenteResp2Dados) return '1b';
          if (matricula.pendenteResp2Endereco) return '2b';
        }
        return '3';
      }
      if (e >= 3) return '3b';
      return '2';
    })();

    return {
      id: matricula.id,
      codigo: matricula.codigo,
      status: matricula.status,
      etapaAtual: matricula.etapaAtual,
      etapaAtualLabel,
      completo: matricula.completo,
      pendenteEnderecoAluno: matricula.pendenteEnderecoAluno,
      temSegundoResponsavel: matricula.temSegundoResponsavel,
      segundoResponsavelId: matricula.segundoResponsavelId,
      segundoResponsavelNome: matricula.segundoResponsavelNome,
      segundoResponsavelEmail: matricula.segundoResponsavelEmail,
      segundoResponsavelCelular: matricula.segundoResponsavelCelular,
      pendenteResp2Dados: matricula.pendenteResp2Dados,
      pendenteResp2Endereco: matricula.pendenteResp2Endereco,
      criadoEm: this.formatDateTimeBR(matricula.criadoEm),
      atualizadoEm: this.formatDateTimeBR(matricula.atualizadoEm),
      aluno: aluno && {
        id: aluno.id,
        nome: aluno.nome,
        genero: aluno.genero,
        nacionalidade: aluno.nacionalidade,
        dataNascimento: this.formatDateBR(aluno.dataNascimento),
        cidadeNatal: aluno.cidadeNatal,
        estadoCivil: aluno.estadoCivil,
        cpf: aluno.cpf,
        telefone: (aluno as any).telefone,
        celular: (aluno as any).celular,
        whatsapp: (aluno as any).whatsapp,
        email: (aluno as any).email,
        cep: aluno.cep,
        rua: aluno.rua,
        numero: aluno.numero,
        complemento: aluno.complemento,
        bairro: aluno.bairro,
        cidade: aluno.cidade,
        uf: aluno.uf,
        moraComResponsavel: aluno.moraComResponsavel,
        moraComResponsavelNome,
      },
      responsavelPrincipal: respPrincipal && {
        id: respPrincipal.id,
        nome: matricula.responsavelNome || respPrincipal.nome,
        genero: respPrincipal.genero,
        dataNascimento: this.formatDateBR(respPrincipal.dataNascimento),
        estadoCivil: (respPrincipal as any).estadoCivil,
        rg: (respPrincipal as any).rg,
        orgaoExpeditor: (respPrincipal as any).orgaoExpeditor,
        dataExpedicao: this.formatDateBR((respPrincipal as any).dataExpedicao),
        cpf: matricula.responsavelCpf || (respPrincipal as any).cpf,
        pessoaJuridica: (respPrincipal as any).pessoaJuridica,
        celular: (respPrincipal as any).celular,
        email: matricula.responsavelEmail || respPrincipal.email,
        financeiro: respPrincipal.financeiro,
        etapaAtual: (respPrincipal as any).etapaAtual,
        endereco: respPrincipal.endereco
          ? {
              id: respPrincipal.endereco.id,
              cep: respPrincipal.endereco.cep,
              rua: respPrincipal.endereco.rua,
              numero: respPrincipal.endereco.numero,
              complemento: respPrincipal.endereco.complemento,
              bairro: respPrincipal.endereco.bairro,
              cidade: respPrincipal.endereco.cidade,
              uf: respPrincipal.endereco.uf,
            }
          : null,
      },
      segundoResponsavel: resp2 && {
        id: resp2.id,
        nome: matricula.segundoResponsavelNome || resp2.nome,
        genero: resp2.genero,
        dataNascimento: this.formatDateBR(resp2.dataNascimento),
        estadoCivil: (resp2 as any).estadoCivil,
        rg: (resp2 as any).rg,
        orgaoExpeditor: (resp2 as any).orgaoExpeditor,
        dataExpedicao: this.formatDateBR((resp2 as any).dataExpedicao),
        cpf: (resp2 as any).cpf,
        pessoaJuridica: (resp2 as any).pessoaJuridica,
        celular: matricula.segundoResponsavelCelular || (resp2 as any).celular,
        email: matricula.segundoResponsavelEmail || resp2.email,
        financeiro: resp2.financeiro,
        etapaAtual: (resp2 as any).etapaAtual,
        endereco: resp2.endereco
          ? {
              id: resp2.endereco.id,
              cep: resp2.endereco.cep,
              rua: resp2.endereco.rua,
              numero: resp2.endereco.numero,
              complemento: resp2.endereco.complemento,
              bairro: resp2.endereco.bairro,
              cidade: resp2.endereco.cidade,
              uf: resp2.endereco.uf,
            }
          : null,
      },
      responsaveis: Array.from(responsaveisSet.values()),
    };
  }

  async findMostRecentForUsuarioDetailed(usuarioId: string): Promise<any> {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');

    const includeFull: any = {
      aluno: {
        include: {
          alunoResponsaveis: {
            include: {
              responsavel: { include: { endereco: true } },
            },
          },
        },
      },
      responsavel: { include: { endereco: true } },
      segundoResponsavel: { include: { endereco: true } },
    };

    let matricula = await this.prisma.matricula.findFirst({
      where: ({ usuarioId: usuario.id } as any),
      orderBy: { atualizadoEm: 'desc' },
      include: includeFull,
    });

    if (!matricula) {
      const responsaveis = await this.prisma.responsavel.findMany({ where: { email: usuario.email } });
      const responsavelIds = responsaveis.map(r => r.id);
      matricula = await this.prisma.matricula.findFirst({
        where: {
          OR: [
            responsavelIds.length > 0 ? { responsavelId: { in: responsavelIds } } : undefined,
            { responsavelEmail: usuario.email },
          ].filter(Boolean) as any,
        },
        orderBy: { atualizadoEm: 'desc' },
        include: includeFull,
      });
    }

    if (!matricula) throw new NotFoundException('Nenhuma matrícula encontrada');

    return this.buildDetailedPayload(matricula);
  }

  async findDetailedByIdForUsuario(matriculaId: string, usuarioId: string): Promise<any> {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');

    const includeFull: any = {
      aluno: {
        include: {
          alunoResponsaveis: {
            include: { responsavel: { include: { endereco: true } } },
          },
        },
      },
      responsavel: { include: { endereco: true } },
      segundoResponsavel: { include: { endereco: true } },
    };

    const responsaveis = await this.prisma.responsavel.findMany({ where: { email: usuario.email } });
    const responsavelIds = responsaveis.map(r => r.id);

    const matricula = await this.prisma.matricula.findFirst({
      where: {
        id: matriculaId,
        OR: [
          ({ usuarioId: usuario.id } as any),
          responsavelIds.length > 0 ? { responsavelId: { in: responsavelIds } } : undefined,
          { responsavelEmail: usuario.email },
          { responsavel: { email: usuario.email } },
        ].filter(Boolean) as any,
      },
      include: includeFull,
    });
    if (!matricula) throw new NotFoundException('Matrícula não encontrada');
    return this.buildDetailedPayload(matricula);
  }

  async getAlunoIdForUsuario(usuarioId: string): Promise<{ alunoId: string }> {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');

    let mat = await this.prisma.matricula.findFirst({
      where: ({ usuarioId: usuario.id } as any),
      orderBy: { criadoEm: 'desc' },
      select: { alunoId: true },
    });
    if (!mat) {
      mat = await this.prisma.matricula.findFirst({
        where: { responsavelEmail: usuario.email },
        orderBy: { criadoEm: 'desc' },
        select: { alunoId: true },
      });
    }
    if (!mat) {
      mat = await this.prisma.matricula.findFirst({
        where: { responsavel: { email: usuario.email } },
        orderBy: { criadoEm: 'desc' },
        select: { alunoId: true },
      });
    }
    if (!mat) throw new NotFoundException('Nenhuma matrícula encontrada');
    return { alunoId: mat.alunoId };
  }

  async getAllMatriculaIdsForUsuario(usuarioId: string): Promise<{ ids: string[] }> {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');

    const responsaveis = await this.prisma.responsavel.findMany({ where: { email: usuario.email } });
    const responsavelIds = responsaveis.map(r => r.id);

    const matriculas = await this.prisma.matricula.findMany({
      where: {
        OR: [
          ({ usuarioId: usuario.id } as any),
          responsavelIds.length > 0 ? { responsavelId: { in: responsavelIds } } : undefined,
          { responsavelEmail: usuario.email },
        ].filter(Boolean) as any,
      },
      orderBy: { criadoEm: 'desc' },
      select: { id: true },
    });
    const ids = Array.from(new Set(matriculas.map(m => m.id)));
    return { ids };
  }
}
