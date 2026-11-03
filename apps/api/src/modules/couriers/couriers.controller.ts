import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Headers,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { CouriersService } from './couriers.service';
import {
  CreateParcelDto,
  CourierProvider,
  CourierParcelStatus,
  WeightBucket,
} from '@boi-hat/shared-types';

@Controller('couriers')
export class CouriersController {
  constructor(private readonly couriersService: CouriersService) {}

  @UseGuards(JwtAuthGuard)
  @Post('parcels')
  async createParcel(@Req() req: any, @Body() dto: CreateParcelDto) {
    return this.couriersService.createParcel(req.user.id, dto);
  }

  @Get('track/:trackingId')
  async getTracking(@Param('trackingId') trackingId: string) {
    return this.couriersService.getParcelTracking(trackingId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('order/:orderId')
  async getParcelByOrderId(@Param('orderId') orderId: string) {
    return this.couriersService.getParcelByOrderId(orderId);
  }

  @Get('estimate')
  async getEstimate(
    @Query('city') city?: string,
    @Query('weight') weight?: WeightBucket,
    @Query('provider') provider?: CourierProvider,
  ) {
    return this.couriersService.estimateDeliveryFee(city, weight, provider);
  }

  @Post('webhooks/pathao')
  async handlePathaoWebhook(@Body() payload: any, @Headers() headers: any) {
    return this.couriersService.handleWebhook('pathao', payload, headers);
  }

  @Post('webhooks/steadfast')
  async handleSteadfastWebhook(@Body() payload: any, @Headers() headers: any) {
    return this.couriersService.handleWebhook('steadfast', payload, headers);
  }

  @Post('webhooks/redx')
  async handleRedxWebhook(@Body() payload: any, @Headers() headers: any) {
    return this.couriersService.handleWebhook('redx', payload, headers);
  }

  @Post('webhooks/:provider')
  async handleGenericWebhook(
    @Param('provider') provider: string,
    @Body() payload: any,
    @Headers() headers: any,
  ) {
    return this.couriersService.handleWebhook(provider, payload, headers);
  }

  // Dev simulation endpoint
  @Post('mock/simulate')
  async simulateCourierEvent(
    @Body()
    body: {
      tracking_id: string;
      status: CourierParcelStatus;
      location?: string;
      notes?: string;
    },
  ) {
    return this.couriersService.simulateCourierEvent(
      body.tracking_id,
      body.status,
      body.location,
      body.notes,
    );
  }
}

