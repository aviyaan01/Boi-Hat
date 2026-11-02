import { IsNotEmpty, IsString, Length } from 'class-validator';

export class RequestOtpDto {
  @IsNotEmpty()
  @IsString()
  phone: string;
}

export class VerifyOtpDto {
  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  @Length(4, 6)
  code: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken?: string;
}

