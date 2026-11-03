import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../common/database.service';
import {
  BookCondition,
  BulkImportPreviewResponse,
  BulkImportResult,
  BulkImportRow,
} from '@boi-hat/shared-types';

@Injectable()
export class MerchantsService {
  constructor(private readonly databaseService: DatabaseService) {}

  generateCsvTemplate(): string {
    const headers = [
      'isbn',
      'title_bn',
      'title_en',
      'author',
      'category',
      'condition',
      'original_price',
      'sale_price',
      'stock_quantity',
      'shelf_location',
      'description',
    ].join(',');

    const sampleRow1 = [
      '9789845023015',
      'জোছনা ও জননীর গল্প',
      'Jochona O Jononir Golpo',
      'হুমায়ূন আহমেদ',
      'উপন্যাস',
      'GOOD',
      '650',
      '380',
      '3',
      'A-12',
      'সামান্য দাগ ছাড়া পাতাগুলো চমৎকার অবস্থায় রয়েছে',
    ].join(',');

    const sampleRow2 = [
      '9789844583210',
      'দীপু নাম্বার টু',
      'Dipu Number Two',
      'মুহম্মদ জাফর ইকবাল',
      'কিশোর সাহিত্য',
      'LIKE_NEW',
      '220',
      '140',
      '5',
      'B-04',
      'নতুন মতো চকচকে কপি',
    ].join(',');

    const sampleRow3 = [
      '9780131103627',
      'দ্য সি প্রোগ্রামিং ল্যাঙ্গুয়েজ',
      'The C Programming Language',
      'Brian W. Kernighan',
      'একাডেমিক ও পাঠ্যবই',
      'ACCEPTABLE',
      '450',
      '200',
      '2',
      'CS-01',
      'পেন্সিল দিয়ে কিছু দাগানো রয়েছে, পড়ার উপযোগী',
    ].join(',');

    return `${headers}\n${sampleRow1}\n${sampleRow2}\n${sampleRow3}\n`;
  }

  parseAndValidateCsv(csvContent: string): BulkImportPreviewResponse {
    if (!csvContent || !csvContent.trim()) {
      throw new BadRequestException('সিএসভি (CSV) ফাইল বা ডেটা খালি');
    }

    const lines = csvContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      throw new BadRequestException('সিএসভি ফাইলে কমপক্ষে হেডার এবং একটি ডেটা সারি থাকতে হবে');
    }

    const rawHeaderLine = lines[0];
    const headerCols = this.parseCsvLine(rawHeaderLine).map((h) =>
      h.trim().toLowerCase().replace(/["']/g, ''),
    );

    // Map column names flexibly (both English and Bengali names)
    const colIndex = {
      isbn: this.findColumnIndex(headerCols, ['isbn', 'আইএসবিএন', 'barcode', 'বারকোড']),
      title_bn: this.findColumnIndex(headerCols, [
        'title_bn',
        'title',
        'বইয়ের নাম',
        'নাম',
        'শিরোনাম',
        'book_title',
      ]),
      title_en: this.findColumnIndex(headerCols, ['title_en', 'english_title', 'ইংরেজি নাম']),
      author: this.findColumnIndex(headerCols, ['author', 'লেখক', 'লেখকের নাম', 'writer']),
      category: this.findColumnIndex(headerCols, ['category', 'বিভাগ', 'ক্যাটাগরি', 'genre']),
      condition: this.findColumnIndex(headerCols, ['condition', 'অবস্থা', 'condition_state']),
      original_price: this.findColumnIndex(headerCols, [
        'original_price',
        'মূল_দাম',
        'mrp',
        'regular_price',
      ]),
      sale_price: this.findColumnIndex(headerCols, [
        'sale_price',
        'price',
        'বিক্রয়_মূল্য',
        'দাম',
        'asking_price',
      ]),
      stock_quantity: this.findColumnIndex(headerCols, [
        'stock_quantity',
        'stock',
        'কপি',
        'পরিমাণ',
        'quantity',
      ]),
      shelf_location: this.findColumnIndex(headerCols, [
        'shelf_location',
        'shelf',
        'তাক',
        'তাকের নম্বর',
        'location',
      ]),
      description: this.findColumnIndex(headerCols, ['description', 'বিবরণ', 'নোট', 'notes']),
    };

    if (colIndex.title_bn === -1 && colIndex.title_en === -1) {
      throw new BadRequestException(
        'সিএসভি ফাইলে বইয়ের শিরোনাম (title_bn অথবা title) কলাম পাওয়া যায়নি',
      );
    }

    const items: BulkImportRow[] = [];
    let validCount = 0;
    let invalidCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = this.parseCsvLine(lines[i]);
      if (cols.length === 0 || cols.every((c) => !c.trim())) continue;

      const errors: string[] = [];
      const warnings: string[] = [];

      const title_bn =
        (colIndex.title_bn >= 0 ? cols[colIndex.title_bn] : '')?.trim() ||
        (colIndex.title_en >= 0 ? cols[colIndex.title_en] : '')?.trim() ||
        '';

      const title_en = colIndex.title_en >= 0 ? cols[colIndex.title_en]?.trim() : undefined;
      const author = (colIndex.author >= 0 ? cols[colIndex.author] : '')?.trim() || 'অজানা লেখক';
      const category =
        (colIndex.category >= 0 ? cols[colIndex.category] : '')?.trim() || 'সাধারণ সাহিত্য';
      const isbn = colIndex.isbn >= 0 ? cols[colIndex.isbn]?.trim() : undefined;
      const shelf_location =
        colIndex.shelf_location >= 0 ? cols[colIndex.shelf_location]?.trim() : undefined;
      const description =
        colIndex.description >= 0 ? cols[colIndex.description]?.trim() : undefined;

      // Price validation
      const rawSalePrice = colIndex.sale_price >= 0 ? cols[colIndex.sale_price]?.trim() : '0';
      const sale_price = Number(rawSalePrice);
      if (isNaN(sale_price) || sale_price <= 0) {
        errors.push('বিক্রয় মূল্য অবশ্যই ০ এর বেশি হতে হবে');
      }

      const rawOrigPrice =
        colIndex.original_price >= 0 ? cols[colIndex.original_price]?.trim() : undefined;
      const original_price = rawOrigPrice ? Number(rawOrigPrice) : undefined;
      if (original_price !== undefined && (isNaN(original_price) || original_price < sale_price)) {
        warnings.push('গায়ের মূল্য বিক্রয় মূল্যের চেয়ে কম দেখাচ্ছে');
      }

      // Stock validation
      const rawStock = colIndex.stock_quantity >= 0 ? cols[colIndex.stock_quantity]?.trim() : '1';
      const stock_quantity = Number(rawStock) || 1;

      // Condition validation & mapping
      const rawCond = (colIndex.condition >= 0 ? cols[colIndex.condition] : '')
        ?.trim()
        .toUpperCase();
      let condition: BookCondition = BookCondition.GOOD;
      if (rawCond === 'LIKE_NEW' || rawCond === 'নতুন মতো' || rawCond === 'NEW') {
        condition = BookCondition.LIKE_NEW;
      } else if (rawCond === 'ACCEPTABLE' || rawCond === 'মোটামুটি' || rawCond === 'FAIR') {
        condition = BookCondition.ACCEPTABLE;
      } else if (rawCond === 'POOR' || rawCond === 'খারাপ') {
        condition = BookCondition.ACCEPTABLE;
        warnings.push('ছেঁড়া পাতা বা পুরোনো কপির জন্য অবস্থা ACCEPTABLE হিসেবে ধরা হয়েছে');
      } else {
        condition = BookCondition.GOOD;
      }

      if (!title_bn) {
        errors.push('বইয়ের নাম / শিরোনাম অনুপস্থিত');
      }

      const isValid = errors.length === 0;
      if (isValid) validCount++;
      else invalidCount++;

      items.push({
        row_number: i,
        isbn,
        title_bn,
        title_en,
        author,
        category,
        condition,
        original_price,
        sale_price,
        stock_quantity,
        shelf_location,
        description,
        errors,
        warnings,
        is_valid: isValid,
      });
    }

    return {
      total_rows: items.length,
      valid_rows: validCount,
      invalid_rows: invalidCount,
      items,
    };
  }

