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
import { CreateReviewDto } from '@boi-hat/shared-types';

@Controller()
export class ReviewsController {
  constructor(private readonly db: DatabaseService) {}

  @UseGuards(JwtAuthGuard)
  @Post('orders/:id/review')
  async createReview(
    @Req() req: any,
    @Param('id') orderId: string,
    @Body() body: CreateReviewDto,
  ) {
    if (!body.rating || body.rating < 1 || body.rating > 5) {
      throw new BadRequestException('রেটিং ১ থেকে ৫ এর মধ্যে হতে হবে');
    }
    return this.db.createReview(req.user.id, orderId, body.rating, body.comment);
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders/:id/review')
  async getOrderReview(@Param('id') orderId: string) {
    return this.db.getReviewForOrder(orderId);
  }

  @Get('users/:id/reviews')
  async getUserReviews(@Param('id') userId: string) {
    return this.db.getReviewsForUser(userId);
  }
}

