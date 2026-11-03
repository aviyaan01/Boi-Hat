import { CreateParcelDto, CourierParcel, DeliveryFeeEstimate } from '@boi-hat/shared-types';

export interface CourierCreationResult {
  consignment_id: string;
  tracking_id: string;
  delivery_fee: number;
}

export interface ParsedWebhookEvent {
  tracking_id: string;
  status: string;
  location?: string;
  notes?: string;
}

export interface ICourierProvider {
  createParcel(dto: CreateParcelDto): Promise<CourierCreationResult>;
  verifyWebhook(payload: any, headers?: Record<string, any>): boolean;
  parseWebhookEvent(payload: any): ParsedWebhookEvent;
}

