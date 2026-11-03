import { Test, TestingModule } from '@nestjs/testing';
import { AdsController } from './ads.controller';
import { DatabaseService } from '../../common/database.service';
import { PaymentsService } from '../payments/payments.service';
import { SslCommerzProvider } from '../payments/sslcommerz.provider';
import { CommonModule } from '../../common/common.module';
import { ConfigModule } from '@nestjs/config';
import { FeaturedPackage, FeaturedStatus } from '@boi-hat/shared-types';

describe('Ads & Boosting (Phase 3)', () => {
  let controller: AdsController;
  let db: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), CommonModule],
      controllers: [AdsController],
      providers: [PaymentsService, SslCommerzProvider],
    }).compile();

    controller = module.get<AdsController>(AdsController);
    db = module.get<DatabaseService>(DatabaseService);
    await db.onModuleInit();
  });

  it('should return all predefined ad packages with Section 10.1 pricing', () => {
    const packages = controller.getAdPackages();
    expect(packages.length).toBe(3);

    const urgent = packages.find((p) => p.id === FeaturedPackage.URGENT_3D);
    expect(urgent?.price).toBe(20);
    expect(urgent?.duration_days).toBe(3);

    const featured5d = packages.find((p) => p.id === FeaturedPackage.FEATURED_5D);
    expect(featured5d?.price).toBe(35);
    expect(featured5d?.duration_days).toBe(5);

    const featuredHome = packages.find((p) => p.id === FeaturedPackage.FEATURED_HOME_7D);
    expect(featuredHome?.price).toBe(50);
    expect(featuredHome?.duration_days).toBe(7);
  });

  it('should allow seller to feature their book and update is_featured flag', async () => {
    const seller = (await db.getUserByPhone('+8801711111111'))!;
    const book = (await db.getBooks({ page: 1, limit: 10 })).data.find(
      (b: any) => b.seller_id === seller.id,
    )!;

    const res = await controller.featureBook(
      { user: seller },
      book.id,
      { package_type: FeaturedPackage.FEATURED_5D, pay_now: false },
    );

    expect(res.requires_payment).toBe(false);
    expect(res.ad?.package_type).toBe(FeaturedPackage.FEATURED_5D);

    const updated = await db.getBookById(book.id);
    expect(updated?.is_featured).toBe(true);
  });

  it('should reject non-owner trying to feature a book', async () => {
    const buyer = (await db.getUserByPhone('+8801733333333'))!;
    const books = (await db.getBooks({ page: 1, limit: 1 })).data;
    const book = books[0];

    await expect(
      controller.featureBook(
        { user: buyer },
        book.id,
        { package_type: FeaturedPackage.URGENT_3D, pay_now: false },
      ),
    ).rejects.toThrow();
  });

  it('should automatically expire ads whose duration has elapsed', async () => {
    const seller = (await db.getUserByPhone('+8801711111111'))!;
    const book = (await db.getBookById('book-uuid-3'))!;

    // Create ad expiring 1 hour ago
    const ad = await db.createFeaturedAd(seller.id, book.id, FeaturedPackage.URGENT_3D);
    ad.expires_at = new Date(Date.now() - 3600000).toISOString();

    const expiryResult = await controller.runExpiryCheck();
    expect(expiryResult.expiredCount).toBeGreaterThanOrEqual(1);

    const checkedAd = (await db.getActiveFeaturedAds(book.id));
    expect(checkedAd.length).toBe(0);
  });
});

