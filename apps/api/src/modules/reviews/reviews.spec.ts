import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsController } from './reviews.controller';
import { DatabaseService } from '../../common/database.service';
import { CommonModule } from '../../common/common.module';
import { ConfigModule } from '@nestjs/config';
import { OrderStatus } from '@boi-hat/shared-types';

describe('Reviews & Seller Ratings (Phase 3)', () => {
  let controller: ReviewsController;
  let db: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), CommonModule],
      controllers: [ReviewsController],
    }).compile();

    controller = module.get<ReviewsController>(ReviewsController);
    db = module.get<DatabaseService>(DatabaseService);
    await db.onModuleInit();
  });

  it('should allow buyer to review a delivered order and update seller rating', async () => {
    const buyer = (await db.getUserByPhone('+8801733333333'))!;
    const seller = (await db.getUserByPhone('+8801722222222'))!;

    // Create delivered order
    const order = await db.createOrder({
      buyer_id: buyer.id,
      seller_id: seller.id,
      book_id: 'book-uuid-20',
      delivery_address: 'Banani, Dhaka',
    });
    await db.updateOrderStatus(order.id, OrderStatus.DELIVERED);

    const review = await controller.createReview(
      { user: buyer },
      order.id,
      {
        rating: 5,
        comment: 'অসাধারণ সার্ভিস! বইটি হাতে পেয়েছি মাত্র ২ দিনে।',
      },
    );

    expect(review.id).toBeDefined();
    expect(review.rating).toBe(5);
    expect(review.comment).toContain('অসাধারণ');

    // Check seller ratings updated
    const updatedSeller = await db.getUserById(seller.id);
    expect(updatedSeller?.rating_count).toBeGreaterThanOrEqual(1);
    expect(Number(updatedSeller?.rating_avg)).toBe(5.0);
  });

  it('should reject review for non-delivered order or duplicate review', async () => {
    const buyer = (await db.getUserByPhone('+8801733333333'))!;
    const seller = (await db.getUserByPhone('+8801722222222'))!;

    // 1. Pending order - should fail
    const order = await db.createOrder({
      buyer_id: buyer.id,
      seller_id: seller.id,
      book_id: 'book-uuid-21',
      delivery_address: 'Mohakhali, Dhaka',
    });

    await expect(
      controller.createReview(
        { user: buyer },
        order.id,
        { rating: 4, comment: 'Nice' },
      ),
    ).rejects.toThrow();

    // 2. Deliver and review once
    await db.updateOrderStatus(order.id, OrderStatus.DELIVERED);
    await controller.createReview({ user: buyer }, order.id, { rating: 4, comment: 'Good' });

    // 3. Second review on same order - should reject duplicate
    await expect(
      controller.createReview(
        { user: buyer },
        order.id,
        { rating: 5, comment: 'Duplicate attempt' },
      ),
    ).rejects.toThrow();
  });

  it('should reject invalid ratings outside 1-5', async () => {
    const buyer = (await db.getUserByPhone('+8801733333333'))!;
    const order = (await db.getOrderById('order-delivered-demo-1'))!;

    await expect(
      controller.createReview({ user: buyer }, order.id, { rating: 6 }),
    ).rejects.toThrow();

    await expect(
      controller.createReview({ user: buyer }, order.id, { rating: 0 }),
    ).rejects.toThrow();
  });
});

