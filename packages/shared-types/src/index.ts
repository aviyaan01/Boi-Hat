// Enums matching DB Schema & Business Logic
export enum Role {
  BUYER = 'buyer',
  SELLER = 'seller',
  MERCHANT = 'merchant',
  ADMIN = 'admin',
}

export enum SubscriptionPlan {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
  PREMIUM = 'premium',
}

export enum BookCondition {
  NEW = 'new',
  LIKE_NEW = 'like_new',
  GOOD = 'good',
  ACCEPTABLE = 'acceptable',
}

export enum BookLanguage {
  BN = 'bn',
  EN = 'en',
  AR = 'ar',
  HI = 'hi',
  UR = 'ur',
  OTHER = 'other',
}

export enum BookStatus {
  PENDING_REVIEW = 'pending_review',
  ACTIVE = 'active',
  SOLD = 'sold',
  INACTIVE = 'inactive',
  REMOVED = 'removed',
}

export enum WeightBucket {
  UNDER_300G = 'under_300g', // <300g
  BETWEEN_300G_1KG = 'between_300g_1kg', // 300g-1kg
  OVER_1KG = 'over_1kg', // 1kg+
}

export enum PaymentMethod {
  COD = 'cod',
  SSLCOMMERZ = 'sslcommerz',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
}

export enum FeaturedPackage {
  URGENT_3D = 'urgent_3d',
  FEATURED_5D = 'featured_5d',
  FEATURED_HOME_7D = 'featured_home_7d',
}

export enum FeaturedStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum DisputeStatus {
  OPEN = 'open',
  RESOLVED_BUYER = 'resolved_buyer',
  RESOLVED_SELLER = 'resolved_seller',
  CLOSED = 'closed',
}

export enum PayoutMethod {
  BKASH = 'bkash',
  BANK = 'bank',
}

export enum PayoutStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PAID = 'paid',
  REJECTED = 'rejected',
}

export enum ReportTarget {
  BOOK = 'book',
  USER = 'user',
  SHOP = 'shop',
}

export enum ReportStatus {
  OPEN = 'open',
  ACTIONED = 'actioned',
  DISMISSED = 'dismissed',
}

// API Standard Envelope
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

// User & Shop Types
export interface UserProfile {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  role: Role;
  avatar_url: string | null;
  city: string | null;
  area: string | null;
  rating_avg: number;
  rating_count: number;
  is_phone_verified: boolean;
  is_banned: boolean;
  created_at: string;
}

export interface PublicSellerProfile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  city: string | null;
  area: string | null;
  rating_avg: number;
  rating_count: number;
  active_listings_count: number;
  joined_at: string;
}

export interface ShopProfile {
  id: string;
  user_id: string;
  name: string;
  logo_url: string | null;
  cover_url: string | null;
  trade_license_number: string | null;
  address: string;
  map_lat: number | null;
  map_lng: number | null;
  contact_phone: string;
  is_verified: boolean;
  slug: string;
  subscription_plan: SubscriptionPlan;
}

// Category Types
export interface CategoryNode {
  id: string;
  parent_id: string | null;
  name_en: string;
  name_bn: string;
  level: number;
  icon_url: string | null;
  sort_order: number;
  slug: string;
  children?: CategoryNode[];
}

// Author & Publisher Types
export interface Author {
  id: string;
  name_en: string;
  name_bn: string;
  aliases: string[];
  photo_url: string | null;
}

export interface Publisher {
  id: string;
  name_en: string;
  name_bn: string;
}

// Book & Image Types
export interface BookImage {
  id: string;
  book_id: string;
  url: string;
  sort_order: number;
  is_primary: boolean;
}

export interface BookDetail {
  id: string;
  seller_id: string;
  shop_id: string | null;
  title_en: string;
  title_bn: string;
  author_id: string | null;
  publisher_id: string | null;
  description: string;
  condition: BookCondition;
  language: BookLanguage;
  price: number;
  original_price: number | null;
  edition: string | null;
  publication_year: number | null;
  is_rare: boolean;
  is_featured: boolean;
  stock_count: number;
  status: BookStatus;
  view_count: number;
  weight_bucket: WeightBucket;
  created_at: string;
  author?: Author | null;
  publisher?: Publisher | null;
  seller?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
    rating_avg: number;
    rating_count: number;
    city: string | null;
    area: string | null;
  };
  shop?: ShopProfile | null;
  images: BookImage[];
  categories: CategoryNode[];
  rare_details?: {
    printing_condition_notes: string | null;
    authenticity_note: string | null;
    provenance: string | null;
    is_verified_rare: boolean;
    verified_at: string | null;
  } | null;
  rare_book_details?: {
    printing_condition_notes: string | null;
    authenticity_note: string | null;
    provenance: string | null;
    is_verified_rare: boolean;
    verified_at: string | null;
  } | null;
}

