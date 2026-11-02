import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { DatabaseService } from '../../common/database.service';
import { SslCommerzProvider } from './sslcommerz.provider';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '../../common/common.module';
import { FeaturedPackage, OrderStatus, PaymentStatus } from '@boi-hat/shared-types';

describe('PaymentsService (Phase 3)', () => {
  let service: PaymentsService;
  let db: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), CommonModule],
      providers: [PaymentsService, SslCommerzProvider],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    db = module.get<DatabaseService>(DatabaseService);
    await db.onModuleInit();
  });

  it('should initialize payment and return transaction ID & gateway URL', async () => {
    const buyer = (await db.getUserByPhone('+8801733333333'))!;
    const res = await service.initPayment(buyer.id, {
      amount: 450,
      order_id: 'order-demo-1',
    });

    expect(res).toBeDefined();
    expect(res.payment_id).toBeDefined();
    expect(res.transaction_id).toMatch(/^BH-TXN-/);
    expect(res.gateway_url).toContain('mock-gateway');
    expect(res.amount).toBe(450);
  });

  it('should process SSLCommerz webhook and update order status to paid (idempotently)', async () => {
    const buyer = (await db.getUserByPhone('+8801733333333'))!;
    const init = await service.initPayment(buyer.id, {
      amount: 35,
      book_id: 'book-uuid-2',
      ad_package: FeaturedPackage.FEATURED_5D,
    });

    const webhookPayload = {
      tran_id: init.transaction_id,
      val_id: 'VAL-12345',
      amount: 35,
      status: 'VALID',
      card_type: 'bKash',
    };

    // First webhook call
    const result1 = await service.handleWebhook(webhookPayload);
    expect(result1.success).toBe(true);
    expect(result1.status).toBe('paid');

    const payment = await service.getPaymentByTransactionId(init.transaction_id);
    expect(payment.status).toBe('paid');
    expect(payment.raw_payload).toEqual(webhookPayload);

    // Book should now be featured
    const book = await db.getBookById('book-uuid-2');
    expect(book?.is_featured).toBe(true);

    // Second webhook call (idempotent - should not error or double-credit)
    const result2 = await service.handleWebhook(webhookPayload);
    expect(result2.status).toBe('paid');
  });

  it('should handle mock complete simulation correctly', async () => {
    const buyer = (await db.getUserByPhone('+8801733333333'))!;
    const init = await service.initPayment(buyer.id, {
      amount: 200,
      order_id: 'order-demo-1',
    });

    const res = await service.handleMockComplete(init.transaction_id, 'paid');
    expect(res.success).toBe(true);
    expect(res.payment?.status).toBe('paid');
  });
});
