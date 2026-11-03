import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ICourierProvider, CourierCreationResult, ParsedWebhookEvent } from './courier.interface';
import { CreateParcelDto, CourierParcelStatus } from '@boi-hat/shared-types';

@Injectable()
export class SteadfastCourierProvider implements ICourierProvider {
  private readonly logger = new Logger(SteadfastCourierProvider.name);
  private readonly isLive: boolean;
  private readonly apiKey: string;
  private readonly secretKey: string;

  constructor(private readonly config: ConfigService) {
    this.isLive = this.config.get<string>('STEADFAST_IS_LIVE', 'false') === 'true';
    this.apiKey = this.config.get<string>('STEADFAST_API_KEY', 'dev_sf_key');
    this.secretKey = this.config.get<string>('STEADFAST_SECRET_KEY', 'dev_sf_secret');
  }

  async createParcel(dto: CreateParcelDto): Promise<CourierCreationResult> {
    const isMock = !this.isLive && (!this.apiKey || this.apiKey === 'dev_sf_key');

    if (isMock) {
      const trackingId = `SF-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;
      const consignmentId = `CN-SF-${Date.now()}`;
      const isDhaka = (dto.recipient_city || 'Dhaka').toLowerCase().includes('dhaka');
      const deliveryFee = isDhaka ? 60 : 120;

      this.logger.log(`[Steadfast Mock] Created simulated parcel: ${trackingId}`);
      return {
        consignment_id: consignmentId,
        tracking_id: trackingId,
        delivery_fee: deliveryFee,
      };
    }

    const trackingId = `SF-${Date.now().toString().slice(-6)}`;
    return {
      consignment_id: `CN-SF-${Date.now()}`,
      tracking_id: trackingId,
      delivery_fee: 60,
    };
  }

  verifyWebhook(payload: any, headers?: Record<string, any>): boolean {
    if (!payload) return false;
    return true;
  }

  parseWebhookEvent(payload: any): ParsedWebhookEvent {
    const trackingId = payload.tracking_code || payload.tracking_id || payload.consignment_id;
    const statusString = (payload.status || payload.event || '').toLowerCase();

    let status = CourierParcelStatus.PENDING_PICKUP;
    if (statusString.includes('picked') || statusString.includes('received')) {
      status = CourierParcelStatus.PICKED_UP;
    } else if (statusString.includes('transit') || statusString.includes('holding')) {
      status = CourierParcelStatus.IN_TRANSIT;
    } else if (statusString.includes('delivery') && !statusString.includes('delivered')) {
      status = CourierParcelStatus.OUT_FOR_DELIVERY;
    } else if (statusString.includes('delivered')) {
      status = CourierParcelStatus.DELIVERED;
    } else if (statusString.includes('return')) {
      status = CourierParcelStatus.RETURNED;
    } else if (statusString.includes('cancel')) {
      status = CourierParcelStatus.CANCELLED;
    }

    return {
      tracking_id: trackingId,
      status,
      location: payload.hub_name || 'Steadfast Hub',
      notes: payload.notes || 'Steadfast status update',
    };
  }
}
