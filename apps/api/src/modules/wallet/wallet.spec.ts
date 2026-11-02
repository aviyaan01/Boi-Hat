import { Test, TestingModule } from '@nestjs/testing';
import { WalletController } from './wallet.controller';
import { DatabaseService } from '../../common/database.service';
import { CommonModule } from '../../common/common.module';
import { ConfigModule } from '@nestjs/config';
import { OrderStatus, PayoutMethod, PayoutStatus } from '@boi-hat/shared-types';

describe('Seller Wallet & 48h Dispute Escrow (Phase 3)', () => {
  let controller: WalletController;
  let db: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), CommonModule],
      controllers: [WalletController],
    }).compile();

    controller = module.get<WalletController>(WalletController);
    db = module.get<DatabaseService>(DatabaseService);
    await db.onModuleInit();
  });

  it('should return seller wallet summary with balances and transactions', async () => {
    const seller = (await db.getUserByPhone('+8801711111111'))!;
    const summary = await controller.getWallet({ user: seller });

    expect(summary).toBeDefined();
    expect(summary.user_id).toBe(seller.id);
    expect(typeof summary.available_balance).toBe('number');
    expect(typeof summary.pending_balance).toBe('number');
    expect(Array.isArray(summary.transactions)).toBe(true);
  });

  it('should credit pending balance when an order is marked DELIVERED', async () => {
    const seller = (await db.getUserByPhone('+8801711111111'))!;
    const beforeWallet = await db.getOrCreateWallet(seller.id);
    const initialPending = beforeWallet.pending_balance;

    // Create and deliver an order
    const order = await db.createOrder({
      buyer_id: 'buyer-user-uuid-1',
      seller_id: seller.id,
      book_id: 'book-uuid-10',
      delivery_address: 'Mirpur-10, Dhaka',
    });

    await db.updateOrderStatus(order.id, OrderStatus.DELIVERED);

    const afterWallet = await db.getOrCreateWallet(seller.id);
    expect(afterWallet.pending_balance).toBe(initialPending + order.price);
  });

  it('should release pending balance to available balance when 48h dispute window expires', async () => {
    const seller = (await db.getUserByPhone('+8801711111111'))!;
    const beforeSummary = await controller.getWallet({ user: seller });

    // Create an order delivered 3 days ago (window expired)
    const order = await db.createOrder({
      buyer_id: 'buyer-user-uuid-1',
      seller_id: seller.id,
      book_id: 'book-uuid-11',
      delivery_address: 'Dhanmondi, Dhaka',
    });

    await db.updateOrderStatus(order.id, OrderStatus.DELIVERED);
    await db.updateOrder(order.id, {
      dispute_window_expires_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      escrow_released: false,
    });

    // Release pending funds
    const releaseRes = await controller.releasePendingFunds();
    expect(releaseRes.releasedCount).toBeGreaterThanOrEqual(1);

    const afterSummary = await controller.getWallet({ user: seller });
    expect(afterSummary.available_balance).toBeGreaterThan(beforeSummary.available_balance);
  });

  it('should allow valid payout request and deduct from available balance', async () => {
    const seller = (await db.getUserByPhone('+8801711111111'))!;
    const wallet = await db.getOrCreateWallet(seller.id);
    wallet.available_balance = 500;

    const payout = await controller.requestPayout(
      { user: seller },
      {
        amount: 250,
        method: PayoutMethod.BKASH,
        account_number: '01711111111',
      },
    );

    expect(payout.id).toBeDefined();
    expect(payout.amount).toBe(250);
    expect(payout.status).toBe(PayoutStatus.PENDING);
    expect(wallet.available_balance).toBe(250);
  });

  it('should reject payout request below minimum threshold (৳100) or exceeding balance', async () => {
    const seller = (await db.getUserByPhone('+8801711111111'))!;

    // Below 100
    await expect(
      controller.requestPayout(
        { user: seller },
        {
          amount: 50,
          method: PayoutMethod.BKASH,
          account_number: '01711111111',
        },
      ),
    ).rejects.toThrow();

    // Exceeding balance
    await expect(
      controller.requestPayout(
        { user: seller },
        {
          amount: 9999999,
          method: PayoutMethod.BKASH,
          account_number: '01711111111',
        },
      ),
    ).rejects.toThrow();
  });
});
