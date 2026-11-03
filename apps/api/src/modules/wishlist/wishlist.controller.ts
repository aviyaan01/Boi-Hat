import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { DatabaseService } from '../../common/database.service';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly db: DatabaseService) {}

  @Get('wishlist')
  async getMyWishlist(@Req() req: any) {
    return this.db.getWishlist(req.user.id);
  }

  @Get('wishlist/check/:bookId')
  async checkWishlist(@Req() req: any, @Param('bookId') bookId: string) {
    const isWishlisted = await this.db.isBookWishlisted(req.user.id, bookId);
    return { isWishlisted };
  }

  @Post('wishlist/:bookId')
  async addToWishlist(@Req() req: any, @Param('bookId') bookId: string) {
    return this.db.addToWishlist(req.user.id, bookId);
  }

  @Delete('wishlist/:bookId')
  async removeFromWishlist(@Req() req: any, @Param('bookId') bookId: string) {
    return this.db.removeFromWishlist(req.user.id, bookId);
  }

  // Saved Searches (Section 7 & 9)
  @Get('saved-searches')
  async getSavedSearches(@Req() req: any) {
    return this.db.getSavedSearches(req.user.id);
  }

  @Post('saved-searches')
  async saveSearch(
    @Req() req: any,
    @Body() body: { query_json: any; notify_enabled?: boolean },
  ) {
    return this.db.saveSearch(req.user.id, body.query_json, body.notify_enabled ?? true);
  }

  @Delete('saved-searches/:id')
  async deleteSavedSearch(@Req() req: any, @Param('id') id: string) {
    return this.db.deleteSavedSearch(req.user.id, id);
  }
}

