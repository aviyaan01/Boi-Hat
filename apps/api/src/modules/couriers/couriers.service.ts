import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../../common/database.service';
import { PathaoCourierProvider } from './providers/pathao.provider';
import { SteadfastCourierProvider } from './providers/steadfast.provider';
import { RedxCourierProvider } from './providers/redx.provider';
import { ICourierProvider } from './providers/courier.interface';
import {
  CourierProvider,
  CourierParcelStatus,
  CreateParcelDto,
  WeightBucket,
} from '@boi-hat/shared-types';

@Injectable()
export class CouriersService {
  private readonly logger = new Logger(CouriersService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly pathao: PathaoCourierProvider,
    private readonly steadfast: SteadfastCourierProvider,
    private readonly redx: RedxCourierProvider,
  ) {}

  private getProvider(provider: CourierProvider = CourierProvider.PATHAO): ICourierProvider {
    switch (provider) {
      case CourierProvider.STEADFAST:
        return this.steadfast;
      case CourierProvider.REDX:
        return this.redx;
      default:
        return this.pathao;
    }
  }

  async createParcel(sellerId: string, dto: CreateParcelDto) {
    const order = await this.db.getOrderById(dto.order_id);
    if (!order) throw new NotFoundException('অর্ডারটি পাওয়া যায়নি');

    // Only seller or admin can book courier for an order
    if (order.seller_id !== sellerId) {
      throw new BadRequestException('শুধুমাত্র বিক্রেতা এই অর্ডারের জন্য কুরিয়ার বুক করতে পারবেন');
    }

    const providerType = dto.courier_provider || CourierProvider.PATHAO;
    const provider = this.getProvider(providerType);

    // 1. Call provider API or mock
    const providerResult = await provider.createParcel(dto);

    // 2. Persist in database
    const parcel = await this.db.createCourierParcel({
      ...dto,
      courier_provider: providerType,
    });

    this.logger.log(
      `[Courier] Parcel booked for order #${order.id.slice(0, 8)} via ${providerType.toUpperCase()}: ${parcel.tracking_id}`,
    );

    return parcel;
  }

  async getParcelTracking(trackingId: string) {
    const parcel = await this.db.getCourierParcelByTrackingId(trackingId);
    if (!parcel) throw new NotFoundException('ট্র্যাকিং আইডি পাওয়া যায়নি');
    return parcel;
  }

  async getParcelByOrderId(orderId: string) {
    const parcel = await this.db.getCourierParcelByOrderId(orderId);
    return parcel;
  }

  async handleWebhook(providerName: string, payload: any, headers?: any) {
    this.logger.log(`Received courier webhook from ${providerName}`);

    const providerType = providerName.toLowerCase() as CourierProvider;
    const provider = this.getProvider(providerType);

    const isValid = provider.verifyWebhook(payload, headers);
    if (!isValid) {
      throw new BadRequestException('অবৈধ কুরিয়ার সিগনেচার');
    }

    const event = provider.parseWebhookEvent(payload);
    if (!event || !event.tracking_id) {
      throw new BadRequestException('ওয়েবহুকে ট্র্যাকিং আইডি অনুপস্থিত');
    }

    const updated = await this.db.updateCourierParcelStatus(
      event.tracking_id,
      event.status as CourierParcelStatus,
      event.location,
      event.notes,
    );

    if (!updated) {
      throw new NotFoundException(`পার্সেল ${event.tracking_id} পাওয়া যায়নি`);
    }

    return {
      success: true,
      tracking_id: event.tracking_id,
      status: updated.status,
    };
  }

  async simulateCourierEvent(
    trackingId: string,
    status: CourierParcelStatus,
    location?: string,
    notes?: string,
  ) {
    const parcel = await this.db.getCourierParcelByTrackingId(trackingId);
    if (!parcel) throw new NotFoundException('পার্সেল পাওয়া যায়নি');

    const updated = await this.db.updateCourierParcelStatus(trackingId, status, location, notes);
    return {
      success: true,
      parcel: updated,
    };
  }

  estimateDeliveryFee(
    city?: string,
    weightBucket?: WeightBucket,
    provider?: CourierProvider,
  ) {
    return this.db.calculateDeliveryFee(city, weightBucket, provider);
  }
}
