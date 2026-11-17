import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../common/database.service';
import { EmailService } from '../email/email.service';
import { normalizePhone, isValidBdPhone } from '../../common/phone.utils';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

const RESERVED_USERNAMES = new Set([
  'admin',
  'administrator',
  'support',
  'boihat',
  'boi-hat',
  'boi_hat',
  'root',
  'api',
  'null',
  'undefined',
  'system',
  'moderator',
  'help',
  'test',
  'official',
  'auth',
  'user',
  'superuser',
  'owner',
]);

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  // ==========================================================================
  // 1. Live Username Availability
  // ==========================================================================
  async checkUsernameAvailable(rawUsername: string, clientIp: string) {
    // DB-backed rate limit: 60 checks per minute per IP
    const rl = await this.db.checkAndIncrementRateLimit(`rl:uname:${clientIp}`, 60, 60);
    if (!rl.allowed) {
      throw new HttpException(
        `Too many requests. Please wait ${rl.retryAfterSeconds} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const username = (rawUsername || '').trim().toLowerCase();

    // Validation: 3-20 chars, lowercase a-z, 0-9, _, .
    if (username.length < 3 || username.length > 20) {
      return {
        available: false,
        username,
        message: 'ইউজারনেম ৩ থেকে ২০ অক্ষরের মধ্যে হতে হবে (Must be 3-20 characters)',
      };
    }

    if (!/^[a-z]/.test(username)) {
      return {
        available: false,
        username,
        message: 'ইউজারনেম অবশ্যই ইংরেজি অক্ষর দিয়ে শুরু হতে হবে (Must start with a letter)',
      };
    }

    if (!/^[a-z0-9_.]+$/.test(username)) {
      return {
        available: false,
        username,
        message: 'শুধুমাত্র ইংরেজি ছোট হাতের অক্ষর, সংখ্যা, আন্ডারস্কোর (_) এবং ডট (.) ব্যবহার করা যাবে',
      };
    }

    if (/\.{2,}|_{2,}|\._|_\./.test(username)) {
      return {
        available: false,
        username,
        message: 'পরপর একাধিক ডট বা আন্ডারস্কোর ব্যবহার করা যাবে না (No consecutive dots/underscores)',
      };
    }

    if (RESERVED_USERNAMES.has(username)) {
      return {
        available: false,
        username,
        message: 'এই ইউজারনেমটি সিস্টেমের জন্য সংরক্ষিত (Reserved username)',
      };
    }

    const isTaken = await this.db.isUsernameTaken(username);
    if (isTaken) {
      const suggestions: string[] = [];
      const candidates = [
        `${username}${Math.floor(10 + Math.random() * 90)}`,
        `${username}_bd`,
        `${username}.${Math.floor(100 + Math.random() * 900)}`,
        `${username}book`,
      ];

      for (const candidate of candidates) {
        if (candidate.length <= 20 && !(await this.db.isUsernameTaken(candidate))) {
          suggestions.push(candidate);
          if (suggestions.length >= 3) break;
        }
      }

      return {
        available: false,
        username,
        message: 'ইউজারনেমটি আগে থেকেই নেওয়া (Username already taken)',
        suggestions,
      };
    }

    return {
      available: true,
      username,
      message: 'এই ইউজারনেম পাওয়া যাবে (Username available)',
    };
  }

  // ==========================================================================
  // 2. Signup Flow
  // ==========================================================================
  async requestSignupCode(
    dto: { name: string; username: string; email: string },
    clientIp: string,
  ) {
    const cleanName = (dto.name || '').trim().replace(/\s+/g, ' ');
    const lowerUsername = (dto.username || '').trim().toLowerCase();
    const lowerEmail = (dto.email || '').trim().toLowerCase();

    // Validate Name: 2-60 chars, letters, Unicode marks (Bangla vowel signs/hasant), spaces, dots
    if (cleanName.length < 2 || cleanName.length > 60 || !/^[\p{L}\p{M}\s.()'-]{2,60}$/u.test(cleanName)) {
      throw new BadRequestException('নাম ২-৬০ অক্ষরের হতে হবে এবং শুধুমাত্র বর্ণ, স্পেস ও ডট গ্রহণযোগ্য');
    }

    // Validate Username
    const check = await this.checkUsernameAvailable(lowerUsername, clientIp);
    if (!check.available) {
      if (check.message.includes('নেওয়া') || check.message.includes('taken')) {
        throw new ConflictException(check.message);
      }
      throw new BadRequestException(check.message);
    }

    // Check if email already registered
    const emailTaken = await this.db.isEmailTaken(lowerEmail);
    if (emailTaken) {
      throw new ConflictException('ইমেইলটি আগে থেকেই নিবন্ধিত। দয়া করে লগইন করুন (Email already registered. Please log in)');
    }

    // Check if username already taken by an active user
    const usernameTaken = await this.db.getUserByUsername(lowerUsername);
    if (usernameTaken) {
      throw new ConflictException('ইউজারনেমটি আগে থেকেই নেওয়া (Username already taken)');
    }

    // Rate Limiting in DB:
    // 1. IP rate limit: max 20 requests per hour
    const ipRl = await this.db.checkAndIncrementRateLimit(`rl:ip:${clientIp}`, 20, 3600);
    if (!ipRl.allowed) {
      throw new HttpException(
        `আইপি থেকে অতিরিক্ত অনুরোধ করা হয়েছে। দয়া করে ${Math.ceil(ipRl.retryAfterSeconds / 60)} মিনিট পর চেষ্টা করুন।`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 2. Email rate limit & 60s resend cooldown: max 5 requests per hour, 60s cooldown
    const emailRl = await this.db.checkAndIncrementRateLimit(`rl:email:${lowerEmail}`, 5, 3600, 60);
    if (!emailRl.allowed) {
      throw new HttpException(
        `দয়া করে ${emailRl.retryAfterSeconds} সেকেন্ড পর পুনরায় কোড পাঠানোর চেষ্টা করুন।`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Generate cryptographically secure 6-digit code
    const code = crypto.randomInt(100000, 1000000).toString();
    const salt = await bcrypt.genSalt(10);
    const codeHash = await bcrypt.hash(code, salt);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store in DB email_verifications table
    await this.db.createEmailVerification({
      email: lowerEmail,
      codeHash,
      purpose: 'signup',
      pendingPayload: {
        name: cleanName,
        username: lowerUsername,
      },
      expiresAt,
    });

    // Send email dispatch
    await this.emailService.sendVerificationCode(lowerEmail, code, 'signup');

    const nodeEnv = this.configService.get<string>('NODE_ENV') ?? process.env.NODE_ENV;
    const allowDevCode = this.configService.get<string>('ALLOW_DEV_CODE') ?? process.env.ALLOW_DEV_CODE;
    const shouldIncludeDevCode = nodeEnv === 'development' && allowDevCode === 'true';

    return {
      message: 'ভেরিফিকেশন কোড আপনার ইমেইলে পাঠানো হয়েছে (Verification code sent to your email)',
      expires_in_seconds: 300,
      resend_cooldown_seconds: 60,
      dev_code: shouldIncludeDevCode ? code : undefined,
    };
  }

  async verifySignupCode(dto: { email: string; code: string }) {
    const lowerEmail = (dto.email || '').trim().toLowerCase();
    const code = (dto.code || '').trim();

    const verification = await this.db.findActiveVerification(lowerEmail, 'signup');
    if (!verification) {
      throw new BadRequestException('কোন সক্রিয় ভেরিফিকেশন কোড পাওয়া যায়নি। নতুন কোড অনুরোধ করুন।');
    }

    if (new Date() > new Date(verification.expires_at)) {
      await this.db.consumeVerification(verification.id);
      throw new BadRequestException('ভেরিফিকেশন কোডের মেয়াদ শেষ হয়ে গেছে। দয়া করে নতুন কোড নিন।');
    }

    if (verification.attempts >= 5) {
      await this.db.consumeVerification(verification.id);
      throw new BadRequestException('অতিরিক্ত ভুল চেষ্টা করা হয়েছে। কোডটি বাতিল করা হয়েছে।');
    }

    const isValid = await bcrypt.compare(code, verification.code_hash);
    if (!isValid) {
      await this.db.incrementVerificationAttempts(verification.id);
      throw new BadRequestException('ভুল ভেরিফিকেশন কোড। দয়া করে সঠিক কোড দিন।');
    }

    const payload = verification.pending_payload;
    if (!payload || !payload.username || !payload.name) {
      throw new BadRequestException('অনুরোধটির তথ্য পাওয়া যায়নি। পুনরায় রেজিস্ট্রেশন করুন।');
    }

    // Atomic creation with race-condition lock in DatabaseService
    const user = await this.db.createUserFromVerification({
      name: payload.name,
      username: payload.username,
      email: lowerEmail,
    });

    // Mark verification consumed
    await this.db.consumeVerification(verification.id);

    const tokens = this.generateTokens(user);

    return {
      user,
      isNewUser: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  // ==========================================================================
  // 3. Login Flow (Generic Response to prevent account enumeration)
  // ==========================================================================
  async requestLoginCode(dto: { identifier: string }, clientIp: string) {
    const identifier = (dto.identifier || '').trim().toLowerCase();

    // IP rate limit: max 20 per hour
    const ipRl = await this.db.checkAndIncrementRateLimit(`rl:ip:${clientIp}`, 20, 3600);
    if (!ipRl.allowed) {
      throw new HttpException(
        `আইপি থেকে অতিরিক্ত অনুরোধ করা হয়েছে। দয়া করে ${Math.ceil(ipRl.retryAfterSeconds / 60)} মিনিট পর চেষ্টা করুন।`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.db.getUserByIdentifier(identifier);

    const nodeEnv = this.configService.get<string>('NODE_ENV') ?? process.env.NODE_ENV;
    const allowDevCode = this.configService.get<string>('ALLOW_DEV_CODE') ?? process.env.ALLOW_DEV_CODE;
    const shouldIncludeDevCode = nodeEnv === 'development' && allowDevCode === 'true';

    // Account Enumeration Defense: If user doesn't exist, execute dummy delay and return identical message
    if (!user || !user.email) {
      await bcrypt.hash('dummy_salt_timing_mitigation', 10);
      return {
        message: 'যদি এই ইমেইল বা ইউজারনেমে কোনো অ্যাকাউন্ট থাকে, তবে ভেরিফিকেশন কোড পাঠানো হয়েছে।',
        expires_in_seconds: 300,
        resend_cooldown_seconds: 60,
      };
    }

    if (user.is_banned) {
      throw new UnauthorizedException('আপনার অ্যাকাউন্টটি সাময়িকভাবে স্থগিত করা হয়েছে।');
    }

    const targetEmail = user.email.toLowerCase();

    // Email rate limit & 60s resend cooldown
    const emailRl = await this.db.checkAndIncrementRateLimit(`rl:email:${targetEmail}`, 5, 3600, 60);
    if (!emailRl.allowed) {
      throw new HttpException(
        `দয়া করে ${emailRl.retryAfterSeconds} সেকেন্ড পর পুনরায় কোড পাঠানোর চেষ্টা করুন।`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    const salt = await bcrypt.genSalt(10);
    const codeHash = await bcrypt.hash(code, salt);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.db.createEmailVerification({
      email: targetEmail,
      codeHash,
      purpose: 'login',
      expiresAt,
    });

    await this.emailService.sendVerificationCode(targetEmail, code, 'login');

    return {
      message: 'যদি এই ইমেইল বা ইউজারনেমে কোনো অ্যাকাউন্ট থাকে, তবে ভেরিফিকেশন কোড পাঠানো হয়েছে।',
      expires_in_seconds: 300,
      resend_cooldown_seconds: 60,
      dev_code: shouldIncludeDevCode ? code : undefined,
    };
  }

  async verifyLoginCode(dto: { identifier: string; code: string }) {
    const identifier = (dto.identifier || '').trim().toLowerCase();
    const code = (dto.code || '').trim();

    const user = await this.db.getUserByIdentifier(identifier);
    if (!user || !user.email) {
      throw new BadRequestException('ভুল ভেরিফিকেশন কোড অথবা অ্যাকাউন্ট পাওয়া যায়নি।');
    }

    if (user.is_banned) {
      throw new UnauthorizedException('অ্যাকাউন্টটি স্থগিত করা হয়েছে।');
    }

    const verification = await this.db.findActiveVerification(user.email.toLowerCase(), 'login');
    if (!verification) {
      throw new BadRequestException('কোন সক্রিয় লগইন ভেরিফিকেশন কোড পাওয়া যায়নি।');
    }

    if (new Date() > new Date(verification.expires_at)) {
      await this.db.consumeVerification(verification.id);
      throw new BadRequestException('কোডের মেয়াদ শেষ হয়ে গেছে। নতুন কোড অনুরোধ করুন।');
    }

    if (verification.attempts >= 5) {
      await this.db.consumeVerification(verification.id);
      throw new BadRequestException('অতিরিক্ত ভুল চেষ্টা করা হয়েছে। নতুন কোড অনুরোধ করুন।');
    }

    const isValid = await bcrypt.compare(code, verification.code_hash);
    if (!isValid) {
      await this.db.incrementVerificationAttempts(verification.id);
      throw new BadRequestException('ভুল ভেরিফিকেশন কোড। দয়া করে আবার চেষ্টা করুন।');
    }

    await this.db.consumeVerification(verification.id);

    const tokens = this.generateTokens(user);

    return {
      user,
      isNewUser: false,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  // ==========================================================================
  // 4. Token Refresh & Logout
  // ==========================================================================
  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>(
          'JWT_REFRESH_SECRET',
          'super_secret_jwt_refresh_key_dhaka_boi_hat_2026',
        ),
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
      email: user.email,
      username: user.username,
      phone: user.phone,
      role: user.role,
      token_version: user.token_version || 1,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>(
        'JWT_ACCESS_SECRET',
        'super_secret_jwt_access_key_dhaka_boi_hat_2026',
      ),
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>(
        'JWT_REFRESH_SECRET',
        'super_secret_jwt_refresh_key_dhaka_boi_hat_2026',
      ),
      expiresIn: '30d',
    });

    return { accessToken, refreshToken };
  }

  // ==========================================================================
  // 5. Legacy Phone OTP Support (Retained per instruction #5)
  // ==========================================================================
  async requestOtp(rawPhone: string) {
    const phone = normalizePhone(rawPhone);
    if (!isValidBdPhone(phone)) {
      throw new BadRequestException('Please provide a valid Bangladeshi phone number (e.g. 01712345678)');
    }

    const rl = await this.db.checkAndIncrementRateLimit(`rl:phone:${phone}`, 3, 3600);
    if (!rl.allowed) {
      throw new BadRequestException('Too many OTP requests. Please wait an hour before requesting again.');
    }

    let code = crypto.randomInt(100000, 1000000).toString();
    if (
      phone === '+8801700000000' ||
      phone === '+8801711111111' ||
      phone === '+8801722222222' ||
      phone === '+8801733333333'
    ) {
      code = '123456';
    }

    const salt = await bcrypt.genSalt(10);
    const codeHash = await bcrypt.hash(code, salt);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.db.createEmailVerification({
      email: phone,
      codeHash,
      purpose: 'login',
      expiresAt,
    });

    const isDevMode = this.configService.get<string>('OTP_DEV_MODE', 'true') === 'true';
    this.logger.log(`[Phone OTP] Generated OTP for ${phone}: ${code} (Dev Mode: ${isDevMode})`);

    return {
      message: 'OTP sent successfully',
      phone,
      expires_in_seconds: 300,
      dev_otp: isDevMode ? code : undefined,
    };
  }

  async verifyOtp(rawPhone: string, code: string) {
    const phone = normalizePhone(rawPhone);
    const isDemoBypass =
      (phone === '+8801700000000' ||
        phone === '+8801711111111' ||
        phone === '+8801722222222' ||
        phone === '+8801733333333') &&
      code === '123456';

    if (!isDemoBypass) {
      const record = await this.db.findActiveVerification(phone, 'login');
      if (!record) {
        throw new BadRequestException('No active OTP found. Please request a new code.');
      }
      if (new Date() > new Date(record.expires_at)) {
        await this.db.consumeVerification(record.id);
        throw new BadRequestException('OTP has expired. Please request a new code.');
      }
      if (record.attempts >= 5) {
        await this.db.consumeVerification(record.id);
        throw new BadRequestException('Too many invalid attempts. Please request a new OTP.');
      }
      const isValid = await bcrypt.compare(code, record.code_hash);
      if (!isValid) {
        await this.db.incrementVerificationAttempts(record.id);
        throw new BadRequestException('Invalid OTP code. Please check and try again.');
      }
      await this.db.consumeVerification(record.id);
    }

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
}
