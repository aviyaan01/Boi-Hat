import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../common/database.service';
import { SslCommerzProvider } from './sslcommerz.provider';
import { PaymentInitDto, PaymentInitResponse } from '@boi-hat/shared-types';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly sslCommerz: SslCommerzProvider,
  ) {}

  async initPayment(userId: string, dto: PaymentInitDto): Promise<PaymentInitResponse> {
    const user = await this.db.getUserById(userId);
    if (!user) throw new NotFoundException('ব্যবহারকারী পাওয়া যায়নি');

    if (!dto.amount || dto.amount <= 0) {
      throw new BadRequestException('পেমেন্টের পরিমাণ সঠিক নয়');
    }

    const transactionId = `BH-TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let productName = 'Boi-Hat Service';
    if (dto.order_id) {
      productName = `Order #${dto.order_id.slice(0, 8)}`;
    } else if (dto.book_id && dto.ad_package) {
      productName = `Boost Ad: ${dto.ad_package}`;
    }

    // 1. Create pending payment record
    const payment = await this.db.createPaymentRecord({
      order_id: dto.order_id,
      book_id: dto.book_id,
      ad_package: dto.ad_package,
      amount: dto.amount,
      provider: 'sslcommerz',
      provider_transaction_id: transactionId,
      status: 'pending',
    });

    // 2. Initialize provider session
    const providerResult = await this.sslCommerz.initPayment({
      transactionId,
      amount: dto.amount,
      orderId: dto.order_id,
      bookId: dto.book_id,
      adPackage: dto.ad_package,
      customerName: user.name || 'Boi-Hat Customer',
      customerPhone: user.phone,
      customerEmail: user.email || undefined,
      productName,
      category: 'Books & Marketplace Services',
      redirectUrl: dto.redirect_url,
    });

    return {
      payment_id: payment.id,
      transaction_id: transactionId,
      gateway_url: providerResult.gatewayUrl,
      amount: dto.amount,
    };
  }

  async handleWebhook(payload: any) {
    this.logger.log(`Received SSLCommerz IPN / Webhook payload for tran_id: ${payload?.tran_id}`);

    if (!payload || !payload.tran_id) {
      throw new BadRequestException('অবৈধ ওয়েবহুক পে-লোড');
    }

    const isValid = this.sslCommerz.validatePayment(payload);
    if (!isValid) {
      this.logger.warn(`Invalid signature or data in webhook: ${JSON.stringify(payload)}`);
      throw new BadRequestException('পেমেন্ট ভেরিফিকেশন ব্যর্থ হয়েছে');
    }

    const payment = await this.db.getPaymentByTransactionId(payload.tran_id);
    if (!payment) {
      throw new NotFoundException(`লেনদেন আইডি ${payload.tran_id} পাওয়া যায়নি`);
    }

    // Idempotent update
    const status = payload.status === 'VALID' || payload.status === 'SUCCESS' || payload.status === 'paid' ? 'paid' : 'failed';
    const updated = await this.db.updatePaymentStatus(payment.id, status, payload);

    return {
      success: true,
      transaction_id: payload.tran_id,
      status: updated?.status,
    };
  }

  async handleMockComplete(transactionId: string, status: 'paid' | 'failed' | 'cancelled') {
    const payment = await this.db.getPaymentByTransactionId(transactionId);
    if (!payment) {
      throw new NotFoundException('লেনদেন পাওয়া যায়নি');
    }

    const mockPayload = {
      tran_id: transactionId,
      val_id: `MOCK-VAL-${Date.now()}`,
      amount: payment.amount,
      card_type: 'bKash-Mock',
      status: status === 'paid' ? 'VALID' : 'FAILED',
      bank_tran_id: `BANK-${Date.now()}`,
      tran_date: new Date().toISOString(),
    };

    const updated = await this.db.updatePaymentStatus(payment.id, status, mockPayload);
    return {
      success: status === 'paid',
      payment: updated,
    };
  }

  async getPaymentByTransactionId(tranId: string) {
    const payment = await this.db.getPaymentByTransactionId(tranId);
    if (!payment) throw new NotFoundException('পেমেন্ট পাওয়া যায়নি');
    return payment;
  }
}
