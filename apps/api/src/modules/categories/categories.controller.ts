import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { DatabaseService } from '../../common/database.service';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { Role } from '@boi-hat/shared-types';

@Controller()
export class CategoriesController {
  constructor(private readonly db: DatabaseService) {}

  @Get('categories/tree')
  async getCategoryTree() {
    return this.db.getCategoriesTree();
  }

  @Post('admin/categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async createCategory(
    @Body()
    body: {
      name_en: string;
      name_bn: string;
      parent_id?: string;
      icon_url?: string;
      slug?: string;
    },
  ) {
    return this.db.createCategory(body);
  }

  @Patch('admin/categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateCategory(@Param('id') id: string, @Body() body: any) {
    return this.db.updateCategory(id, body);
  }

  @Delete('admin/categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async deleteCategory(@Param('id') id: string) {
    return this.db.deleteCategory(id);
  }
}
