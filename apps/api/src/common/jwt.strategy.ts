import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from './database.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly db: DatabaseService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET', 'super_secret_jwt_access_key_dhaka_boi_hat_2026'),
    });
  }

  async validate(payload: { sub: string; phone: string; role: string; token_version?: number }) {
    const user = await this.db.getUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User account no longer exists');
    }
    if (user.is_banned) {
      throw new UnauthorizedException('Account has been suspended');
    }
    return user;
  }
}
