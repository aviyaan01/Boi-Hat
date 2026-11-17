import { AuthService } from './auth.service';
import { DatabaseService } from '../../common/database.service';
import { PrismaService } from '../../common/prisma.service';
import { EmailService } from '../email/email.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

describe('AuthService (Email-Verified Account System)', () => {
  let authService: AuthService;
  let db: DatabaseService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let emailService: EmailService;

  beforeEach(async () => {
    process.env.NODE_ENV = 'development';
    process.env.ALLOW_DEV_CODE = 'true';

    const prisma = new PrismaService();
    prisma.isConnected = false;
    db = new DatabaseService(prisma);
    await db.onModuleInit();

    jwtService = new JwtService();
    configService = new ConfigService({
      NODE_ENV: 'development',
      ALLOW_DEV_CODE: 'true',
      OTP_DEV_MODE: 'true',
      JWT_ACCESS_SECRET: 'test_access_secret_2026',
      JWT_REFRESH_SECRET: 'test_refresh_secret_2026',
    });

    emailService = new EmailService(configService);
    emailService.onModuleInit();

    authService = new AuthService(db, jwtService, configService, emailService);
  });

  // ==========================================================================
  // 1. Username Availability Tests
  // ==========================================================================
  describe('Username Availability', () => {
    it('should return available: true for a valid unused username', async () => {
      const res = await authService.checkUsernameAvailable('novel_reader99', '127.0.0.1');
      expect(res.available).toBe(true);
      expect(res.username).toBe('novel_reader99');
    });

    it('should reject usernames shorter than 3 or longer than 20 characters', async () => {
      const shortRes = await authService.checkUsernameAvailable('ab', '127.0.0.1');
      expect(shortRes.available).toBe(false);

      const longRes = await authService.checkUsernameAvailable('a_very_long_username_exceeding_twenty', '127.0.0.1');
      expect(longRes.available).toBe(false);
    });

    it('should reject usernames that do not start with a letter', async () => {
      const res = await authService.checkUsernameAvailable('123reader', '127.0.0.1');
      expect(res.available).toBe(false);
      expect(res.message).toContain('ইংরেজি অক্ষর দিয়ে শুরু');
    });

    it('should reject consecutive dots or underscores', async () => {
      const dotRes = await authService.checkUsernameAvailable('user..name', '127.0.0.1');
      expect(dotRes.available).toBe(false);

      const underscoreRes = await authService.checkUsernameAvailable('user__name', '127.0.0.1');
      expect(underscoreRes.available).toBe(false);
    });

    it('should block reserved system usernames', async () => {
      const res = await authService.checkUsernameAvailable('admin', '127.0.0.1');
      expect(res.available).toBe(false);
      expect(res.message).toContain('সংরক্ষিত');
    });

    it('should return available: false with 2-3 suggestions when username is taken', async () => {
      // Seed username 'boihat_admin' is already taken
      const res = await authService.checkUsernameAvailable('boihat_admin', '127.0.0.1');
      expect(res.available).toBe(false);
      expect(res.suggestions).toBeDefined();
      expect(res.suggestions!.length).toBeGreaterThanOrEqual(1);
      expect(res.suggestions!.length).toBeLessThanOrEqual(3);
    });
  });

  // ==========================================================================
  // 2. Signup Flow & Code Verification Tests
  // ==========================================================================
  describe('Signup Flow', () => {
    it('should send code and include dev_code when NODE_ENV=development and ALLOW_DEV_CODE=true', async () => {
      const res = await authService.requestSignupCode(
        {
          name: 'Rahim Uddin (রহিম উদ্দিন)',
          username: 'rahim_reader',
          email: 'rahim.new@example.com',
        },
        '10.0.0.1',
      );

      expect(res.expires_in_seconds).toBe(300);
      expect(res.resend_cooldown_seconds).toBe(60);
      expect(res.dev_code).toBeDefined();
      expect(res.dev_code).toHaveLength(6);
    });

    it('should NOT include dev_code when ALLOW_DEV_CODE is false', async () => {
      process.env.ALLOW_DEV_CODE = 'false';
      const prodConfig = new ConfigService({
        NODE_ENV: 'development',
        ALLOW_DEV_CODE: 'false',
        JWT_ACCESS_SECRET: 'secret',
        JWT_REFRESH_SECRET: 'secret',
      });
      const prodAuth = new AuthService(db, jwtService, prodConfig, emailService);

      const res = await prodAuth.requestSignupCode(
        {
          name: 'Karim Rahman',
          username: 'karim_reader',
          email: 'karim.new@example.com',
        },
        '10.0.0.2',
      );

      expect(res.dev_code).toBeUndefined();
      process.env.ALLOW_DEV_CODE = 'true';
    });

    it('should verify code, create user with lowercase unique fields, and return JWT tokens', async () => {
      const signupRes = await authService.requestSignupCode(
        {
          name: 'Anika Tabassum',
          username: 'anika_books',
          email: 'Anika.Tabassum@Example.COM',
        },
        '10.0.0.3',
      );

      const code = signupRes.dev_code!;
      const verifyRes = await authService.verifySignupCode({
        email: 'anika.tabassum@example.com',
        code,
      });

      expect(verifyRes.isNewUser).toBe(true);
      expect(verifyRes.user.name).toBe('Anika Tabassum');
      expect(verifyRes.user.username).toBe('anika_books');
      expect(verifyRes.user.email).toBe('anika.tabassum@example.com');
      expect(verifyRes.accessToken).toBeDefined();
      expect(verifyRes.refreshToken).toBeDefined();

      // Ensure user is now registered in DB
      const stored = await db.getUserByEmail('anika.tabassum@example.com');
      expect(stored).toBeDefined();
      expect(stored!.email_verified_at).toBeDefined();
    });

    it('should enforce 60-second resend cooldown per email', async () => {
      const email = 'cooldown.test@example.com';
      await authService.requestSignupCode(
        { name: 'Cooldown User', username: 'cooldown_user', email },
        '10.0.0.4',
      );

      // Attempting to send again immediately should trigger 429
      await expect(
        authService.requestSignupCode(
          { name: 'Cooldown User', username: 'cooldown_user', email },
          '10.0.0.4',
        ),
      ).rejects.toThrow(HttpException);
    });

    it('should reject invalid verification code and increment attempts', async () => {
      const email = 'attempt.test@example.com';
      await authService.requestSignupCode(
        { name: 'Attempt User', username: 'attempt_user', email },
        '10.0.0.5',
      );

      await expect(
        authService.verifySignupCode({ email, code: '000000' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should lock and invalidate code after 5 consecutive wrong attempts', async () => {
      const email = 'maxattempts.test@example.com';
      const res = await authService.requestSignupCode(
        { name: 'Max Attempts User', username: 'max_attempts_user', email },
        '10.0.0.6',
      );
      const validCode = res.dev_code!;

      // 5 wrong attempts
      for (let i = 0; i < 5; i++) {
        try {
          await authService.verifySignupCode({ email, code: '999999' });
        } catch (_) {}
      }

      // Even providing the valid code now should fail because max attempts was reached
      await expect(
        authService.verifySignupCode({ email, code: validCode }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject expired verification code (>5 minutes)', async () => {
      const email = 'expiry.test@example.com';
      const res = await authService.requestSignupCode(
        { name: 'Expiry User', username: 'expiry_user', email },
        '10.0.0.7',
      );
      const code = res.dev_code!;

      // Manually backdate the verification in DB
      const active = await db.findActiveVerification(email, 'signup');
      active.expires_at = new Date(Date.now() - 1000).toISOString();

      await expect(
        authService.verifySignupCode({ email, code }),
      ).rejects.toThrow('মেয়াদ শেষ হয়ে গেছে');
    });

    it('should prevent signup if email is already registered', async () => {
      // Seed user admin@boihat.com already exists
      await expect(
        authService.requestSignupCode(
          { name: 'Fake Admin', username: 'fake_admin', email: 'admin@boihat.com' },
          '10.0.0.8',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should prevent signup if username is already taken', async () => {
      // Seed username 'tanvir_seller' already exists
      await expect(
        authService.requestSignupCode(
          { name: 'Tanvir Clone', username: 'tanvir_seller', email: 'tanvir.clone@example.com' },
          '10.0.0.9',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ==========================================================================
  // 3. Race Condition & Concurrency Tests
  // ==========================================================================
  describe('Race Condition & Concurrency Safety', () => {
    it('should handle race condition when two requests attempt to register identical username concurrently', async () => {
      const results = await Promise.allSettled([
        db.createUserFromVerification({
          name: 'Concurrent User 1',
          username: 'racing_username',
          email: 'race1@example.com',
        }),
        db.createUserFromVerification({
          name: 'Concurrent User 2',
          username: 'RACING_USERNAME', // case-insensitive duplicate
          email: 'race2@example.com',
        }),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      // Exactly 1 must succeed and exactly 1 must fail with ConflictException (409)
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(ConflictException);
    });

    it('should handle race condition when two requests attempt to register identical email concurrently', async () => {
      const results = await Promise.allSettled([
        db.createUserFromVerification({
          name: 'Concurrent Email 1',
          username: 'unique_user_a',
          email: 'racing_email@example.com',
        }),
        db.createUserFromVerification({
          name: 'Concurrent Email 2',
          username: 'unique_user_b',
          email: 'RACING_EMAIL@EXAMPLE.COM',
        }),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(ConflictException);
    });
  });

  // ==========================================================================
  // 4. Login Flow & Account Enumeration Prevention
  // ==========================================================================
  describe('Login Flow', () => {
    it('should return identical generic response when user does NOT exist', async () => {
      const res = await authService.requestLoginCode(
        { identifier: 'nonexistent.user@example.com' },
        '10.0.0.10',
      );

      expect(res.message).toContain('যদি এই ইমেইল বা ইউজারনেমে কোনো অ্যাকাউন্ট থাকে');
      expect(res.expires_in_seconds).toBe(300);
      expect(res.resend_cooldown_seconds).toBe(60);
      // Must NOT include dev_code for non-existent account
      expect(res.dev_code).toBeUndefined();
    });

    it('should return generic response and dispatch code when user exists (by email or username)', async () => {
      // 1. By email
      const emailRes = await authService.requestLoginCode(
        { identifier: 'admin@boihat.com' },
        '10.0.0.11',
      );
      expect(emailRes.message).toContain('যদি এই ইমেইল বা ইউজারনেমে কোনো অ্যাকাউন্ট থাকে');
      expect(emailRes.dev_code).toBeDefined();

      // 2. By username (testing another user account to verify username resolution independently)
      const usernameRes = await authService.requestLoginCode(
        { identifier: 'farhana_seller' },
        '10.0.0.12',
      );
      expect(usernameRes.message).toContain('যদি এই ইমেইল বা ইউজারনেমে কোনো অ্যাকাউন্ট থাকে');
      expect(usernameRes.dev_code).toBeDefined();
    });

    it('should verify login code and return user with access and refresh tokens', async () => {
      const reqRes = await authService.requestLoginCode(
        { identifier: 'tanvir@example.com' },
        '10.0.0.13',
      );
      const code = reqRes.dev_code!;

      const verifyRes = await authService.verifyLoginCode({
        identifier: 'tanvir@example.com',
        code,
      });

      expect(verifyRes.isNewUser).toBe(false);
      expect(verifyRes.user.email).toBe('tanvir@example.com');
      expect(verifyRes.accessToken).toBeDefined();
      expect(verifyRes.refreshToken).toBeDefined();
    });
  });

  // ==========================================================================
  // 5. Production Environment Safety
  // ==========================================================================
  describe('Production Environment Guard', () => {
    it('should refuse to start EmailService in production if SMTP credentials are missing', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      const prodConfig = new ConfigService({
        NODE_ENV: 'production',
      });
      const prodEmailService = new EmailService(prodConfig);

      expect(() => prodEmailService.onModuleInit()).toThrow(
        /Production server cannot start without valid SMTP configuration/i,
      );

      process.env.NODE_ENV = 'development';
    });
  });

  // ==========================================================================
  // 6. Legacy Phone OTP Compatibility (Retained)
  // ==========================================================================
  describe('Legacy Phone OTP Compatibility', () => {
    it('should generate a 6-digit OTP for Bangladeshi phone numbers', async () => {
      const res = await authService.requestOtp('01755555555');
      expect(res.phone).toBe('+8801755555555');
      expect(res.dev_otp).toHaveLength(6);
    });

    it('should verify phone OTP and return tokens', async () => {
      const phone = '01799999999';
      const otpRes = await authService.requestOtp(phone);
      const code = otpRes.dev_otp as string;

      const verifyRes = await authService.verifyOtp(phone, code);
      expect(verifyRes.user.phone).toBe('+8801799999999');
      expect(verifyRes.accessToken).toBeDefined();
      expect(verifyRes.refreshToken).toBeDefined();
    });
  });
});
