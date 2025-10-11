import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Request } from "express";
import { AuthService } from "./auth.service";

export interface JwtPayload {
  sub: string; 
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

const bearerExtractor = ExtractJwt.fromAuthHeaderAsBearerToken();
const caseInsensitiveAuthExtractor = (req: Request): string | null => {
  const h = (req?.headers?.authorization || (req?.headers as any)?.Authorization) as string | undefined;
  if (h && typeof h === 'string') {
    const parts = h.split(' ');
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) return parts[1];
  }
  return null;
};
const cookieExtractor = (req: Request): string | null => {
  const t = req?.cookies?.['access_token'];
  return t || null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        bearerExtractor,
        caseInsensitiveAuthExtractor,
        cookieExtractor,
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || "secret-key-change-in-production",
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.authService.validateUser(payload.email);
    
    if (!user) {
      throw new UnauthorizedException("Token inválido");
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }
}