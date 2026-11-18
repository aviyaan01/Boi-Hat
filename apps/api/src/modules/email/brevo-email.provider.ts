import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SendEmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

@Injectable()
export class BrevoEmailProvider {
  private readonly logger = new Logger(BrevoEmailProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    const apiKey = this.configService.get<string>('BREVO_API_KEY') ?? process.env.BREVO_API_KEY;
    if (!apiKey || apiKey.trim().length === 0) {
      this.logger.error('Brevo API key is missing');
      throw new ServiceUnavailableException('ইমেইল পাঠানো যায়নি, কিছুক্ষণ পর চেষ্টা করুন');
    }

    const rawSender =
      this.configService.get<string>('BREVO_SENDER_EMAIL') ??
      process.env.BREVO_SENDER_EMAIL ??
      this.configService.get<string>('SMTP_FROM') ??
      process.env.SMTP_FROM ??
      'no-reply@boihat.com';

    // Parse email out of "Name <email@domain.com>" if present
    const emailMatch = rawSender.match(/<([^>]+)>/);
    const senderEmail = (emailMatch ? emailMatch[1] : rawSender).trim();
    const senderName = 'Boi-Hat';

    const payload = {
      sender: { name: senderName, email: senderEmail },
      to: [{ email: options.to }],
      subject: options.subject,
      htmlContent: options.htmlContent,
      textContent: options.textContent || undefined,
    };

    const maxAttempts = 2; // 1 attempt + 1 transient retry
    let attempt = 0;

    while (attempt < maxAttempts) {
      attempt++;
      try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': apiKey.trim(),
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json().catch(() => ({}));
          this.logger.log(`Brevo email dispatched to ${options.to} (messageId: ${(data as any).messageId || 'ok'})`);
          return true;
        }

        const status = response.status;
        const errorText = await response.text();
        this.logger.warn(`Brevo API returned error status ${status} on attempt ${attempt}: ${errorText}`);

        // Transient retry on 5xx server errors
        if (status >= 500 && attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }

        throw new ServiceUnavailableException('ইমেইল পাঠানো যায়নি, কিছুক্ষণ পর চেষ্টা করুন');
      } catch (err: any) {
        if (err instanceof ServiceUnavailableException) {
          throw err;
        }
        this.logger.error(`Brevo network exception on attempt ${attempt}: ${err.message}`);
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }
        throw new ServiceUnavailableException('ইমেইল পাঠানো যায়নি, কিছুক্ষণ পর চেষ্টা করুন');
      }
    }

    throw new ServiceUnavailableException('ইমেইল পাঠানো যায়নি, কিছুক্ষণ পর চেষ্টা করুন');
  }
}