  async bulkImport(
    userId: string,
    items: Array<{
      isbn?: string;
      title_bn: string;
      title_en?: string;
      author: string;
      category: string;
      condition: BookCondition;
      price: number;
      original_price?: number;
      stock_count?: number;
      description?: string;
      shelf_location?: string;
    }>,
  ): Promise<BulkImportResult> {
    if (!items || items.length === 0) {
      throw new BadRequestException('আমদানি করার মতো কোনো বইয়ের তথ্য পাওয়া যায়নি');
    }

    const shop = await this.databaseService.getShopByUserId(userId);
    const shopId = shop ? shop.id : null;

    const res = await this.databaseService.bulkCreateBooks(userId, shopId, items);

    return {
      imported_count: res.imported_count,
      skipped_count: items.length - res.imported_count,
      book_ids: res.book_ids,
      message: `সফলভাবে ${res.imported_count}টি বই ইনভেন্টরিতে যুক্ত হয়েছে।`,
    };
  }

  async getAllShops() {
    return this.databaseService.getAllShops();
  }

  async getShopDetails(shopId: string) {
    const shop = await this.databaseService.getShopById(shopId);
    if (!shop) throw new NotFoundException('দোকান পাওয়া যায়নি');
    const listings = await this.databaseService.getBooksByShopId(shop.id);
    return {
      shop,
      listings,
    };
  }

  async getMyStore(userId: string) {
    const shop = await this.databaseService.getShopByUserId(userId);
    if (!shop) {
      return {
        has_shop: false,
        shop: null,
        listings: [],
      };
    }
    const listings = await this.databaseService.getBooksByShopId(shop.id);
    return {
      has_shop: true,
      shop,
      listings,
    };
  }

  async updateMyStore(userId: string, data: any) {
    let shop = await this.databaseService.getShopByUserId(userId);
    if (!shop) {
      // Auto-create shop for seller if not yet created
      const all = await this.databaseService.getAllShops();
      const newShop = {
        id: `shop-uuid-${Date.now()}`,
        user_id: userId,
        name: data.name || 'আমার বই বিতান',
        logo_url: data.logo_url || null,
        cover_url: null,
        trade_license_number: data.trade_license_number || 'PENDING',
        trade_license_doc_url: null,
        address: data.address || 'নীলক্ষেত ইসলামিয়া মার্কেট, ঢাকা',
        map_lat: 23.7334,
        map_lng: 90.3854,
        contact_phone: data.contact_phone || '+8801700000000',
        is_verified: true,
        slug: (data.name || 'shop')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .slice(0, 30),
        subscription_plan: 'merchant_standard',
        subscription_expires_at: null,
        created_at: new Date().toISOString(),
      };
      (this.databaseService as any).shops.push(newShop);
      return newShop;
    }

    return this.databaseService.updateShop(shop.id, data);
  }

  // --- CSV Line Parser (respects quoted commas) ---
  private parseCsvLine(text: string): string[] {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  }

  private findColumnIndex(headers: string[], candidates: string[]): number {
    for (let i = 0; i < headers.length; i++) {
      const h = headers[i];
      if (candidates.some((cand) => h === cand || h.includes(cand))) {
        return i;
      }
    }
    return -1;
  }
}

