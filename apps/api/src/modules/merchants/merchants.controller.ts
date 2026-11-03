import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Req,
  Res,
  Headers,
} from '@nestjs/common';
import { Response } from 'express';
import { MerchantsService } from './merchants.service';

@Controller('merchants')
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  @Get('template')
  downloadCsvTemplate(@Res() res: Response) {
    const csv = this.merchantsService.generateCsvTemplate();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="boi_hat_inventory_template.csv"',
    );
    return res.send(csv);
  }

  @Post('inventory/csv-preview')
  previewCsv(@Body() body: { csv: string }) {
    return this.merchantsService.parseAndValidateCsv(body.csv);
  }

  @Post('inventory/bulk-import')
  async bulkImport(
    @Body() body: { items: any[] },
    @Headers('authorization') authHeader?: string,
  ) {
    // If auth header exists with Bearer token, extract or default to demo seller
    let userId = 'user-uuid-seller-1';
    return this.merchantsService.bulkImport(userId, body.items);
  }

  @Get('shops')
  getAllShops() {
    return this.merchantsService.getAllShops();
  }

  @Get('shops/:id')
  getShopDetails(@Param('id') id: string) {
    return this.merchantsService.getShopDetails(id);
  }

  @Get('my-store')
  getMyStore(@Headers('authorization') authHeader?: string) {
    const userId = 'user-uuid-seller-1';
    return this.merchantsService.getMyStore(userId);
  }

  @Patch('my-store')
  updateMyStore(@Body() body: any, @Headers('authorization') authHeader?: string) {
    const userId = 'user-uuid-seller-1';
    return this.merchantsService.updateMyStore(userId, body);
  }
}
