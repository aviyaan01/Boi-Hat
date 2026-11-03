import { Test, TestingModule } from '@nestjs/testing';
import { MerchantsService } from './merchants.service';
import { DatabaseService } from '../../common/database.service';
import { PrismaService } from '../../common/prisma.service';
import { BookCondition } from '@boi-hat/shared-types';

describe('MerchantsService', () => {
  let service: MerchantsService;
  let db: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MerchantsService, DatabaseService, PrismaService],
    }).compile();

    service = module.get<MerchantsService>(MerchantsService);
    db = module.get<DatabaseService>(DatabaseService);
    await db.onModuleInit();
  });

  it('should generate valid CSV template with correct headers', () => {
    const template = service.generateCsvTemplate();
    expect(template).toContain('isbn,title_bn,title_en,author,category,condition');
    expect(template).toContain('জোছনা ও জননীর গল্প');
    expect(template).toContain('হুমায়ূন আহমেদ');
  });

  it('should parse and validate CSV rows correctly with Bengali and English mappings', () => {
    const csvData = `isbn,title_bn,author,category,condition,sale_price,original_price,stock_quantity
9789845023015,হিমু এবং হার্ভার্ড পিএইচডি বল্টু ভাই,হুমায়ূন আহমেদ,উপন্যাস,GOOD,250,300,5
9789844583210,কপোট্রনিক সুখ দুঃখ,মুহম্মদ জাফর ইকবাল,সাইন্স ফিকশন,LIKE_NEW,180,220,3
,ভুল দামের বই,অজানা লেখক,সাধারণ,GOOD,-50,100,1`;

    const preview = service.parseAndValidateCsv(csvData);
    expect(preview.total_rows).toBe(3);
    expect(preview.valid_rows).toBe(2);
    expect(preview.invalid_rows).toBe(1);

    // Row 1
    expect(preview.items[0].title_bn).toBe('হিমু এবং হার্ভার্ড পিএইচডি বল্টু ভাই');
    expect(preview.items[0].is_valid).toBe(true);
    expect(preview.items[0].condition).toBe(BookCondition.GOOD);

    // Row 3 with negative price
    expect(preview.items[2].is_valid).toBe(false);
    expect(preview.items[2].errors.length).toBeGreaterThan(0);
  });

  it('should bulk import valid books and link them to the seller/shop catalog', async () => {
    const userId = 'user-uuid-seller-1';
    const itemsToImport = [
      {
        isbn: '9789840001111',
        title_bn: 'নীলক্ষেত স্পেশাল বই ১',
        title_en: 'Nilkhet Special Book 1',
        author: 'জাফর ইকবাল',
        category: 'কিশোর সাহিত্য',
        condition: BookCondition.LIKE_NEW,
        price: 150,
        original_price: 200,
        stock_count: 2,
        shelf_location: 'Shelf-N01',
      },
      {
        isbn: '9789840002222',
        title_bn: 'নীলক্ষেত স্পেশাল বই ২',
        title_en: 'Nilkhet Special Book 2',
        author: 'হুমায়ূন আহমেদ',
        category: 'উপন্যাস',
        condition: BookCondition.GOOD,
        price: 320,
        original_price: 450,
        stock_count: 1,
        shelf_location: 'Shelf-N02',
      },
    ];

    const result = await service.bulkImport(userId, itemsToImport);
    expect(result.imported_count).toBe(2);
    expect(result.book_ids.length).toBe(2);

    // Verify they exist in database
    const book1 = await db.getBookById(result.book_ids[0]);
    expect(book1).toBeDefined();
    expect(book1?.title_bn).toBe('নীলক্ষেত স্পেশাল বই ১');
    expect(book1?.price).toBe(150);
  });

  it('should retrieve verified merchant shops with listing counts', async () => {
    const shops = await service.getAllShops();
    expect(shops.length).toBeGreaterThan(0);
    const firstShop = shops[0];
    expect(firstShop.name).toBeDefined();
    expect(typeof firstShop.total_listings).toBe('number');
  });
});

