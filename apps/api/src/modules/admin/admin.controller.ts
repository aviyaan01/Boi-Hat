import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../common/database.service';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { Role, BookStatus } from '@boi-hat/shared-types';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly db: DatabaseService) {}

  @Get('books/pending')
  async getPendingBooks() {
    return this.db.getPendingBooks();
  }

  @Patch('books/:id/approve')
  async approveBook(@Param('id') id: string) {
    const book = await this.db.setBookStatus(id, BookStatus.ACTIVE);
    if (!book) throw new NotFoundException('Book not found');
    return book;
  }

  @Patch('books/:id/reject')
  async rejectBook(@Param('id') id: string) {
    const book = await this.db.setBookStatus(id, BookStatus.REMOVED);
    if (!book) throw new NotFoundException('Book not found');
    return book;
  }

  @Get('reports')
  async getReports() {
    return this.db.getReports();
  }

  @Get('metrics')
  async getMetrics() {
    return this.db.getAdminMetrics();
  }
}

