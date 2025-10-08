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

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private emailService: EmailService,
    private prisma: PrismaService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { email, password } = loginDto;

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
    const user = await this.prisma.usuario.findUnique({ where: { email } });
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
}