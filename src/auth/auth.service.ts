import { Injectable, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { LoginDto } from "./dto/login.dto";
import { LoginResponseDto } from "./dto/response.dto";
import { JwtPayload } from "./jwt.strategy";
import { EmailService } from "./services/email.service";
import { PrismaService } from "../prisma/prisma.service";
import { RequestRegistrationDto } from "./dto/request-registration.dto";
import { ConfirmRegistrationDto } from "./dto/confirm-registration.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private emailService: EmailService,
    private prisma: PrismaService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const email = loginDto.email.toLowerCase();
    const password = loginDto.password;

    const user = await this.prisma.usuario.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException("Credenciais inválidas");

    const isPasswordValid = await bcrypt.compare(password, user.senha);
    if (!isPasswordValid) throw new UnauthorizedException("Credenciais inválidas");

    this.prisma.usuario.update({ where: { id: user.id }, data: { ultimoLogin: new Date() } }).catch(() => {});

    const payload: JwtPayload = { sub: user.id, email: user.email, name: user.nome };
    const accessToken = this.jwtService.sign(payload);

    const emailSent = await this.emailService.sendLoginConfirmation({
      to: user.email,
      responsibleName: user.nome,
      loginDate: new Date(),
    });

    return {
      message: "Login realizado com sucesso",
      user: { id: user.id, email: user.email, name: user.nome },
      token: accessToken,
      emailSent,
    };
  }

  async validateUser(email: string): Promise<any> {
    const user = await this.prisma.usuario.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return null;
    return { id: user.id, email: user.email, nome: user.nome, ativo: user.ativo };
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async validateToken(payload: JwtPayload) {
    return this.validateUser(payload.email);
  }

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString(); 
  }

  async requestRegistration(dto: RequestRegistrationDto) {
    const email = dto.email.toLowerCase();

    const existingUser = await this.prisma.usuario.findUnique({ where: { email } });
    if (existingUser) {
      throw new BadRequestException("Email já registrado");
    }

    await this.prisma.emailVerification.updateMany({
      where: { email, used: false, expiresAt: { gt: new Date() } },
      data: { used: true, usedAt: new Date() },
    });

    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); 

    await this.prisma.emailVerification.create({
      data: { email, code, expiresAt },
    });

    await this.emailService.sendVerificationCode({ to: email, code });

    return { message: "Código enviado", email, expiresAt };
  }

  async confirmRegistration(dto: ConfirmRegistrationDto) {
    const email = dto.email.toLowerCase();
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException("Senhas não conferem");
    }

    const verification = await this.prisma.emailVerification.findFirst({
      where: { email, code: dto.code, used: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      throw new BadRequestException("Código inválido");
    }
    if (verification.expiresAt < new Date()) {
      throw new BadRequestException("Código expirado");
    }

    const hashed = await this.hashPassword(dto.password);

    const user = await this.prisma.usuario.create({
      data: { email, senha: hashed, nome: email.split('@')[0] },
    });

    await this.prisma.emailVerification.update({
      where: { id: verification.id },
      data: { used: true, usedAt: new Date() },
    });

    return { message: "Usuário criado", userId: user.id };
  }

  private generateTemporaryPassword(): string {
    const base = 'Temp';
    const rand = Math.floor(100000 + Math.random() * 900000).toString();
    return `${base}${rand}!`; 
  }

  private generateNumericCode(length = 5): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
  }

  async resetPassword(dto: ResetPasswordDto) {
    const email = dto.email.toLowerCase();
    const user = await this.prisma.usuario.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('Usuário não encontrado');

    const pr = (this.prisma as any).passwordReset;
    if (!pr) {
      throw new BadRequestException('Serviço temporariamente indisponível. Reinicie o servidor para carregar o modelo PasswordReset');
    }
    await pr.updateMany({
      where: { email, used: false, expiresAt: { gt: new Date() } },
      data: { used: true, usedAt: new Date() },
    });

    const code = this.generateNumericCode(5);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 
  await pr.create({ data: { email, code, expiresAt } });

    if ((this.emailService as any).sendPasswordResetCodeEmail) {
      await (this.emailService as any).sendPasswordResetCodeEmail({ to: email, code });
    } else {
      await this.emailService.sendVerificationCode({ to: email, code });
    }
    return { message: 'Código de redefinição enviado', email, expiresAt };
  }

  async verifyResetCode(email: string, code: string) {
    const normalized = email.toLowerCase();
    const pr = (this.prisma as any).passwordReset;
    if (!pr) {
      throw new BadRequestException('Serviço temporariamente indisponível. Reinicie o servidor para carregar o modelo PasswordReset (rode prisma generate).');
    }
    const record = await pr.findFirst({
      where: { email: normalized, code, used: false },
      orderBy: { createdAt: 'desc' },
    });
    if (!record) throw new BadRequestException('Código inválido');
    if (new Date(record.expiresAt) < new Date()) throw new BadRequestException('Código expirado');
    return { valid: true, email: normalized, code, expiresAt: record.expiresAt };
  }

  async resendResetCode(email: string) {
    const normalized = email.toLowerCase();
    const user = await this.prisma.usuario.findUnique({ where: { email: normalized } });
    if (!user) throw new BadRequestException('Usuário não encontrado');

    const pr = (this.prisma as any).passwordReset;
    if (!pr) {
      throw new BadRequestException('Serviço temporariamente indisponível. Reinicie o servidor para carregar o modelo PasswordReset');
    }
    const existing = await pr.findFirst({
      where: { email: normalized, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      if ((this.emailService as any).sendPasswordResetCodeEmail) {
        await (this.emailService as any).sendPasswordResetCodeEmail({ to: normalized, code: existing.code });
      } else {
        await this.emailService.sendVerificationCode({ to: normalized, code: existing.code });
      }
      return { message: 'Código reenviado', email: normalized, expiresAt: existing.expiresAt, resent: true };
    }

    const code = this.generateNumericCode(5);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await pr.create({ data: { email: normalized, code, expiresAt } });
    if ((this.emailService as any).sendPasswordResetCodeEmail) {
      await (this.emailService as any).sendPasswordResetCodeEmail({ to: normalized, code });
    } else {
      await this.emailService.sendVerificationCode({ to: normalized, code });
    }
    return { message: 'Novo código gerado e enviado', email: normalized, expiresAt, resent: false };
  }

  createResetSession(email: string, code: string): string {
    const payload = { purpose: 'pwd-reset', email, code } as const;
    return this.jwtService.sign(payload, { expiresIn: '10m' });
  }

  verifyResetSession(token: string): { email: string; code: string } {
    try {
      const decoded: any = this.jwtService.verify(token);
      if (decoded?.purpose !== 'pwd-reset' || !decoded?.email || !decoded?.code) {
        throw new Error('Token inválido');
      }
      return { email: decoded.email, code: decoded.code };
    } catch {
      throw new BadRequestException('Sessão de redefinição inválida ou expirada');
    }
  }

  async confirmResetPassword(token: string, password: string, confirmPassword: string) {
    if (password !== confirmPassword) {
      throw new BadRequestException('Senhas não conferem');
    }
    const { email, code } = this.verifyResetSession(token);
    const user = await this.prisma.usuario.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('Usuário não encontrado');

    const pr = (this.prisma as any).passwordReset;
    if (!pr) {
      throw new BadRequestException('Serviço temporariamente indisponível. Reinicie o servidor para carregar o modelo PasswordReset.');
    }
    const record = await pr.findFirst({ where: { email, code, used: false }, orderBy: { createdAt: 'desc' } });
    if (!record) throw new BadRequestException('Código inválido');
    if (new Date(record.expiresAt) < new Date()) throw new BadRequestException('Código expirado');

    const hashed = await this.hashPassword(password);
    await this.prisma.usuario.update({ where: { id: user.id }, data: { senha: hashed } });
    await pr.update({ where: { id: record.id }, data: { used: true, usedAt: new Date() } });

    return { message: 'Senha atualizada com sucesso' };
  }

  
}