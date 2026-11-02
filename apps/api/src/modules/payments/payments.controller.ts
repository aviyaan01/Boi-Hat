import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  Res,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { PaymentInitDto } from '@boi-hat/shared-types';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('init')
  async initPayment(@Req() req: any, @Body() dto: PaymentInitDto) {
    return this.paymentsService.initPayment(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sslcommerz/init')
  async initSslCommerz(@Req() req: any, @Body() dto: PaymentInitDto) {
    return this.paymentsService.initPayment(req.user.id, dto);
  }

  @Post('sslcommerz/webhook')
  async handleWebhook(@Body() payload: any) {
    return this.paymentsService.handleWebhook(payload);
  }

  @Post('sslcommerz/ipn')
  async handleIpn(@Body() payload: any) {
    return this.paymentsService.handleWebhook(payload);
  }

  @Post('sslcommerz/success')
  async handleSuccess(@Body() payload: any, @Res() res: Response) {
    await this.paymentsService.handleWebhook({ ...payload, status: 'VALID' });
    const redirectUrl = payload.redirect_url || `/orders?payment=success&tran_id=${payload.tran_id}`;
    return res.redirect(redirectUrl);
  }

  @Post('sslcommerz/fail')
  async handleFail(@Body() payload: any, @Res() res: Response) {
    await this.paymentsService.handleWebhook({ ...payload, status: 'FAILED' });
    const redirectUrl = `/orders?payment=failed&tran_id=${payload.tran_id}`;
    return res.redirect(redirectUrl);
  }

  @Post('sslcommerz/cancel')
  async handleCancel(@Body() payload: any, @Res() res: Response) {
    await this.paymentsService.handleWebhook({ ...payload, status: 'CANCELLED' });
    const redirectUrl = `/orders?payment=cancelled&tran_id=${payload.tran_id}`;
    return res.redirect(redirectUrl);
  }

  @Post('mock/complete')
  async mockComplete(
    @Body() body: { transaction_id: string; status: 'paid' | 'failed' | 'cancelled' },
  ) {
    return this.paymentsService.handleMockComplete(body.transaction_id, body.status);
  }

  @Get('status/:tranId')
  async getPaymentStatus(@Param('tranId') tranId: string) {
    return this.paymentsService.getPaymentByTransactionId(tranId);
  }
}
