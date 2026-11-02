import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { SslCommerzProvider } from './sslcommerz.provider';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, SslCommerzProvider],
  exports: [PaymentsService, SslCommerzProvider],
})
export class PaymentsModule {}
