import { DatabaseService } from '../../common/database.service';
import { PrismaService } from '../../common/prisma.service';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@boi-hat/shared-types';

describe('Order Processing & Buyer Protection Logic', () => {
  let db: DatabaseService;
  let prisma: PrismaService;

  beforeEach(async () => {
    prisma = new PrismaService();
    prisma.isConnected = false;
    db = new DatabaseService(prisma);
    await db.onModuleInit();
  });

  it('should calculate delivery fee (৳60) and total amount correctly on order creation', async () => {
    const books = await db.getBooks({ limit: 1 });
    const book = books.data[0];

    const order = await db.createOrder({
      buyer_id: 'buyer-user-uuid-1',
      seller_id: book.seller_id,
      book_id: book.id,
      delivery_address: 'House 5, Road 2, Dhanmondi, Dhaka',
    });

    expect(order.delivery_fee).toBe(60);
    expect(order.price).toBe(book.price);
    expect(order.total_amount).toBe(book.price + 60);
    expect(order.payment_method).toBe(PaymentMethod.COD);
    expect(order.order_status).toBe(OrderStatus.PENDING);
  });

  it('should set delivered_at and 48-hour dispute window upon order delivery', async () => {
    const books = await db.getBooks({ limit: 1 });
    const book = books.data[0];

    const order = await db.createOrder({
      buyer_id: 'buyer-user-uuid-1',
      seller_id: book.seller_id,
      book_id: book.id,
      delivery_address: 'Mirpur 10, Dhaka',
    });

    // Move to confirmed, then shipped, then delivered
    await db.updateOrderStatus(order.id, OrderStatus.CONFIRMED);
    await db.updateOrderStatus(order.id, OrderStatus.SHIPPED, 'TRACK-999');
    const delivered = await db.updateOrderStatus(order.id, OrderStatus.DELIVERED);

    expect(delivered.order_status).toBe(OrderStatus.DELIVERED);
    expect(delivered.payment_status).toBe(PaymentStatus.PAID);
    expect(delivered.delivered_at).toBeTruthy();
    expect(delivered.dispute_window_expires_at).toBeTruthy();

    const deliveredTime = new Date(delivered.delivered_at).getTime();
    const expiryTime = new Date(delivered.dispute_window_expires_at).getTime();
    const hoursDifference = (expiryTime - deliveredTime) / (1000 * 60 * 60);

    expect(Math.round(hoursDifference)).toBe(48);
  });
});

