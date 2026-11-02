import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../../common/database.service';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../../common/jwt-auth.guard';

@Controller()
export class RecommendationsController {
  constructor(private readonly db: DatabaseService) {}

  // 1. Onboarding Preferences (Section 9.1)
  @Post('users/me/preferences/onboarding')
  @UseGuards(JwtAuthGuard)
  async saveOnboarding(
    @Req() req: any,
    @Body()
    body: {
      category_ids: string[];
      author_ids?: string[];
      languages?: string[];
    },
  ) {
    if (!body.category_ids || body.category_ids.length < 3) {
      throw new BadRequestException('অনুগ্রহ করে সর্বনিম্ন ৩টি পছন্দের ক্যাটাগরি নির্বাচন করুন।');
    }

    return this.db.saveOnboardingPreferences(req.user.id, body);
  }

  @Get('users/me/preferences')
  @UseGuards(JwtAuthGuard)
  async getPreferences(@Req() req: any) {
    return this.db.getUserPreferences(req.user.id);
  }

  // 2. Personalized Feed with Stage 1 Scoring (Section 9.2)
  @Get('books/personalized/feed')
  @UseGuards(OptionalJwtAuthGuard)
  async getPersonalizedFeed(
    @Req() req: any,
    @Query('limit') limit?: number,
  ) {
    const userId = req.user?.id;
    return this.db.getPersonalizedFeed(userId, limit ? Number(limit) : 8);
  }

  // 3. Behavior Event Logging (Section 9.2 Stage 2)
  @Post('events/behavior')
  @UseGuards(OptionalJwtAuthGuard)
  async logEvent(
    @Req() req: any,
    @Body()
    body: {
      action_type: string;
      book_id?: string;
      metadata?: any;
    },
  ) {
    const userId = req.user?.id || 'anonymous';
    return this.db.logBehaviorEvent(userId, body.action_type, body.book_id, body.metadata);
  }

  // 4. Notifications (Section 9.2 Stage 3 & Section 7)
  @Get('notifications')
  @UseGuards(JwtAuthGuard)
  async getNotifications(@Req() req: any) {
    return this.db.getNotifications(req.user.id);
  }

  @Patch('notifications/:id/read')
  @UseGuards(JwtAuthGuard)
  async markRead(@Req() req: any, @Param('id') id: string) {
    return this.db.markNotificationRead(id, req.user.id);
  }

  @Patch('notifications/read-all')
  @UseGuards(JwtAuthGuard)
  async markAllRead(@Req() req: any) {
    return this.db.markAllNotificationsRead(req.user.id);
  }
}
