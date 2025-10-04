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

const cookieExtractor = (req: Request): string | null => {
  let token: string | null = null;
  
  if (req && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith("Bearer")) {
      token = authHeader.substring(7);
    }
  }
  
  if (!token && req && req.cookies) {
    token = req.cookies["access_token"];
  }
  
  return token;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: cookieExtractor,
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