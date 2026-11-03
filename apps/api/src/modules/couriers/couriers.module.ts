import { Module } from '@nestjs/common';
import { CouriersController } from './couriers.controller';
import { CouriersService } from './couriers.service';
import { PathaoCourierProvider } from './providers/pathao.provider';
import { SteadfastCourierProvider } from './providers/steadfast.provider';
import { RedxCourierProvider } from './providers/redx.provider';

@Module({
  controllers: [CouriersController],
  providers: [
    CouriersService,
    PathaoCourierProvider,
    SteadfastCourierProvider,
    RedxCourierProvider,
  ],
  exports: [CouriersService],
})
export class CouriersModule {}

