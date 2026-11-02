import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { ResponseInterceptor } from '../common/response.interceptor';
import { HttpExceptionFilter } from '../common/http-exception.filter';
import * as cookieParser from 'cookie-parser';
import { BookCondition, WeightBucket, OrderStatus, PaymentMethod } from '@boi-hat/shared-types';

describe('Boi-Hat End-to-End User Flow (Section 17 & 20)', () => {
  let app: INestApplication;
  let sellerToken: string;
  let buyerToken: string;
  let createdBookId: string;
  let conversationId: string;
  let orderId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // Step 1: Sign-up / Login via Phone OTP (Seller)
  it('Step 1: Seller requests OTP and logs in', async () => {
    const sellerPhone = '01711111111';

    // Request OTP
    const otpRes = await request(app.getHttpServer())
      .post('/auth/otp/request')
      .send({ phone: sellerPhone })
      .expect(200);

    expect(otpRes.body.success).toBe(true);
    const devOtp = otpRes.body.data.dev_otp;
    expect(devOtp).toBeTruthy();

    // Verify OTP
    const verifyRes = await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ phone: sellerPhone, code: devOtp })
      .expect(200);

    expect(verifyRes.body.success).toBe(true);
    sellerToken = verifyRes.body.data.accessToken;
    expect(sellerToken).toBeTruthy();
  });

  // Step 2: Sign-up / Login via Phone OTP (Buyer)
  it('Step 2: Buyer requests OTP and logs in', async () => {
    const buyerPhone = '01733333333';

    const otpRes = await request(app.getHttpServer())
      .post('/auth/otp/request')
      .send({ phone: buyerPhone })
      .expect(200);

    const devOtp = otpRes.body.data.dev_otp;

    const verifyRes = await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ phone: buyerPhone, code: devOtp })
      .expect(200);

    expect(verifyRes.body.success).toBe(true);
    buyerToken = verifyRes.body.data.accessToken;
    expect(buyerToken).toBeTruthy();
  });

  // Step 3: Seller lists a book (minimum 3 photos enforced per Section 5.1 & 15)
  it('Step 3: Seller lists a book with 3+ photos and category hierarchy', async () => {
    // Attempt with fewer than 3 photos should fail validation
    await request(app.getHttpServer())
      .post('/books')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        title_bn: 'টেস্ট বই',
        title_en: 'Test Book',
        category_ids: ['cat-uuid-academic'],
        description: 'অল্প পড়া ফ্রেশ কভার',
        condition: BookCondition.LIKE_NEW,
        price: 250,
        images: ['https://example.com/cover.jpg'], // only 1 image
      })
      .expect(400);

    // Create with 3 valid photos
    const createRes = await request(app.getHttpServer())
      .post('/books')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        title_bn: 'হিমুর মধ্যদুপুর (বিশেষ সংস্করণ)',
        title_en: 'Himur Moddhodupur (Special Edition)',
        category_ids: ['cat-uuid-literature', 'cat-uuid-fiction'],
        description: 'হুমায়ূন আহমেদের জনপ্রিয় উপন্যাস। অক্ষত কভার ও নিখুঁত পাতা।',
        condition: BookCondition.LIKE_NEW,
        price: 220,
        original_price: 350,
        weight_bucket: WeightBucket.UNDER_300G,
        images: [
          'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&q=80',
          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80',
          'https://images.unsplash.com/photo-1510172951991-856a654063f9?w=600&q=80',
        ],
      })
      .expect(201);

    expect(createRes.body.success).toBe(true);
    createdBookId = createRes.body.data.id;
    expect(createdBookId).toBeTruthy();
    expect(createRes.body.data.price).toBe(220);
    expect(createRes.body.data.images).toHaveLength(3);
  });

  // Step 4: Buyer searches for the book (Banglish / Bengali query)
  it('Step 4: Buyer searches and finds the newly listed book', async () => {
    const searchRes = await request(app.getHttpServer())
      .get('/books?q=হিমুর')
      .expect(200);

    expect(searchRes.body.success).toBe(true);
    expect(searchRes.body.data.length).toBeGreaterThan(0);
    const found = searchRes.body.data.find((b: any) => b.id === createdBookId);
    expect(found).toBeTruthy();
  });

  // Step 5: Buyer starts a conversation and messages the seller
  it('Step 5: Buyer messages the seller regarding the book', async () => {
    const convRes = await request(app.getHttpServer())
      .post('/conversations')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        book_id: createdBookId,
        initial_message: 'আসসালামু আলাইকুম, বইটি কি এখনও এভেইলেবল আছে?',
      })
      .expect(201);

    expect(convRes.body.success).toBe(true);
    conversationId = convRes.body.data.id;
    expect(conversationId).toBeTruthy();

    // Seller replies
    const replyRes = await request(app.getHttpServer())
      .post(`/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ text: 'জ্বি ভাইয়া, বইটি সম্পূর্ণ প্রস্তুত আছে।' })
      .expect(201);

    expect(replyRes.body.success).toBe(true);
  });

  // Step 6: Buyer places a Cash on Delivery (COD) order
  it('Step 6: Buyer places Cash on Delivery (COD) order', async () => {
    const orderRes = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        book_id: createdBookId,
        delivery_address: 'House 12, Road 4, Sector 7, Uttara, Dhaka-1230',
        payment_method: PaymentMethod.COD,
      })
      .expect(201);

    expect(orderRes.body.success).toBe(true);
    orderId = orderRes.body.data.id;
    expect(orderRes.body.data.price).toBe(220);
    expect(orderRes.body.data.delivery_fee).toBe(60); // ৳60 Dhaka delivery
    expect(orderRes.body.data.total_amount).toBe(280); // 220 + 60
    expect(orderRes.body.data.order_status).toBe(OrderStatus.PENDING);
  });

  // Step 7: Seller confirms order and ships with courier tracking ID
  it('Step 7: Seller confirms and ships order with courier tracking ID', async () => {
    // Confirm order
    const confirmRes = await request(app.getHttpServer())
      .patch(`/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: OrderStatus.CONFIRMED })
      .expect(200);

    expect(confirmRes.body.data.order_status).toBe(OrderStatus.CONFIRMED);

    // Ship with tracking ID
    const shipRes = await request(app.getHttpServer())
      .patch(`/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        status: OrderStatus.SHIPPED,
        courier_tracking_id: 'PATHAO-DHK-48201',
      })
      .expect(200);

    expect(shipRes.body.data.order_status).toBe(OrderStatus.SHIPPED);
    expect(shipRes.body.data.courier_tracking_id).toBe('PATHAO-DHK-48201');
  });

  // Step 8: Order delivered and 48-hour buyer protection activates
  it('Step 8: Buyer marks delivered, triggering 48-hour dispute protection window', async () => {
    const deliverRes = await request(app.getHttpServer())
      .patch(`/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ status: OrderStatus.DELIVERED })
      .expect(200);

    expect(deliverRes.body.data.order_status).toBe(OrderStatus.DELIVERED);
    expect(deliverRes.body.data.delivered_at).toBeTruthy();
    expect(deliverRes.body.data.dispute_window_expires_at).toBeTruthy();
  });

  // Step 9: Buyer leaves a 5-star review on delivered order (Phase 3)
  it('Step 9: Buyer submits 5-star review for delivered order', async () => {
    const reviewRes = await request(app.getHttpServer())
      .post(`/orders/${orderId}/review`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        rating: 5,
        comment: 'অসাধারণ সার্ভিস! বইটি খুব যত্ন সহকারে পৌঁছেছে।',
      })
      .expect(201);

    expect(reviewRes.body.success).toBe(true);
    expect(reviewRes.body.data.rating).toBe(5);
    expect(reviewRes.body.data.comment).toContain('অসাধারণ');
  });

  // Step 10: Seller checks wallet and verifies pending balance credit (Phase 3)
  it('Step 10: Seller views wallet and sees pending escrow balance', async () => {
    const walletRes = await request(app.getHttpServer())
      .get('/wallet')
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(200);

    expect(walletRes.body.success).toBe(true);
    expect(walletRes.body.data.pending_balance).toBeGreaterThan(0);
    expect(walletRes.body.data.transactions.length).toBeGreaterThan(0);
  });

  // Step 11: Seller features a listing with urgent ad package (Phase 3)
  it('Step 11: Seller boosts listing with ad package', async () => {
    const featureRes = await request(app.getHttpServer())
      .post(`/books/${createdBookId}/feature`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        package_type: 'urgent_3d',
        pay_now: false,
      })
      .expect(201);

    expect(featureRes.body.success).toBe(true);
    expect(featureRes.body.data.ad.package_type).toBe('urgent_3d');
  });
});

