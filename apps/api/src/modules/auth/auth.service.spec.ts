import { AuthService } from './auth.service';
import { DatabaseService } from '../../common/database.service';
import { PrismaService } from '../../common/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('AuthService (Phone OTP & Token Generation)', () => {
  let authService: AuthService;
  let db: DatabaseService;
  let jwtService: JwtService;
  let configService: ConfigService;

  beforeEach(async () => {
    const prisma = new PrismaService();
    prisma.isConnected = false;
    db = new DatabaseService(prisma);
    await db.onModuleInit();

    jwtService = new JwtService();
    configService = new ConfigService({
      OTP_DEV_MODE: 'true',
      JWT_ACCESS_SECRET: 'test_access_secret',
      JWT_REFRESH_SECRET: 'test_refresh_secret',
    });

    authService = new AuthService(db, jwtService, configService);
  });

  it('should generate a 6-digit OTP and include dev_otp in response when dev mode is true', async () => {
    const res = await authService.requestOtp('01755555555');
    expect(res.phone).toBe('+8801755555555');
    expect(res.dev_otp).toHaveLength(6);
    expect(res.expires_in_seconds).toBe(300);
  });

  it('should verify correct OTP and return user, accessToken, and refreshToken', async () => {
    const phone = '01799999999';
    const otpRes = await authService.requestOtp(phone);
    const code = otpRes.dev_otp as string;

    const verifyRes = await authService.verifyOtp(phone, code);
    expect(verifyRes.user.phone).toBe('+8801799999999');
    expect(verifyRes.accessToken).toBeTruthy();
    expect(verifyRes.refreshToken).toBeTruthy();
  });

  it('should reject invalid OTP code', async () => {
    const phone = '01788888888';
    await authService.requestOtp(phone);

    await expect(authService.verifyOtp(phone, '000000')).rejects.toThrow('Invalid OTP code');
  });
});
