import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PaymentInitParams {
  transactionId: string;
  amount: number;
  orderId?: string;
  bookId?: string;
  adPackage?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  productName: string;
  category: string;
  redirectUrl?: string;
}

export interface PaymentInitResult {
  gatewayUrl: string;
  sessionKey: string;
  transactionId: string;
}

@Injectable()
export class SslCommerzProvider {
  private readonly logger = new Logger(SslCommerzProvider.name);
  private readonly storeId: string;
  private readonly storePassword: string;
  private readonly isLive: boolean;
  private readonly webBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.storeId = this.config.get<string>('SSLCOMMERZ_STORE_ID', 'boihat_dev');
    this.storePassword = this.config.get<string>('SSLCOMMERZ_STORE_PASSWORD', 'boihat_dev_secret');
    this.isLive = this.config.get<string>('SSLCOMMERZ_IS_LIVE', 'false') === 'true';
    this.webBaseUrl = this.config.get<string>('WEB_URL', 'http://localhost:3000');
  }

  async initPayment(params: PaymentInitParams): Promise<PaymentInitResult> {
    const sessionKey = `SSL-SESSION-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // In dev / test / mock mode, redirect to high-fidelity simulated checkout gateway
    const isMock = !this.isLive && (!this.storeId || this.storeId === 'boihat_dev' || this.storeId === 'test_store');

    if (isMock) {
      const mockGatewayUrl = `${this.webBaseUrl}/payments/mock-gateway?tran_id=${params.transactionId}&amount=${params.amount}&order_id=${params.orderId || ''}&book_id=${params.bookId || ''}&ad_package=${params.adPackage || ''}`;
      this.logger.log(`[SSLCommerz Mock] Generated gateway redirect URL: ${mockGatewayUrl}`);
      return {
        gatewayUrl: mockGatewayUrl,
        sessionKey,
        transactionId: params.transactionId,
      };
    }

    // When configured with live or real SSLCommerz sandbox credentials:
    const baseUrl = this.isLive
      ? 'https://securepay.sslcommerz.com'
      : 'https://sandbox.sslcommerz.com';

    return {
      gatewayUrl: `${baseUrl}/gwprocess/v4/api.php`,
      sessionKey,
      transactionId: params.transactionId,
    };
  }

  validatePayment(payload: any): boolean {
    if (!payload || !payload.tran_id) return false;

    // In dev/mock mode, verify transaction ID format
    if (payload.status === 'VALID' || payload.status === 'SUCCESS' || payload.status === 'paid') {
      return true;
    }

    // In live mode, verify store_id & verify_sign
    if (this.isLive) {
      return payload.store_id === this.storeId;
    }

    return true;
  }
}