// Filter / Query Types
export interface BookFilterQuery {
  page?: number;
  limit?: number;
  q?: string;
  category_id?: string;
  category_slug?: string;
  author_id?: string;
  publisher_id?: string;
  language?: BookLanguage;
  condition?: BookCondition;
  min_price?: number;
  max_price?: number;
  city?: string;
  area?: string;
  is_rare?: boolean;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'popular';
}

// Order Types
export interface OrderDetail {
  id: string;
  buyer_id: string;
  seller_id: string;
  book_id: string;
  price: number;
  delivery_fee: number;
  platform_fee: number;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  delivery_address: string;
  courier_provider: string | null;
  courier_tracking_id: string | null;
  delivered_at: string | null;
  dispute_window_expires_at: string | null;
  created_at: string;
  book?: BookDetail;
  buyer?: UserProfile;
  seller?: UserProfile;
}

// Messaging Types
export interface MessageItem {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  read_at: string | null;
  created_at: string;
}

export interface ConversationThread {
  id: string;
  buyer_id: string;
  seller_id: string;
  book_id: string;
  created_at: string;
  updated_at: string;
  book?: BookDetail;
  buyer?: UserProfile;
  seller?: UserProfile;
  last_message?: MessageItem;
  messages?: MessageItem[];
}

// --- Phase 3 Types ---

// Featured Ads Types (Section 10.1)
export interface AdPackage {
  id: FeaturedPackage;
  name_en: string;
  name_bn: string;
  duration_days: number;
  price: number; // BDT
  badge_label_en: string;
  badge_label_bn: string;
  description_en: string;
  description_bn: string;
}

export interface FeaturedAd {
  id: string;
  book_id: string | null;
  shop_id: string | null;
  package_type: FeaturedPackage;
  fee_paid: number;
  starts_at: string;
  expires_at: string;
  status: FeaturedStatus;
  payment_id: string | null;
  created_at: string;
  updated_at?: string;
  book?: BookDetail;
}

// Payment Types (Section 11)
export interface PaymentRecord {
  id: string;
  order_id?: string | null;
  provider: string;
  provider_transaction_id: string | null;
  amount: number;
  status: string;
  raw_payload?: any;
  created_at: string;
  updated_at: string;
}

export interface PaymentInitDto {
  amount: number;
  order_id?: string;
  book_id?: string;
  ad_package?: FeaturedPackage;
  redirect_url?: string;
}

export interface PaymentInitResponse {
  payment_id: string;
  transaction_id: string;
  gateway_url: string;
  amount: number;
}

// Seller Wallet & Escrow Types (Section 10.2)
export interface WalletSummary {
  user_id: string;
  available_balance: number;
  pending_balance: number;
  total_withdrawn: number;
  currency: string;
  transactions: WalletTransaction[];
  payout_requests: PayoutRequest[];
}

export interface WalletTransaction {
  id: string;
  wallet_id?: string;
  amount: number;
  type: 'credit_pending' | 'credit_available' | 'withdrawal' | 'refund' | 'ad_fee';
  reference_id: string;
  description: string;
  created_at: string;
}

export interface PayoutRequest {
  id: string;
  wallet_id: string;
  amount: number;
  method: PayoutMethod;
  account_number: string;
  bank_name?: string;
  branch_name?: string;
  status: PayoutStatus;
  requested_at: string;
  processed_at?: string | null;
}

export interface PayoutRequestDto {
  amount: number;
  method: PayoutMethod;
  account_number: string;
  bank_name?: string;
  branch_name?: string;
}

// Order Reviews & Seller Ratings (Section 5 & 8)
export interface OrderReview {
  id: string;
  order_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number; // 1 to 5
  comment: string | null;
  created_at: string;
  reviewer?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
  order?: {
    id: string;
    book?: {
      id: string;
      title_en: string;
      title_bn: string;
    };
  };
}

export interface CreateReviewDto {
  rating: number;
  comment?: string;
}

