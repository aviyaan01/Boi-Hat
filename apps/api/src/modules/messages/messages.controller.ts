import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../../common/database.service';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  async getMyConversations(@Req() req: any) {
    return this.db.getConversations(req.user.id);
  }

  @Post()
  async startConversation(
    @Req() req: any,
    @Body() body: { book_id: string; initial_message?: string },
  ) {
    if (!body.book_id) {
      throw new BadRequestException('book_id is required');
    }

    const book = await this.db.getBookById(body.book_id);
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (book.seller_id === req.user.id) {
      throw new BadRequestException('You cannot start a conversation with yourself on your own book listing.');
    }

    const thread = await this.db.getOrCreateConversation(
      req.user.id,
      book.seller_id,
      book.id,
    );

    if (body.initial_message) {
      await this.db.sendMessage(thread.id, req.user.id, body.initial_message);
    }

    return thread;
  }

  @Get(':id/messages')
  async getMessages(@Param('id') id: string) {
    return this.db.getMessages(id);
  }

  @Post(':id/messages')
  async sendMessage(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: { text: string },
  ) {
    if (!body.text || !body.text.trim()) {
      throw new BadRequestException('Message text cannot be empty');
    }

    const message = await this.db.sendMessage(id, req.user.id, body.text.trim());
    return message;
  }
}
