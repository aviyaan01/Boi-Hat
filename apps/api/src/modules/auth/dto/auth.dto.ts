import {
  IsNotEmpty,
  IsString,
  IsEmail,
  Length,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class RequestUsernameAvailableDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  u: string;
}

export class SignupRequestCodeDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2, { message: 'নাম কমপক্ষে ২ অক্ষরের হতে হবে (Name must be at least 2 characters)' })
  @MaxLength(60, { message: 'নাম সর্বোচ্চ ৬০ অক্ষরের হতে পারবে (Name must not exceed 60 characters)' })
  name: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(3, { message: 'ইউজারনেম কমপক্ষে ৩ অক্ষরের হতে হবে (Username must be at least 3 characters)' })
  @MaxLength(20, { message: 'ইউজারনেম সর্বোচ্চ ২০ অক্ষরের হতে পারবে (Username must not exceed 20 characters)' })
  @Matches(/^[a-zA-Z][a-zA-Z0-9_.]*$/, {
    message: 'ইউজারনেম অবশ্যই ইংরেজি অক্ষর দিয়ে শুরু হতে হবে এবং শুধু a-z, 0-9, _, . থাকতে পারবে',
  })
  username: string;

  @IsNotEmpty()
  @IsEmail({}, { message: 'সঠিক ইমেইল ঠিকানা প্রদান করুন (Please provide a valid email address)' })
  email: string;
}

export class SignupVerifyCodeDto {
  @IsNotEmpty()
  @IsEmail({}, { message: 'সঠিক ইমেইল ঠিকানা প্রদান করুন (Please provide a valid email address)' })
  email: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'কোডটি অবশ্যই ৬ ডিজিটের হতে হবে (Code must be 6 digits)' })
  code: string;
}

export class LoginRequestCodeDto {
  @IsNotEmpty({ message: 'ইমেইল অথবা ইউজারনেম লিখুন (Please enter email or username)' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  identifier: string;
}

export class LoginVerifyCodeDto {
  @IsNotEmpty({ message: 'ইমেইল অথবা ইউজারনেম লিখুন (Please enter email or username)' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  identifier: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'কোডটি অবশ্যই ৬ ডিজিটের হতে হবে (Code must be 6 digits)' })
  code: string;
}

// Backward compatibility for phone OTP
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
