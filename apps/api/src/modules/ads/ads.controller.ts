import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { DatabaseService } from '../../common/database.service';
import { FeaturedPackage, PaymentMethod } from '@boi-hat/shared-types';
import { PaymentsService } from '../payments/payments.service';

@Controller()
export class AdsController {
  constructor(
    private readonly db: DatabaseService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Get('ad-packages')
  getAdPackages() {
    return this.db.getAdPackages();
  }

  @UseGuards(JwtAuthGuard)
  @Post('books/:id/feature')
  async featureBook(
    @Req() req: any,
    @Param('id') bookId: string,
    @Body() body: { package_type: FeaturedPackage; payment_method?: PaymentMethod; pay_now?: boolean },
  ) {
    if (!body.package_type) {
      throw new BadRequestException('প্যাকেজ নির্বাচন আবশ্যক');
    }

    const pkg = await this.db.getAdPackage(body.package_type);
    if (!pkg) {
      throw new BadRequestException('অবৈধ বিজ্ঞাপন প্যাকেজ');
    }

    const book = await this.db.getBookById(bookId);
    if (!book) {
      throw new BadRequestException('বইটি পাওয়া যায়নি');
    }

    if (book.seller_id !== req.user.id) {
      throw new BadRequestException('শুধুমাত্র বইটির বিক্রেতা বিজ্ঞাপন বুস্ট করতে পারবেন');
    }

    // If online payment requested, initialize payment session
    if (body.pay_now !== false) {
      const paymentInit = await this.paymentsService.initPayment(req.user.id, {
        amount: pkg.price,
        book_id: bookId,
        ad_package: body.package_type,
      });

      return {
        requires_payment: true,
        payment_id: paymentInit.payment_id,
        transaction_id: paymentInit.transaction_id,
        gateway_url: paymentInit.gateway_url,
        amount: pkg.price,
        package: pkg,
      };
    }

    // Otherwise activate directly (e.g. for testing / pre-paid flow)
    const ad = await this.db.createFeaturedAd(req.user.id, bookId, body.package_type);
    return {
      requires_payment: false,
      ad,
      message: 'বিজ্ঞাপন সফলভাবে বুস্ট করা হয়েছে',
    };
  }

  @Get('books/:id/featured-status')
  async getBookFeaturedStatus(@Param('id') bookId: string) {
    const activeAds = await this.db.getActiveFeaturedAds(bookId);
    return {
      is_featured: activeAds.length > 0,
      active_ad: activeAds[0] || null,
    };
  }

  @Post('admin/ads/expire-check')
  async runExpiryCheck() {
    return this.db.checkExpiredAds();
  }
}
