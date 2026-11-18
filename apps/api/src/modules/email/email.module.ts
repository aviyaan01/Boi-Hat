import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { BrevoEmailProvider } from './brevo-email.provider';

@Module({
  providers: [BrevoEmailProvider, EmailService],
  exports: [EmailService, BrevoEmailProvider],
})
export class EmailModule {}
