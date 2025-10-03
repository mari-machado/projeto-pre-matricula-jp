import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { LoginDto } from "./dto/login.dto";
import { LoginResponseDto } from "./dto/response.dto";
import { JwtPayload } from "./jwt.strategy";

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}
  private users = [
    {
      id: "550e8400-e29b-41d4-a716-446655440001",
      email: "admin@example.com",
      password: "$2b$10$OinKaPTe1kW.qS.MzAvyH.sA8r/WrHcUCsum3WD6kh2mbywFkA04i",
      name: "Administrador",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440002",
      email: "user@example.com",
      password: "$2b$10$SDIJDc9fhVBWEQzsD2dQDucZrisfXATPt50jLompd1OpvXWomWQ5C",
      name: "Usuário Teste",
    },
  ];

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { email, password } = loginDto;

    const user = this.users.find((u) => u.email === email);

    if (!user) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    const { password: _, ...userWithoutPassword } = user;

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      message: "Login realizado com sucesso",
      user: userWithoutPassword,
      token: accessToken,
    };
  }

  async validateUser(email: string): Promise<any> {
    const user = this.users.find((u) => u.email === email);
    if (user) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async validateToken(payload: JwtPayload) {
    return this.validateUser(payload.email);
  }
}