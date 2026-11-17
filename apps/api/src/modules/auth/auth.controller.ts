import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  SignupRequestCodeDto,
  SignupVerifyCodeDto,
  LoginRequestCodeDto,
  LoginVerifyCodeDto,
  RequestOtpDto,
  VerifyOtpDto,
  RefreshTokenDto,
} from './dto/auth.dto';
import { Response, Request } from 'express';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private extractClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || '127.0.0.1';
  }

  // ==========================================================================
  // Username Availability
  // ==========================================================================
  @Get('username-available')
  @HttpCode(HttpStatus.OK)
  async checkUsernameAvailable(@Query('u') u: string, @Req() req: Request) {
    const ip = this.extractClientIp(req);
    return this.authService.checkUsernameAvailable(u, ip);
  }

  // ==========================================================================
  // Signup with Email Verification
  // ==========================================================================
  @Post('signup/request-code')
  @HttpCode(HttpStatus.OK)
  async requestSignupCode(
    @Body() dto: SignupRequestCodeDto,
    @Req() req: Request,
  ) {
    const ip = this.extractClientIp(req);
    return this.authService.requestSignupCode(dto, ip);
  }

  @Post('signup/verify-code')
  @HttpCode(HttpStatus.OK)
  async verifySignupCode(
    @Body() dto: SignupVerifyCodeDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifySignupCode(dto);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/auth/refresh',
    });

    return {
      user: result.user,
      isNewUser: result.isNewUser,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  // ==========================================================================
  // Login with Email / Username Verification
  // ==========================================================================
  @Post('login/request-code')
  @HttpCode(HttpStatus.OK)
  async requestLoginCode(
    @Body() dto: LoginRequestCodeDto,
    @Req() req: Request,
  ) {
    const ip = this.extractClientIp(req);
    return this.authService.requestLoginCode(dto, ip);
  }

  @Post('login/verify-code')
  @HttpCode(HttpStatus.OK)
  async verifyLoginCode(
    @Body() dto: LoginVerifyCodeDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyLoginCode(dto);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/auth/refresh',
    });

    return {
      user: result.user,
      isNewUser: result.isNewUser,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  // ==========================================================================
  // Token Refresh & Logout
  // ==========================================================================
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Body() dto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.refreshToken || dto.refreshToken;
    const tokens = await this.authService.refreshToken(token);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/auth/refresh',
    });

    return tokens;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refreshToken', { path: '/auth/refresh' });
    return { message: 'Logged out successfully' };
  }

  // ==========================================================================
  // Legacy Phone OTP Routes (Retained per instruction #5)
  // ==========================================================================
  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  async requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto.phone);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyOtp(dto.phone, dto.code);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/auth/refresh',
    });

    return {
      user: result.user,
      isNewUser: result.isNewUser,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }
}
