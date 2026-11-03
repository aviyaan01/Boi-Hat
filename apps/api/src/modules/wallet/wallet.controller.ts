import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { DatabaseService } from '../../common/database.service';
import { PayoutRequestDto } from '@boi-hat/shared-types';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  async getWallet(@Req() req: any) {
    return this.db.getWalletSummary(req.user.id);
  }

  @Post('release-pending')
  async releasePendingFunds() {
    return this.db.releaseExpiredDisputes();
  }

  @Post('payout-request')
  async requestPayout(@Req() req: any, @Body() body: PayoutRequestDto) {
    if (!body.amount || !body.method || !body.account_number) {
      throw new BadRequestException('উত্তোলনের পরিমাণ, মাধ্যম ও অ্যাকাউন্ট নম্বর আবশ্যক');
    }
    return this.db.requestPayout(req.user.id, body);
  }
}

