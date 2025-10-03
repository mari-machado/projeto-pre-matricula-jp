import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthService } from "./auth.service";

export interface JwtPayload {
  sub: string; 
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
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