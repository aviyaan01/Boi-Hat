import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../common/database.service';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly db: DatabaseService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: any) {
    return this.db.getUserById(req.user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(
    @Req() req: any,
    @Body()
    body: {
      name?: string;
      email?: string;
      city?: string;
      area?: string;
      avatar_url?: string;
    },
  ) {
    const updated = await this.db.updateUser(req.user.id, body);
    return updated;
  }

  @Get(':id/public')
  async getPublicProfile(@Param('id') id: string) {
    const profile = await this.db.getPublicSellerProfile(id);
    if (!profile) {
      throw new NotFoundException('Seller profile not found');
    }
    return profile;
  }
}

