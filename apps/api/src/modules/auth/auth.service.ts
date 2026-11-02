import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../common/database.service';
import { normalizePhone, isValidBdPhone } from '../../common/phone.utils';
import * as bcrypt from 'bcryptjs';

interface OtpRecord {
  hashedCode: string;
  plainCode: string; // for dev mode inspection
  expiresAt: Date;
  attempts: number;
}

interface RateLimitRecord {
  count: number;
  resetAt: Date;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private otpStore = new Map<string, OtpRecord>();
  private rateLimits = new Map<string, RateLimitRecord>();

  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async requestOtp(rawPhone: string) {
    const phone = normalizePhone(rawPhone);
    if (!isValidBdPhone(phone)) {
      throw new BadRequestException('Please provide a valid Bangladeshi phone number (e.g. 01712345678)');
    }

    // Rate limiting: 3 requests per phone per hour
    const now = new Date();
    const rate = this.rateLimits.get(phone);
    if (rate && rate.resetAt > now) {
      if (rate.count >= 3) {
        throw new BadRequestException('Too many OTP requests. Please wait an hour before requesting again.');
      }
      rate.count += 1;
    } else {
      this.rateLimits.set(phone, {
        count: 1,
        resetAt: new Date(now.getTime() + 60 * 60 * 1000),
      });
    }

    // Generate 6-digit OTP code (fixed 123456 for seeded demo accounts if requested, or random 6-digit)
    let code = Math.floor(100000 + Math.random() * 900000).toString();
    if (phone === '+8801700000000' || phone === '+8801711111111' || phone === '+8801722222222' || phone === '+8801733333333') {
      code = '123456';
    }

    const salt = await bcrypt.genSalt(10);
    const hashedCode = await bcrypt.hash(code, salt);
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes

    this.otpStore.set(phone, {
      hashedCode,
      plainCode: code,
      expiresAt,
      attempts: 0,
    });

    const isDevMode = this.configService.get<string>('OTP_DEV_MODE', 'true') === 'true';
    this.logger.log(`[OTP] Generated OTP for ${phone}: ${code} (Dev Mode: ${isDevMode})`);

    return {
      message: 'OTP sent successfully',
      phone,
      expires_in_seconds: 300,
      dev_otp: isDevMode ? code : undefined,
    };
  }

  async verifyOtp(rawPhone: string, code: string) {
    const phone = normalizePhone(rawPhone);
    const record = this.otpStore.get(phone);

    // Bypass check for demo numbers in dev mode with code 123456
    const isDemoBypass = (phone === '+8801700000000' || phone === '+8801711111111' || phone === '+8801722222222' || phone === '+8801733333333') && code === '123456';

    if (!isDemoBypass) {
      if (!record) {
        throw new BadRequestException('No active OTP found. Please request a new code.');
      }

      if (new Date() > record.expiresAt) {
        this.otpStore.delete(phone);
        throw new BadRequestException('OTP has expired. Please request a new code.');
      }

      if (record.attempts >= 5) {
        this.otpStore.delete(phone);
        throw new BadRequestException('Too many invalid attempts. Please request a new OTP.');
      }

      const isValid = await bcrypt.compare(code, record.hashedCode);
      if (!isValid) {
        record.attempts += 1;
        throw new BadRequestException('Invalid OTP code. Please check and try again.');
      }

      this.otpStore.delete(phone);
    }

    // Implicit signup or login
    let user = await this.db.getUserByPhone(phone);
    let isNewUser = false;

    if (!user) {
      user = await this.db.createUser({ phone });
      isNewUser = true;
    }

    const tokens = this.generateTokens(user);

    return {
      user,
      isNewUser,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'super_secret_jwt_refresh_key_dhaka_boi_hat_2026'),
      });
      const user = await this.db.getUserById(payload.sub);
      if (!user || user.is_banned) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      return this.generateTokens(user);
    } catch (e) {
      throw new UnauthorizedException('Expired or invalid refresh token');
    }
  }

  private generateTokens(user: any) {
    const payload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
      token_version: user.token_version || 1,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET', 'super_secret_jwt_access_key_dhaka_boi_hat_2026'),
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'super_secret_jwt_refresh_key_dhaka_boi_hat_2026'),
      expiresIn: '30d',
    });

    return { accessToken, refreshToken };
  }
}

