import { Test, TestingModule } from '@nestjs/testing';
import { CouriersController } from './couriers.controller';
import { CouriersService } from './couriers.service';
import { PathaoCourierProvider } from './providers/pathao.provider';
import { SteadfastCourierProvider } from './providers/steadfast.provider';
import { RedxCourierProvider } from './providers/redx.provider';
import { DatabaseService } from '../../common/database.service';
import { CommonModule } from '../../common/common.module';
import { ConfigModule } from '@nestjs/config';
import {
  CourierProvider,
  CourierParcelStatus,
  OrderStatus,
  WeightBucket,
} from '@boi-hat/shared-types';

describe('Couriers & Logistics Integration (Phase 4)', () => {
  let controller: CouriersController;
  let service: CouriersService;
  let db: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), CommonModule],
      controllers: [CouriersController],
      providers: [
        CouriersService,
        PathaoCourierProvider,
        SteadfastCourierProvider,
        RedxCourierProvider,
      ],
    }).compile();

    controller = module.get<CouriersController>(CouriersController);
    service = module.get<CouriersService>(CouriersService);
    db = module.get<DatabaseService>(DatabaseService);
    await db.onModuleInit();
  });

  it('should calculate delivery fee correctly for Dhaka and outside Dhaka', async () => {
    // Inside Dhaka standard
    const dhakaFee = await controller.getEstimate('Dhaka', WeightBucket.UNDER_300G, CourierProvider.PATHAO);
    expect(dhakaFee.inside_dhaka).toBe(true);
    expect(dhakaFee.delivery_fee).toBe(60);

    // Outside Dhaka
    const outsideFee = await controller.getEstimate('Chittagong', WeightBucket.UNDER_300G, CourierProvider.PATHAO);
    expect(outsideFee.inside_dhaka).toBe(false);
    expect(outsideFee.delivery_fee).toBe(120);

    // Over 1kg inside Dhaka
    const heavyFee = await controller.getEstimate('Dhaka', WeightBucket.OVER_1KG, CourierProvider.STEADFAST);
    expect(heavyFee.delivery_fee).toBe(90);
  });

  it('should allow seller to book a courier parcel and update order', async () => {
    const seller = (await db.getUserByPhone('+8801711111111'))!;
    const buyer = (await db.getUserByPhone('+8801733333333'))!;

    const order = await db.createOrder({
      buyer_id: buyer.id,
      seller_id: seller.id,
      book_id: 'book-uuid-15',
      delivery_address: 'House 5, Road 2, Dhanmondi, Dhaka',
    });

    const parcel = await controller.createParcel(
      { user: seller },
      {
        order_id: order.id,
        courier_provider: CourierProvider.PATHAO,
        recipient_name: buyer.name || 'Buyer',
        recipient_phone: buyer.phone,
        recipient_address: 'House 5, Road 2, Dhanmondi, Dhaka',
        recipient_city: 'Dhaka',
        recipient_area: 'Dhanmondi',
        item_weight: WeightBucket.UNDER_300G,
      },
    );

    expect(parcel.id).toBeDefined();
    expect(parcel.tracking_id).toMatch(/^PT-DHK-/);
    expect(parcel.courier_provider).toBe(CourierProvider.PATHAO);
    expect(parcel.timeline.length).toBeGreaterThanOrEqual(1);

    // Verify order is updated with courier info
    const updatedOrder = await db.getOrderById(order.id);
    expect(updatedOrder?.courier_tracking_id).toBe(parcel.tracking_id);
    expect(updatedOrder?.courier_provider).toBe(CourierProvider.PATHAO);
  });

  it('should process courier webhook and advance order lifecycle to SHIPPED on picked_up', async () => {
    const seller = (await db.getUserByPhone('+8801711111111'))!;
    const buyer = (await db.getUserByPhone('+8801733333333'))!;

    const order = await db.createOrder({
      buyer_id: buyer.id,
      seller_id: seller.id,
      book_id: 'book-uuid-16',
      delivery_address: 'Gulshan-2, Dhaka',
    });

    const parcel = await controller.createParcel(
      { user: seller },
      {
        order_id: order.id,
        courier_provider: CourierProvider.PATHAO,
        recipient_name: buyer.name || 'Buyer',
        recipient_phone: buyer.phone,
        recipient_address: 'Gulshan-2, Dhaka',
      },
    );

    // Send webhook: picked_up
    const webhookRes = await controller.handlePathaoWebhook(
      {
        tracking_id: parcel.tracking_id,
        event: 'PickupCompleted',
        location: 'Shahbagh Hub',
      },
      {},
    );

    expect(webhookRes.success).toBe(true);

    const updatedParcel = await controller.getTracking(parcel.tracking_id);
    expect(updatedParcel.status).toBe(CourierParcelStatus.PICKED_UP);

    const updatedOrder = await db.getOrderById(order.id);
    expect(updatedOrder?.order_status).toBe(OrderStatus.SHIPPED);
  });

  it('should auto-mark order DELIVERED, start 48h dispute window, and credit escrow when courier delivers', async () => {
    const seller = (await db.getUserByPhone('+8801711111111'))!;
    const buyer = (await db.getUserByPhone('+8801733333333'))!;

    const order = await db.createOrder({
      buyer_id: buyer.id,
      seller_id: seller.id,
      book_id: 'book-uuid-17',
      delivery_address: 'Banani DOHS, Dhaka',
    });

    const parcel = await controller.createParcel(
      { user: seller },
      {
        order_id: order.id,
        courier_provider: CourierProvider.STEADFAST,
        recipient_name: buyer.name || 'Buyer',
        recipient_phone: buyer.phone,
        recipient_address: 'Banani DOHS, Dhaka',
      },
    );

    // Send webhook: delivered
    const webhookRes = await controller.handleSteadfastWebhook(
      {
        tracking_code: parcel.tracking_id,
        status: 'delivered',
        location: 'Banani',
      },
      {},
    );

    expect(webhookRes.success).toBe(true);

    const updatedOrder = await db.getOrderById(order.id);
    expect(updatedOrder?.order_status).toBe(OrderStatus.DELIVERED);
    expect(updatedOrder?.delivered_at).toBeTruthy();
    expect(updatedOrder?.dispute_window_expires_at).toBeTruthy();

    // Verify seller's pending wallet was credited
    const wallet = await db.getOrCreateWallet(seller.id);
    expect(wallet.pending_balance).toBeGreaterThan(0);
  });
});

