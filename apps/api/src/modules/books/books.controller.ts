import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../../common/database.service';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { CreateBookDto } from './dto/book.dto';
import { BookFilterQuery, Role, BookStatus } from '@boi-hat/shared-types';

@Controller()
export class BooksController {
  constructor(private readonly db: DatabaseService) {}

  @Get('books')
  async getBooks(@Query() query: BookFilterQuery) {
    return this.db.getBooks(query);
  }

  @Get('books/:id')
  async getBookById(@Param('id') id: string) {
    const book = await this.db.getBookById(id);
    if (!book) {
      throw new NotFoundException('Book not found');
    }
    return book;
  }

  @Post('books')
  @UseGuards(JwtAuthGuard)
  async createBook(@Req() req: any, @Body() dto: CreateBookDto) {
    // If rare book, enforce minimum 5 photos per Section 5.1 & Section 15
    if (dto.is_rare && (!dto.images || dto.images.length < 5)) {
      throw new BadRequestException(
        'Rare & Vintage listings strictly require a minimum of 5 photos (cover, spine, title page, and damage/condition close-up).',
      );
    }

    const created = await this.db.createBook({
      ...dto,
      seller_id: req.user.id,
    });

    return created;
  }

  @Patch('books/:id')
  @UseGuards(JwtAuthGuard)
  async updateBook(@Param('id') id: string, @Req() req: any, @Body() body: any) {
    const book = await this.db.getBookById(id);
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    // Ownership check per Section 16
    if (book.seller_id !== req.user.id && req.user.role !== Role.ADMIN) {
      throw new ForbiddenException('You do not have permission to modify this listing');
    }

    const updated = await this.db.updateBook(id, body);
    return updated;
  }

  @Delete('books/:id')
  @UseGuards(JwtAuthGuard)
  async deleteBook(@Param('id') id: string, @Req() req: any) {
    const book = await this.db.getBookById(id);
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    // Ownership check per Section 16
    if (book.seller_id !== req.user.id && req.user.role !== Role.ADMIN) {
      throw new ForbiddenException('You do not have permission to delete this listing');
    }

    return this.db.deleteBook(id);
  }

  @Post('books/upload-signature')
  @UseGuards(JwtAuthGuard)
  async getUploadSignature() {
    const timestamp = Math.round(new Date().getTime() / 1000);
    // In dev mode, return structured signed payload for Cloudinary or direct upload mock
    return {
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
      apiKey: process.env.CLOUDINARY_API_KEY || 'demo_key',
      signature: 'dev_mock_signature_' + timestamp,
      folder: 'boi_hat_listings',
    };
  }

  @Get('authors/search')
  async searchAuthors(@Query('q') q: string) {
    return this.db.searchAuthors(q || '');
  }

  @Post('authors/request-new')
  @UseGuards(JwtAuthGuard)
  async requestNewAuthor(
    @Body() body: { name_en: string; name_bn: string },
  ) {
    if (!body.name_en || !body.name_bn) {
      throw new BadRequestException('Both English and Bengali author names are required.');
    }
    return this.db.createAuthorRequest(body);
  }

  @Get('publishers')
  async getPublishers() {
    return this.db.getPublishers();
  }
}
