import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface IEmailService {
  sendVerificationCode(to: string, code: string, purpose: 'signup' | 'login'): Promise<boolean>;
}

@Injectable()
export class EmailService implements IEmailService, OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const isProduction = (this.configService.get<string>('NODE_ENV') ?? process.env.NODE_ENV) === 'production';
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT', 587);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const from = this.configService.get<string>('SMTP_FROM', 'Boi-Hat <no-reply@boihat.com>');

    if (host && user && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port: Number(port),
          secure: Number(port) === 465,
          auth: { user, pass },
        });
        this.isConfigured = true;
        this.logger.log(`SMTP configured successfully with host: ${host}`);
      } catch (err) {
        this.logger.error(`Failed to initialize SMTP transporter: ${err.message}`);
        if (isProduction) {
          throw new Error(`Production requires valid SMTP configuration! Could not initialize SMTP: ${err.message}`);
        }
      }
    } else {
      if (isProduction) {
        throw new Error(
          'CRITICAL: Production server cannot start without valid SMTP configuration! Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM in .env.',
        );
      }
      this.logger.warn('SMTP not configured in development mode. Verification codes will be printed to server console.');
    }
  }

  async sendVerificationCode(to: string, code: string, purpose: 'signup' | 'login'): Promise<boolean> {
    const isProduction = (this.configService.get<string>('NODE_ENV') ?? process.env.NODE_ENV) === 'production';
    const actionTextBn = purpose === 'signup' ? 'রেজিস্ট্রেশন' : 'লগইন';
    const actionTextEn = purpose === 'signup' ? 'sign up for' : 'log in to';

    const subject = purpose === 'signup'
      ? 'বই-হাট অ্যাকাউন্ট ভেরিফিকেশন কোড'
      : 'বই-হাট লগইন ভেরিফিকেশন কোড';

    const textContent = `
আপনার বই-হাট ভেরিফিকেশন কোড: ${code}.
কোডটি ৫ মিনিট পর্যন্ত কার্যকর থাকবে। এই কোড কাউকে শেয়ার করবেন না।

---
Your Boi-Hat verification code is: ${code}.
The code is valid for 5 minutes. Do not share this code with anyone.
    `.trim();

    const htmlContent = `
<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #059669; margin: 0; font-size: 28px;">বই-হাট (Boi-Hat)</h1>
    <p style="color: #64748b; font-size: 14px; margin-top: 4px;">বাংলাদেশের বইপ্রেমীদের বিশ্বস্ত মার্কেটপ্লেস</p>
  </div>
  <div style="background-color: #ecfdf5; border-left: 4px solid #059669; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
    <p style="margin: 0; color: #065f46; font-size: 15px; font-weight: bold;">
      ${actionTextBn} নিশ্চিত করতে নিচের ৬ ডিজিটের ভেরিফিকেশন কোডটি ব্যবহার করুন:
    </p>
  </div>
  <div style="text-align: center; margin: 32px 0;">
    <span style="display: inline-block; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #0f172a; background-color: #f1f5f9; padding: 12px 28px; border-radius: 8px; border: 1px dashed #059669;">
      ${code}
    </span>
  </div>
  <p style="color: #334155; font-size: 14px; line-height: 1.6;">
    ⏱️ <strong>কোডটি ৫ মিনিট পর্যন্ত কার্যকর থাকবে।</strong><br>
    🔒 <strong>নিরাপত্তা সতর্কতা:</strong> বই-হাট প্রতিনিধি কখনো আপনার কাছে এই কোড জানতে চাইবে না। এই কোড কাউকে শেয়ার করবেন না।
  </p>
  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;">
  <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
    Your Boi-Hat verification code to ${actionTextEn} your account is <strong>${code}</strong>. Valid for 5 minutes. Never share this code with anyone.
  </p>
  <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 12px;">
    &copy; ${new Date().getFullYear()} বই-হাট (Boi-Hat). সর্বস্বত্ব সংরক্ষিত।
  </div>
</div>
    `.trim();

    if (!isProduction) {
      this.logger.log(`\n======================================================\n📧 [EMAIL DISPATCH - DEV LOG]\nTo: ${to}\nPurpose: ${purpose.toUpperCase()}\nCode: ${code}\nValid: 5 Minutes\n======================================================`);
    }

    if (this.isConfigured && this.transporter) {
      try {
        const from = this.configService.get<string>('SMTP_FROM', 'Boi-Hat <no-reply@boihat.com>');
        await this.transporter.sendMail({
          from,
          to,
          subject,
          text: textContent,
          html: htmlContent,
        });
        this.logger.log(`Email successfully dispatched to ${to}`);
        return true;
      } catch (err) {
        this.logger.error(`Error sending email to ${to}: ${err.message}`);
        if (isProduction) {
          throw err;
        }
        return false;
      }
    }

    return true;
  }
}
