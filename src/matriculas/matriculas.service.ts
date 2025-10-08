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

  async listByResponsavel(responsavelId: string): Promise<MatriculaResponseDto[]> {
    const matriculas = await this.prisma.matricula.findMany({
      where: { responsavelId },
      orderBy: { criadoEm: 'desc' },
      include: { aluno: true, responsavel: true },
    });
    return matriculas.map(m => this.map(m));
  }
}
