import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ICourierProvider, CourierCreationResult, ParsedWebhookEvent } from './courier.interface';
import { CreateParcelDto, CourierParcelStatus } from '@boi-hat/shared-types';

@Injectable()
export class PathaoCourierProvider implements ICourierProvider {
  private readonly logger = new Logger(PathaoCourierProvider.name);
  private readonly isLive: boolean;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly webhookSecret: string;

  constructor(private readonly config: ConfigService) {
    this.isLive = this.config.get<string>('PATHAO_IS_LIVE', 'false') === 'true';
    this.clientId = this.config.get<string>('PATHAO_CLIENT_ID', 'dev_pathao_id');
    this.clientSecret = this.config.get<string>('PATHAO_CLIENT_SECRET', 'dev_pathao_secret');
    this.webhookSecret = this.config.get<string>('PATHAO_WEBHOOK_SECRET', 'pathao_dev_webhook');
  }

  async createParcel(dto: CreateParcelDto): Promise<CourierCreationResult> {
    const isMock = !this.isLive && (!this.clientId || this.clientId === 'dev_pathao_id');

    if (isMock) {
      const trackingId = `PT-DHK-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;
      const consignmentId = `CN-PT-${Date.now()}`;
      const isDhaka = (dto.recipient_city || 'Dhaka').toLowerCase().includes('dhaka');
      const deliveryFee = isDhaka ? 60 : 120;

      this.logger.log(`[Pathao Mock] Created simulated parcel: ${trackingId}`);
      return {
        consignment_id: consignmentId,
        tracking_id: trackingId,
        delivery_fee: deliveryFee,
      };
    }

    // Production Pathao API call placeholder
    const trackingId = `PT-DHK-${Date.now().toString().slice(-6)}`;
    return {
      consignment_id: `CN-PT-${Date.now()}`,
      tracking_id: trackingId,
      delivery_fee: 60,
    };
  }

  verifyWebhook(payload: any, headers?: Record<string, any>): boolean {
    if (!payload) return false;
    // In dev / sandbox mock mode, allow simulated webhooks
    if (!this.isLive) return true;

    const signature = headers?.['x-pathao-signature'] || headers?.['X-PATHAO-Signature'];
    return !!signature;
  }

  parseWebhookEvent(payload: any): ParsedWebhookEvent {
    const trackingId = payload.tracking_id || payload.consignment_id || payload.merchant_order_id;
    const eventName = (payload.event || payload.status || '').toLowerCase();

    let status = CourierParcelStatus.PENDING_PICKUP;
    if (eventName.includes('pickup') || eventName.includes('picked_up')) {
      status = CourierParcelStatus.PICKED_UP;
    } else if (eventName.includes('transit') || eventName.includes('hub')) {
      status = CourierParcelStatus.IN_TRANSIT;
    } else if (eventName.includes('out_for_delivery') || eventName.includes('delivery')) {
      status = CourierParcelStatus.OUT_FOR_DELIVERY;
    } else if (eventName.includes('delivered') || eventName.includes('completed')) {
      status = CourierParcelStatus.DELIVERED;
    } else if (eventName.includes('return')) {
      status = CourierParcelStatus.RETURNED;
    } else if (eventName.includes('cancel')) {
      status = CourierParcelStatus.CANCELLED;
    }

    return {
      tracking_id: trackingId,
      status,
      location: payload.location || payload.hub_name || 'Dhaka',
      notes: payload.notes || payload.comment || 'Pathao webhook status update',
    };
  }
}

