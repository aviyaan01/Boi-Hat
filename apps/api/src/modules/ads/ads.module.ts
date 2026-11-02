import { Module } from '@nestjs/common';
import { AdsController } from './ads.controller';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [PaymentsModule],
  controllers: [AdsController],
})
export class AdsModule {}
