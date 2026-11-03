import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ICourierProvider, CourierCreationResult, ParsedWebhookEvent } from './courier.interface';
import { CreateParcelDto, CourierParcelStatus } from '@boi-hat/shared-types';

@Injectable()
export class RedxCourierProvider implements ICourierProvider {
  private readonly logger = new Logger(RedxCourierProvider.name);
  private readonly isLive: boolean;
  private readonly apiToken: string;

  constructor(private readonly config: ConfigService) {
    this.isLive = this.config.get<string>('REDX_IS_LIVE', 'false') === 'true';
    this.apiToken = this.config.get<string>('REDX_API_TOKEN', 'dev_redx_token');
  }

  async createParcel(dto: CreateParcelDto): Promise<CourierCreationResult> {
    const isMock = !this.isLive && (!this.apiToken || this.apiToken === 'dev_redx_token');

    if (isMock) {
      const trackingId = `REDX-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;
      const consignmentId = `CN-REDX-${Date.now()}`;
      const isDhaka = (dto.recipient_city || 'Dhaka').toLowerCase().includes('dhaka');
      const deliveryFee = isDhaka ? 60 : 120;

      this.logger.log(`[RedX Mock] Created simulated parcel: ${trackingId}`);
      return {
        consignment_id: consignmentId,
        tracking_id: trackingId,
        delivery_fee: deliveryFee,
      };
    }

    const trackingId = `REDX-${Date.now().toString().slice(-6)}`;
    return {
      consignment_id: `CN-REDX-${Date.now()}`,
      tracking_id: trackingId,
      delivery_fee: 60,
    };
  }

  verifyWebhook(payload: any, headers?: Record<string, any>): boolean {
    if (!payload) return false;
    return true;
  }

  parseWebhookEvent(payload: any): ParsedWebhookEvent {
    const trackingId = payload.tracking_id || payload.parcel_id || payload.tracking_number;
    const statusString = (payload.status || payload.event || '').toLowerCase();

    let status = CourierParcelStatus.PENDING_PICKUP;
    if (statusString.includes('picked') || statusString.includes('pickup')) {
      status = CourierParcelStatus.PICKED_UP;
    } else if (statusString.includes('transit') || statusString.includes('hub')) {
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
      location: payload.location || 'RedX Hub',
      notes: payload.notes || 'RedX status update',
    };
  }
}
