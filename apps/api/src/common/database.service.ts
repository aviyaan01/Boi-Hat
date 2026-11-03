import { Injectable, Logger, OnModuleInit, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  Role,
  BookCondition,
  BookLanguage,
  BookStatus,
  WeightBucket,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  BookFilterQuery,
  FeaturedPackage,
  FeaturedStatus,
  PayoutMethod,
  PayoutStatus,
  AdPackage,
  PayoutRequestDto,
  CourierProvider,
  CourierParcelStatus,
  CreateParcelDto,
  DeliveryFeeEstimate,
} from '@boi-hat/shared-types';
import { CATEGORIES_SEED, AUTHORS_SEED, PUBLISHERS_SEED, SHOPS_SEED } from '../../prisma/seed/seedData';
import { generate160Books } from '../../prisma/seed/seedBooks';
import { v4 as uuidv4 } from 'uuid';

export const AD_PACKAGES: AdPackage[] = [
  {
    id: FeaturedPackage.URGENT_3D,
    name_en: 'Urgent Sale (3 Days)',
    name_bn: 'জরুরি বিক্রি (৩ দিন)',
    duration_days: 3,
    price: 20,
    badge_label_en: 'Urgent',
    badge_label_bn: 'জরুরি',
    description_en: 'Highlight your listing with an urgent badge to sell within 72 hours.',
    description_bn: 'বইটি দ্রুত বিক্রি করতে ৩ দিনের জন্য জরুরি ব্যাজ সহ সবার উপরে দেখান।',
  },
  {
    id: FeaturedPackage.FEATURED_5D,
    name_en: 'Featured Listing (5 Days)',
    name_bn: 'ফিচার্ড বিজ্ঞাপন (৫ দিন)',
    duration_days: 5,
    price: 35,
    badge_label_en: 'Featured',
    badge_label_bn: 'ফিচার্ড',
    description_en: 'Promote your book at the top of category and search results for 5 days.',
    description_bn: '৫ দিনের জন্য ক্যাটাগরি ও সার্চ রেজাল্ট পেজের শীর্ষে সবার উপরে বিজ্ঞাপন।',
  },
  {
    id: FeaturedPackage.FEATURED_HOME_7D,
    name_en: 'Homepage Spotlight (7 Days)',
    name_bn: 'হোমপেজ ফিচার্ড (৭ দিন)',
    duration_days: 7,
    price: 50,
    badge_label_en: 'Top Featured',
    badge_label_bn: 'টপ ফিচার্ড',
    description_en: 'Maximum visibility on the homepage and across all searches for 7 days.',
    description_bn: '৭ দিনের জন্য হোমপেজের মূল ব্যানারে এবং সব ব্রাউজিং পেজে সর্বোচ্চ ভিউ।',
  },
];

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  // In-memory / fast local repository collections
  private users: any[] = [];
  private shops: any[] = [];
  private categories: any[] = [];
  private authors: any[] = [];
  private publishers: any[] = [];
  private books: any[] = [];
  private bookImages: any[] = [];
  private bookCategories: any[] = [];
  private rareBookDetails: any[] = [];
  private authorRequests: any[] = [];
  private conversations: any[] = [];
  private messages: any[] = [];
  private orders: any[] = [];
  private disputes: any[] = [];
  private reports: any[] = [];
  private userPreferences: any[] = [];
  private userBehaviorEvents: any[] = [];
  private wishlists: any[] = [];
  private savedSearches: any[] = [];
  private notifications: any[] = [];
  private featuredAds: any[] = [];
  private payments: any[] = [];
  private sellerWallets: any[] = [];
  private payoutRequests: any[] = [];
  private walletTransactions: any[] = [];
  private reviews: any[] = [];
  private courierParcels: any[] = [];

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    this.initDefaultSeedData();
    this.logger.log(`Database store initialized with ${this.books.length} books, ${this.categories.length} categories, ${this.authors.length} authors.`);
  }

  private initDefaultSeedData() {
    // 1. Seed Users
    const adminUser = {
      id: 'admin-user-uuid-1',
      phone: '+8801700000000',
      name: 'Boi-Hat Admin (এডমিন)',
      email: 'admin@boihat.com',
      role: Role.ADMIN,
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
      city: 'Dhaka',
      area: 'Shahbagh',
      rating_avg: 5.0,
      rating_count: 50,
      is_phone_verified: true,
      is_banned: false,
      created_at: new Date().toISOString(),
    };

    const sellerUser1 = {
      id: 'seller-user-uuid-1',
      phone: '+8801711111111',
      name: 'Tanvir Ahmed (তানভীর আহমেদ)',
      email: 'tanvir@example.com',
      role: Role.SELLER,
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
      city: 'Dhaka',
      area: 'Nilkhet',
      rating_avg: 4.8,
      rating_count: 34,
      is_phone_verified: true,
      is_banned: false,
      created_at: new Date().toISOString(),
    };

    const sellerUser2 = {
      id: 'seller-user-uuid-2',
      phone: '+8801722222222',
      name: 'Farhana Rahman (ফারহানা রহমান)',
      email: 'farhana@example.com',
      role: Role.SELLER,
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
      city: 'Dhaka',
      area: 'Dhanmondi',
      rating_avg: 4.9,
      rating_count: 22,
      is_phone_verified: true,
      is_banned: false,
      created_at: new Date().toISOString(),
    };

    const buyerUser = {
      id: 'buyer-user-uuid-1',
      phone: '+8801733333333',
      name: 'Sabbir Hossain (সাব্বির হোসেন)',
      email: 'sabbir@example.com',
      role: Role.BUYER,
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
      city: 'Dhaka',
      area: 'Uttara',
      rating_avg: 5.0,
      rating_count: 8,
      is_phone_verified: true,
      is_banned: false,
      created_at: new Date().toISOString(),
    };

    this.users = [adminUser, sellerUser1, sellerUser2, buyerUser];

    // 2. Seed Shops
    this.shops = SHOPS_SEED.map((s, idx) => ({
      id: `shop-uuid-${idx + 1}`,
      user_id: idx === 0 ? sellerUser1.id : sellerUser2.id,
      name: s.name,
      logo_url: s.logo_url,
      cover_url: null,
      trade_license_number: `TR-DHK-${1000 + idx}`,
      trade_license_doc_url: null,
      address: s.address,
      map_lat: 23.7334 + idx * 0.01,
      map_lng: 90.3854 + idx * 0.01,
      contact_phone: s.contact_phone,
      is_verified: s.is_verified,
      slug: s.slug,
      subscription_plan: s.subscription_plan,
      subscription_expires_at: null,
      created_at: new Date().toISOString(),
    }));

    // 3. Seed Categories
    const catMap = new Map<string, string>();
    this.categories = CATEGORIES_SEED.map((c) => {
      const id = `cat-uuid-${c.slug}`;
      catMap.set(c.slug, id);
      return {
        id,
        parent_id: c.parent_slug ? catMap.get(c.parent_slug) || null : null,
        parent_slug: c.parent_slug || null,
        name_en: c.name_en,
        name_bn: c.name_bn,
        level: c.level,
        icon_url: c.icon_url || null,
        sort_order: 0,
        slug: c.slug,
        created_at: new Date().toISOString(),
      };
    });

    // Fix parent_ids after all categories are registered
    this.categories.forEach((c) => {
      if (c.parent_slug) {
        c.parent_id = catMap.get(c.parent_slug) || null;
      }
    });

    // 4. Seed Authors
    this.authors = AUTHORS_SEED.map((a, idx) => ({
      id: `author-uuid-${idx + 1}`,
      name_en: a.name_en,
      name_bn: a.name_bn,
      aliases: a.aliases,
      photo_url: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80`,
      created_at: new Date().toISOString(),
    }));

    // 5. Seed Publishers
    this.publishers = PUBLISHERS_SEED.map((p, idx) => ({
      id: `publisher-uuid-${idx + 1}`,
      name_en: p.name_en,
      name_bn: p.name_bn,
      created_at: new Date().toISOString(),
    }));

    // 6. Seed 160 Realistic Books
    const generated = generate160Books();
    this.books = [];
    this.bookImages = [];
    this.bookCategories = [];
    this.rareBookDetails = [];

    generated.forEach((b, idx) => {
      const bookId = `book-uuid-${idx + 1}`;
      const seller = idx % 2 === 0 ? sellerUser1 : sellerUser2;
      const shop = idx % 3 === 0 ? this.shops[0] : idx % 3 === 1 ? this.shops[1] : null;
      const author = this.authors[b.author_index] || this.authors[0];
      const publisher = this.publishers[b.publisher_index] || this.publishers[0];

      this.books.push({
        id: bookId,
        seller_id: seller.id,
        shop_id: shop ? shop.id : null,
        title_en: b.title_en,
        title_bn: b.title_bn,
        author_id: author.id,
        publisher_id: publisher.id,
        description: b.description,
        condition: b.condition as BookCondition,
        language: (b.language || 'bn') as BookLanguage,
        price: b.price,
        original_price: b.original_price || null,
        edition: b.edition || null,
        publication_year: b.publication_year || null,
        is_rare: b.is_rare || false,
        is_featured: b.is_featured || false,
        stock_count: b.stock_count || 1,
        status: BookStatus.ACTIVE,
        view_count: Math.floor(Math.random() * 85) + 10,
        weight_bucket: b.weight_bucket as WeightBucket,
        created_at: new Date(Date.now() - (160 - idx) * 3600000).toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Images (min 3 images per book!)
      b.images.forEach((imgUrl, imgIdx) => {
        this.bookImages.push({
          id: `img-uuid-${bookId}-${imgIdx + 1}`,
          book_id: bookId,
          url: imgUrl,
          sort_order: imgIdx,
          is_primary: imgIdx === 0,
          created_at: new Date().toISOString(),
        });
      });

      // Categories
      b.category_slugs.forEach((slug) => {
        const cat = this.categories.find((c) => c.slug === slug);
        if (cat) {
          this.bookCategories.push({
            id: `book-cat-${bookId}-${cat.id}`,
            book_id: bookId,
            category_id: cat.id,
          });
        }
      });

      // Rare details if rare
      if (b.is_rare) {
        this.rareBookDetails.push({
          id: `rare-uuid-${bookId}`,
          book_id: bookId,
          printing_condition_notes: 'সংগ্রাহক সংস্করণ: অক্ষত কভার, প্রথম মুদ্রণের হলোগ্রামযুক্ত।',
          authenticity_note: 'আজিজ সুপার মার্কেট ভিন্টেজ বুকস যাচাইকৃত খাঁটি কপি।',
          provenance: 'ব্যক্তিগত সংগ্রহ থেকে প্রাপ্ত',
          is_verified_rare: true,
          verified_by_admin_id: adminUser.id,
          verified_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });
      }
    });

    // 7. Seed Demo Conversation & Order
    const demoBook = this.books[0];
    const demoConv = {
      id: 'conv-demo-1',
      buyer_id: buyerUser.id,
      seller_id: sellerUser1.id,
      book_id: demoBook.id,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.conversations.push(demoConv);

    this.messages.push(
      {
        id: 'msg-1',
        conversation_id: demoConv.id,
        sender_id: buyerUser.id,
        text: 'আসসালামু আলাইকুম ভাই, বইটি কি এখনো পাওয়া যাবে? পাতার বাঁধাই ঠিক আছে তো?',
        read_at: new Date().toISOString(),
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'msg-2',
        conversation_id: demoConv.id,
        sender_id: sellerUser1.id,
        text: 'ওয়ালাইকুমুস সালাম! জ্বি ভাইয়া, একদম ভালো অবস্থায় আছে, কোন পাতা ছেঁড়া বা দাগ নেই। আপনি অর্ডার করলে আজই পাঠাতে পারব।',
        read_at: new Date().toISOString(),
        created_at: new Date(Date.now() - 1800000).toISOString(),
      },
    );

    const demoOrder = {
      id: 'order-demo-1',
      buyer_id: buyerUser.id,
      seller_id: sellerUser1.id,
      book_id: demoBook.id,
      price: demoBook.price,
      delivery_fee: 60,
      platform_fee: 0,
      total_amount: demoBook.price + 60,
      payment_method: PaymentMethod.COD,
      payment_status: PaymentStatus.PENDING,
      order_status: OrderStatus.CONFIRMED,
      delivery_address: 'House 14, Road 7, Sector 4, Uttara, Dhaka-1230',
      courier_provider: 'Pathao Courier',
      courier_tracking_id: 'PT-DHK-99281',
      delivered_at: null,
      dispute_window_expires_at: null,
      created_at: new Date(Date.now() - 900000).toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.orders.push(demoOrder);

    // 8. Seed Phase 3 Data: Delivered Order, Reviews, Wallets, and Featured Ad
    const deliveredBook = this.books[1] || demoBook;
    const deliveredOrder = {
      id: 'order-delivered-demo-1',
      buyer_id: buyerUser.id,
      seller_id: sellerUser1.id,
      book_id: deliveredBook.id,
      price: deliveredBook.price,
      delivery_fee: 60,
      platform_fee: 0,
      total_amount: deliveredBook.price + 60,
      payment_method: PaymentMethod.COD,
      payment_status: PaymentStatus.PAID,
      order_status: OrderStatus.DELIVERED,
      delivery_address: 'House 14, Road 7, Sector 4, Uttara, Dhaka-1230',
      courier_provider: 'Pathao Courier',
      courier_tracking_id: 'PT-DHK-88123',
      delivered_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      dispute_window_expires_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      escrow_credited: true,
      escrow_released: true,
      created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    };
    this.orders.push(deliveredOrder);

    // Review for delivered order
    const demoReview = {
      id: 'rev-demo-1',
      order_id: deliveredOrder.id,
      reviewer_id: buyerUser.id,
      reviewee_id: sellerUser1.id,
      rating: 5,
      comment: 'খুব ভালো প্যাকেজিং এবং অক্ষত বই পেয়েছি। বিক্রেতার সাথে যোগাযোগ খুব সহজ ছিল। ধন্যবাদ বই-হাট!',
      created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    };
    this.reviews.push(demoReview);

    // Wallets for sellers
    this.sellerWallets.push({
      id: 'wallet-seller-1',
      user_id: sellerUser1.id,
      shop_id: this.shops[0]?.id || null,
      available_balance: 750,
      pending_balance: 320,
      updated_at: new Date().toISOString(),
    });

    this.sellerWallets.push({
      id: 'wallet-seller-2',
      user_id: sellerUser2.id,
      shop_id: this.shops[1]?.id || null,
      available_balance: 450,
      pending_balance: 0,
      updated_at: new Date().toISOString(),
    });

    // Seed transactions for seller 1
    this.walletTransactions.push(
      {
        id: 'trx-seed-1',
        wallet_id: 'wallet-seller-1',
        amount: deliveredBook.price,
        type: 'credit_available',
        reference_id: deliveredOrder.id,
        description: `অর্ডার #${deliveredOrder.id.slice(0, 8)} - বায়ার প্রোটেকশন সময় সমাপ্তে ব্যালেন্স অবমুক্ত`,
        created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      },
      {
        id: 'trx-seed-2',
        wallet_id: 'wallet-seller-1',
        amount: 320,
        type: 'credit_pending',
        reference_id: 'order-pending-demo',
        description: 'অর্ডার ডেলিভারি সম্পন্ন (৪৮ ঘণ্টা বায়ার প্রোটেকশন চালু)',
        created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      },
    );

    // Featured ad for first book
    this.books[0].is_featured = true;
    this.featuredAds.push({
      id: 'ad-seed-1',
      book_id: this.books[0].id,
      shop_id: this.shops[0]?.id || null,
      package_type: FeaturedPackage.FEATURED_HOME_7D,
      fee_paid: 50,
      starts_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      expires_at: new Date(Date.now() + 6 * 24 * 3600 * 1000).toISOString(),
      status: FeaturedStatus.ACTIVE,
      payment_id: 'pay-seed-1',
      created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    });

    // 9. Seed Phase 4 Courier Parcel for demo order
    this.courierParcels.push({
      id: 'parcel-demo-1',
      order_id: demoOrder.id,
      courier_provider: CourierProvider.PATHAO,
      consignment_id: 'CN-PT-99281',
      tracking_id: 'PT-DHK-99281',
      status: CourierParcelStatus.PICKED_UP,
      delivery_fee: 60,
      amount_to_collect: demoOrder.total_amount,
      recipient_name: buyerUser.name,
      recipient_phone: buyerUser.phone,
      recipient_address: demoOrder.delivery_address,
      recipient_city: 'Dhaka',
      recipient_area: 'Uttara',
      timeline: [
        {
          status: CourierParcelStatus.PENDING_PICKUP,
          title_bn: 'পার্সেল বুকিং গ্রহণ করা হয়েছে',
          title_en: 'Parcel Booking Created',
          description: 'বিক্রেতা পাঠাও কুরিয়ারে পিকআপ শিডিউল করেছেন।',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          location: 'Shahbagh Hub',
        },
        {
          status: CourierParcelStatus.PICKED_UP,
          title_bn: 'রাইডার পার্সেল সংগ্রহ করেছেন',
          title_en: 'Picked Up by Rider',
          description: 'বিক্রেতার কাছ থেকে পার্সেল সংগ্রহ করে সর্টিং হাবে পাঠানো হয়েছে।',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          location: 'Dhaka Central Hub',
        },
      ],
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date(Date.now() - 1800000).toISOString(),
    });
  }

  // --- Users Methods ---
  async getUserById(id: string) {
    if (this.prisma.isConnected) {
      try {
        return await this.prisma.user.findUnique({ where: { id } });
      } catch (e) {}
    }
    return this.users.find((u) => u.id === id) || null;
  }

  async getUserByPhone(phone: string) {
    if (this.prisma.isConnected) {
      try {
        return await this.prisma.user.findUnique({ where: { phone } });
      } catch (e) {}
    }
    return this.users.find((u) => u.phone === phone) || null;
  }

  async createUser(data: { phone: string; name?: string; role?: Role; city?: string }) {
    const newUser = {
      id: uuidv4(),
      phone: data.phone,
      name: data.name || null,
      email: null,
      role: data.role || Role.BUYER,
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name || data.phone)}`,
      city: data.city || 'Dhaka',
      area: null,
      rating_avg: 0.0,
      rating_count: 0,
      is_phone_verified: true,
      is_banned: false,
      token_version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (this.prisma.isConnected) {
      try {
        return await this.prisma.user.create({ data: newUser as any });
      } catch (e) {}
    }
    this.users.push(newUser);
    return newUser;
  }

  async updateUser(id: string, data: Partial<any>) {
    if (this.prisma.isConnected) {
      try {
        return await this.prisma.user.update({ where: { id }, data });
      } catch (e) {}
    }
    const user = this.users.find((u) => u.id === id);
    if (user) {
      Object.assign(user, data, { updated_at: new Date().toISOString() });
      return user;
    }
    return null;
  }

  async getPublicSellerProfile(id: string) {
    const user = await this.getUserById(id);
    if (!user) return null;

    const activeListings = this.books.filter(
      (b) => b.seller_id === id && b.status === BookStatus.ACTIVE,
    );

    return {
      id: user.id,
      name: user.name,
      avatar_url: user.avatar_url,
      city: user.city,
      area: user.area,
      rating_avg: Number(user.rating_avg) || 0,
      rating_count: user.rating_count || 0,
      active_listings_count: activeListings.length,
      joined_at: user.created_at,
      listings: activeListings.map((b) => this.hydrateBook(b)),
      reviews: (await this.getReviewsForUser(id)).slice(0, 10),
    };
  }

  // --- Categories Methods ---
  async getCategoriesTree() {
    const rootCategories = this.categories.filter((c) => !c.parent_id);

    const buildTree = (cat: any): any => {
      const children = this.categories
        .filter((c) => c.parent_id === cat.id)
        .map((child) => buildTree(child));
      return {
        ...cat,
        children: children.length > 0 ? children : undefined,
      };
    };

    return rootCategories.map((root) => buildTree(root));
  }

  async createCategory(data: { name_en: string; name_bn: string; parent_id?: string; icon_url?: string; slug?: string }) {
    const slug = data.slug || data.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const parent = data.parent_id ? this.categories.find((c) => c.id === data.parent_id) : null;
    const newCat = {
      id: `cat-uuid-${uuidv4()}`,
      parent_id: data.parent_id || null,
      name_en: data.name_en,
      name_bn: data.name_bn,
      level: parent ? parent.level + 1 : 1,
      icon_url: data.icon_url || null,
      sort_order: this.categories.length,
      slug,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.categories.push(newCat);
    return newCat;
  }

  async updateCategory(id: string, data: Partial<any>) {
    const cat = this.categories.find((c) => c.id === id);
    if (!cat) return null;
    Object.assign(cat, data, { updated_at: new Date().toISOString() });
    return cat;
  }

  async deleteCategory(id: string) {
    this.categories = this.categories.filter((c) => c.id !== id && c.parent_id !== id);
    return { deleted: true };
  }

  // --- Authors & Publishers ---
  async getAuthors() {
    return this.authors;
  }

  async searchAuthors(query: string) {
    if (!query) return this.authors.slice(0, 15);
    const q = query.toLowerCase().trim();
    return this.authors.filter((a) => {
      const matchEn = a.name_en.toLowerCase().includes(q);
      const matchBn = a.name_bn.includes(q);
      const matchAlias = (a.aliases || []).some((al: string) => al.toLowerCase().includes(q));
      return matchEn || matchBn || matchAlias;
    });
  }

  async createAuthorRequest(data: { name_en: string; name_bn: string }) {
    const req = {
      id: uuidv4(),
      name_en: data.name_en,
      name_bn: data.name_bn,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.authorRequests.push(req);
    return req;
  }

  async getPublishers() {
    return this.publishers;
  }

  // --- Books Methods ---
  private hydrateBook(b: any) {
    const author = this.authors.find((a) => a.id === b.author_id) || null;
    const publisher = this.publishers.find((p) => p.id === b.publisher_id) || null;
    const seller = this.users.find((u) => u.id === b.seller_id) || null;
    const shop = b.shop_id ? this.shops.find((s) => s.id === b.shop_id) : null;
    const images = this.bookImages.filter((img) => img.book_id === b.id).sort((a, b) => a.sort_order - b.sort_order);
    const catIds = this.bookCategories.filter((bc) => bc.book_id === b.id).map((bc) => bc.category_id);
    const categories = this.categories.filter((c) => catIds.includes(c.id));
    const rare_details = this.rareBookDetails.find((r) => r.book_id === b.id) || null;

    const activeAd = this.featuredAds.find(
      (fa) => fa.book_id === b.id && fa.status === FeaturedStatus.ACTIVE && new Date(fa.expires_at) > new Date(),
    );
    const isFeatured = !!activeAd || b.is_featured;
    const featuredPackage = activeAd ? activeAd.package_type : (b.is_featured ? FeaturedPackage.FEATURED_5D : null);

    return {
      ...b,
      is_featured: isFeatured,
      featured_package: featuredPackage,
      author,
      publisher,
      seller: seller
        ? {
            id: seller.id,
            name: seller.name,
            avatar_url: seller.avatar_url,
            rating_avg: Number(seller.rating_avg) || 0,
            rating_count: seller.rating_count || 0,
            city: seller.city,
            area: seller.area,
          }
        : null,
      shop,
      images,
      categories,
      rare_details,
    };
  }

  async getBooks(filter: BookFilterQuery = {}) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(filter.limit) || 20));

    let matched = this.books.filter((b) => b.status === BookStatus.ACTIVE);

    // Filter by query (Bangla, English, Banglish)
    if (filter.q) {
      const q = filter.q.toLowerCase().trim();
      matched = matched.filter((b) => {
        const titleMatch = b.title_en.toLowerCase().includes(q) || b.title_bn.includes(q);
        const author = this.authors.find((a) => a.id === b.author_id);
        const authorMatch =
          author &&
          (author.name_en.toLowerCase().includes(q) ||
            author.name_bn.includes(q) ||
            (author.aliases || []).some((al: string) => al.toLowerCase().includes(q)));
        const descMatch = b.description.toLowerCase().includes(q);
        return titleMatch || authorMatch || descMatch;
      });
    }

    // Category filter
    if (filter.category_id || filter.category_slug) {
      let targetCatId = filter.category_id;
      if (!targetCatId && filter.category_slug) {
        const cat = this.categories.find((c) => c.slug === filter.category_slug);
        if (cat) targetCatId = cat.id;
      }
      if (targetCatId) {
        // Include child category IDs too
        const relevantCatIds = [targetCatId];
        const childCats = this.categories.filter((c) => c.parent_id === targetCatId);
        childCats.forEach((c) => {
          relevantCatIds.push(c.id);
          const grandChildren = this.categories.filter((gc) => gc.parent_id === c.id);
          grandChildren.forEach((gc) => relevantCatIds.push(gc.id));
        });

        matched = matched.filter((b) => {
          const bCatIds = this.bookCategories.filter((bc) => bc.book_id === b.id).map((bc) => bc.category_id);
          return bCatIds.some((id) => relevantCatIds.includes(id));
        });
      }
    }

    // Author filter
    if (filter.author_id) {
      matched = matched.filter((b) => b.author_id === filter.author_id);
    }

    // Condition filter
    if (filter.condition) {
      matched = matched.filter((b) => b.condition === filter.condition);
    }

    // Language filter
    if (filter.language) {
      matched = matched.filter((b) => b.language === filter.language);
    }

    // Price filters
    if (filter.min_price !== undefined) {
      matched = matched.filter((b) => b.price >= Number(filter.min_price));
    }
    if (filter.max_price !== undefined) {
      matched = matched.filter((b) => b.price <= Number(filter.max_price));
    }

    // Rare filter
    if (filter.is_rare !== undefined) {
      const isRare = String(filter.is_rare) === 'true';
      matched = matched.filter((b) => b.is_rare === isRare);
    }

    // Sorting: featured ads come first per Section 10.1 (ORDER BY is_featured DESC)
    matched.sort((a, b) => {
      if (a.is_featured !== b.is_featured) {
        return a.is_featured ? -1 : 1;
      }
      if (filter.sort === 'price_asc') return a.price - b.price;
      if (filter.sort === 'price_desc') return b.price - a.price;
      if (filter.sort === 'popular') return b.view_count - a.view_count;
      // Default: newest
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const total = matched.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginated = matched.slice(start, start + limit);

    // Section 10.1: Visual cap of max 2-3 "Featured" badges per results page
    let featuredBadgesOnPage = 0;
    const data = paginated.map((b) => {
      const hydrated = this.hydrateBook(b);
      if (hydrated.is_featured && featuredBadgesOnPage < 3) {
        featuredBadgesOnPage++;
        hydrated.display_featured = true;
      } else {
        hydrated.display_featured = false;
      }
      return hydrated;
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getBookById(id: string) {
    const book = this.books.find((b) => b.id === id);
    if (!book) return null;
    book.view_count = (book.view_count || 0) + 1;
    return this.hydrateBook(book);
  }

  async createBook(data: {
    seller_id: string;
    shop_id?: string;
    title_en: string;
    title_bn: string;
    author_id?: string;
    publisher_id?: string;
    category_ids: string[];
    description: string;
    condition: BookCondition;
    language?: BookLanguage;
    price: number;
    original_price?: number;
    edition?: string;
    publication_year?: number;
    is_rare?: boolean;
    stock_count?: number;
    weight_bucket?: WeightBucket;
    images: string[];
  }) {
    const bookId = `book-uuid-${uuidv4()}`;

    const newBook = {
      id: bookId,
      seller_id: data.seller_id,
      shop_id: data.shop_id || null,
      title_en: data.title_en,
      title_bn: data.title_bn,
      author_id: data.author_id || null,
      publisher_id: data.publisher_id || null,
      description: data.description,
      condition: data.condition,
      language: data.language || BookLanguage.BN,
      price: Number(data.price),
      original_price: data.original_price ? Number(data.original_price) : null,
      edition: data.edition || null,
      publication_year: data.publication_year ? Number(data.publication_year) : null,
      is_rare: !!data.is_rare,
      is_featured: false,
      stock_count: data.stock_count || 1,
      status: BookStatus.ACTIVE,
      view_count: 1,
      weight_bucket: data.weight_bucket || WeightBucket.UNDER_300G,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.books.unshift(newBook);

    // Save images
    data.images.forEach((url, idx) => {
      this.bookImages.push({
        id: `img-uuid-${uuidv4()}`,
        book_id: bookId,
        url,
        sort_order: idx,
        is_primary: idx === 0,
        created_at: new Date().toISOString(),
      });
    });

    // Save category links
    data.category_ids.forEach((catId) => {
      this.bookCategories.push({
        id: `bc-uuid-${uuidv4()}`,
        book_id: bookId,
        category_id: catId,
      });
    });

    return this.hydrateBook(newBook);
  }

  async updateBook(id: string, data: Partial<any>) {
    const book = this.books.find((b) => b.id === id);
    if (!book) return null;

    Object.assign(book, data, { updated_at: new Date().toISOString() });
    return this.hydrateBook(book);
  }

  async deleteBook(id: string) {
    const book = this.books.find((b) => b.id === id);
    if (!book) return null;
    book.status = BookStatus.REMOVED;
    return { success: true };
  }

  // --- Conversations & Messages ---
  async getConversations(userId: string) {
    const threads = this.conversations.filter(
      (c) => c.buyer_id === userId || c.seller_id === userId,
    );

    return threads.map((t) => {
      const book = this.getBookById(t.book_id);
      const buyer = this.users.find((u) => u.id === t.buyer_id);
      const seller = this.users.find((u) => u.id === t.seller_id);
      const threadMsgs = this.messages
        .filter((m) => m.conversation_id === t.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const last_message = threadMsgs.length > 0 ? threadMsgs[threadMsgs.length - 1] : null;

      return {
        ...t,
        book,
        buyer,
        seller,
        last_message,
      };
    });
  }

  async getOrCreateConversation(buyerId: string, sellerId: string, bookId: string) {
    let thread = this.conversations.find(
      (c) => c.buyer_id === buyerId && c.seller_id === sellerId && c.book_id === bookId,
    );
    if (!thread) {
      thread = {
        id: `conv-uuid-${uuidv4()}`,
        buyer_id: buyerId,
        seller_id: sellerId,
        book_id: bookId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.conversations.unshift(thread);
    }
    return thread;
  }

  async getMessages(conversationId: string) {
    return this.messages
      .filter((m) => m.conversation_id === conversationId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  async sendMessage(conversationId: string, senderId: string, text: string) {
    const newMsg = {
      id: `msg-uuid-${uuidv4()}`,
      conversation_id: conversationId,
      sender_id: senderId,
      text,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    this.messages.push(newMsg);

    const thread = this.conversations.find((c) => c.id === conversationId);
    if (thread) {
      thread.updated_at = new Date().toISOString();
    }
    return newMsg;
  }

  // --- Orders ---
  async createOrder(data: {
    buyer_id: string;
    seller_id: string;
    book_id: string;
    delivery_address: string;
    payment_method?: PaymentMethod;
  }) {
    const book = this.books.find((b) => b.id === data.book_id);
    if (!book) throw new Error('BOOK_NOT_FOUND');

    const price = book.price;
    const delivery_fee = 60; // Dhaka standard inside city
    const platform_fee = 0;
    const total_amount = price + delivery_fee + platform_fee;

    const newOrder = {
      id: `order-uuid-${uuidv4()}`,
      buyer_id: data.buyer_id,
      seller_id: data.seller_id,
      book_id: data.book_id,
      price,
      delivery_fee,
      platform_fee,
      total_amount,
      payment_method: data.payment_method || PaymentMethod.COD,
      payment_status: PaymentStatus.PENDING,
      order_status: OrderStatus.PENDING,
      delivery_address: data.delivery_address,
      courier_provider: 'Pathao Courier',
      courier_tracking_id: null,
      delivered_at: null,
      dispute_window_expires_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.orders.unshift(newOrder);
    return this.hydrateOrder(newOrder);
  }

  async getOrderById(id: string) {
    const order = this.orders.find((o) => o.id === id);
    if (!order) return null;
    return this.hydrateOrder(order);
  }

  async getOrdersForUser(userId: string) {
    const userOrders = this.orders.filter(
      (o) => o.buyer_id === userId || o.seller_id === userId,
    );
    return userOrders.map((o) => this.hydrateOrder(o));
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, courierTrackingId?: string) {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return null;

    order.order_status = status;
    if (courierTrackingId) {
      order.courier_tracking_id = courierTrackingId;
    }
    if (status === OrderStatus.DELIVERED) {
      const now = new Date();
      order.delivered_at = now.toISOString();
      // 48 hours dispute window
      order.dispute_window_expires_at = new Date(now.getTime() + 48 * 3600 * 1000).toISOString();
      if (order.payment_method === PaymentMethod.COD) {
        order.payment_status = PaymentStatus.PAID;
      }

      // Escrow flow: credit pending balance to seller's wallet
      if (!order.escrow_credited) {
        order.escrow_credited = true;
        const wallet = await this.getOrCreateWallet(order.seller_id);
        const earning = order.price - (order.platform_fee || 0);
        wallet.pending_balance += earning;
        wallet.updated_at = now.toISOString();

        this.walletTransactions.push({
          id: `trx-${uuidv4()}`,
          wallet_id: wallet.id,
          amount: earning,
          type: 'credit_pending',
          reference_id: order.id,
          description: `অর্ডার #${order.id.slice(0, 8)} ডেলিভারি সম্পন্ন (৪৮ ঘণ্টা বায়ার প্রোটেকশন চালু)`,
          created_at: now.toISOString(),
        });
      }
    }
    order.updated_at = new Date().toISOString();
    return this.hydrateOrder(order);
  }

  async updateOrder(orderId: string, data: Partial<any>) {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return null;
    Object.assign(order, data, { updated_at: new Date().toISOString() });
    return this.hydrateOrder(order);
  }

  private hydrateOrder(order: any) {
    const book = this.books.find((b) => b.id === order.book_id);
    const buyer = this.users.find((u) => u.id === order.buyer_id);
    const seller = this.users.find((u) => u.id === order.seller_id);
    const review = this.reviews.find((r) => r.order_id === order.id) || null;
    const parcel = this.courierParcels.find((p) => p.order_id === order.id || (order.courier_tracking_id && p.tracking_id === order.courier_tracking_id)) || null;

    return {
      ...order,
      book: book ? this.hydrateBook(book) : null,
      buyer: buyer ? { id: buyer.id, name: buyer.name, phone: buyer.phone } : null,
      seller: seller ? { id: seller.id, name: seller.name, phone: seller.phone } : null,
      review: review
        ? {
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            created_at: review.created_at,
          }
        : null,
      courier_parcel: parcel,
    };
  }

  // --- Wishlist, Preferences & Saved Searches (Phase 2) ---
  async getWishlist(userId: string) {
    const bookIds = this.wishlists.filter((w) => w.user_id === userId).map((w) => w.book_id);
    const matchedBooks = this.books.filter((b) => bookIds.includes(b.id) && b.status === BookStatus.ACTIVE);
    return matchedBooks.map((b) => this.hydrateBook(b));
  }

  async isBookWishlisted(userId: string, bookId: string): Promise<boolean> {
    return this.wishlists.some((w) => w.user_id === userId && w.book_id === bookId);
  }

  async addToWishlist(userId: string, bookId: string) {
    if (!this.wishlists.some((w) => w.user_id === userId && w.book_id === bookId)) {
      this.wishlists.push({
        id: `wish-${uuidv4()}`,
        user_id: userId,
        book_id: bookId,
        created_at: new Date().toISOString(),
      });
      // Log behavior event (weight +5 per Section 9.2)
      await this.logBehaviorEvent(userId, 'wishlist', bookId, { action: 'add_to_wishlist' });
    }
    return { success: true };
  }

  async removeFromWishlist(userId: string, bookId: string) {
    this.wishlists = this.wishlists.filter((w) => !(w.user_id === userId && w.book_id === bookId));
    return { success: true };
  }

  async getSavedSearches(userId: string) {
    return this.savedSearches.filter((s) => s.user_id === userId);
  }

  async saveSearch(userId: string, query_json: any, notify_enabled: boolean = true) {
    const saved = {
      id: `saved-search-${uuidv4()}`,
      user_id: userId,
      query_json,
      notify_enabled,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.savedSearches.unshift(saved);
    return saved;
  }

  async deleteSavedSearch(userId: string, id: string) {
    this.savedSearches = this.savedSearches.filter((s) => !(s.id === id && s.user_id === userId));
    return { success: true };
  }

  // User Preferences & Onboarding (Section 9.1)
  async saveOnboardingPreferences(
    userId: string,
    data: {
      category_ids: string[];
      author_ids?: string[];
      languages?: string[];
    },
  ) {
    // Remove old onboarding preferences for user
    this.userPreferences = this.userPreferences.filter((p) => p.user_id !== userId);
    const initialWeight = 5.0; // Section 9.1: 5.0 for explicit onboarding pick

    for (const catId of data.category_ids) {
      this.userPreferences.push({
        id: `pref-${uuidv4()}`,
        user_id: userId,
        type: 'category',
        ref_id: catId,
        weight: initialWeight,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    if (data.author_ids) {
      for (const authId of data.author_ids) {
        this.userPreferences.push({
          id: `pref-${uuidv4()}`,
          user_id: userId,
          type: 'author',
          ref_id: authId,
          weight: initialWeight,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    if (data.languages) {
      for (const lang of data.languages) {
        this.userPreferences.push({
          id: `pref-${uuidv4()}`,
          user_id: userId,
          type: 'language',
          ref_id: lang,
          weight: initialWeight,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    return { success: true, count: this.userPreferences.filter((p) => p.user_id === userId).length };
  }

  async getUserPreferences(userId: string) {
    return this.userPreferences.filter((p) => p.user_id === userId);
  }

  // Behavior Event Logging (Section 9.2 Stage 2)
  async logBehaviorEvent(userId: string, actionType: string, bookId?: string, metadata: any = {}) {
    const event = {
      id: `event-${uuidv4()}`,
      user_id: userId,
      book_id: bookId || null,
      action_type: actionType,
      metadata,
      created_at: new Date().toISOString(),
    };
    this.userBehaviorEvents.push(event);

    const weights: Record<string, number> = {
      purchase: 10,
      wishlist: 5,
      message: 4,
      search: 3,
      view: 2,
    };

    const addedWeight = weights[actionType] || 1;

    if (bookId) {
      const book = this.books.find((b) => b.id === bookId);
      if (book) {
        if (book.author_id) {
          const authPref = this.userPreferences.find((p) => p.user_id === userId && p.type === 'author' && p.ref_id === book.author_id);
          if (authPref) authPref.weight += addedWeight;
          else {
            this.userPreferences.push({
              id: `pref-${uuidv4()}`,
              user_id: userId,
              type: 'author',
              ref_id: book.author_id,
              weight: addedWeight,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        }

        const catLinks = this.bookCategories.filter((bc) => bc.book_id === bookId);
        for (const cl of catLinks) {
          const catPref = this.userPreferences.find((p) => p.user_id === userId && p.type === 'category' && p.ref_id === cl.category_id);
          if (catPref) catPref.weight += addedWeight;
          else {
            this.userPreferences.push({
              id: `pref-${uuidv4()}`,
              user_id: userId,
              type: 'category',
              ref_id: cl.category_id,
              weight: addedWeight,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        }
      }
    }

    return event;
  }

  // Personalized Recommendation Feed (Section 9.2 Stage 1: Rule-Based Scoring)
  // score = (category_match * 3) + (author_match * 4) + recency_score + popularity_score
  async getPersonalizedFeed(userId?: string, limit: number = 8) {
    const activeBooks = this.books.filter((b) => b.status === BookStatus.ACTIVE);

    if (!userId) {
      const trending = [...activeBooks].sort((a, b) => b.view_count - a.view_count).slice(0, limit);
      return trending.map((b) => this.hydrateBook(b));
    }

    const userPrefs = this.userPreferences.filter((p) => p.user_id === userId);
    if (userPrefs.length === 0) {
      const trending = [...activeBooks].sort((a, b) => b.view_count - a.view_count).slice(0, limit);
      return trending.map((b) => this.hydrateBook(b));
    }

    const prefCategoryMap = new Map<string, number>();
    const prefAuthorMap = new Map<string, number>();

    for (const p of userPrefs) {
      if (p.type === 'category') prefCategoryMap.set(p.ref_id, p.weight);
      if (p.type === 'author') prefAuthorMap.set(p.ref_id, p.weight);
    }

    const scored = activeBooks.map((b) => {
      let authorScore = 0;
      if (b.author_id && prefAuthorMap.has(b.author_id)) {
        authorScore = (prefAuthorMap.get(b.author_id) || 1) * 4;
      }

      let categoryScore = 0;
      const bCatIds = this.bookCategories.filter((bc) => bc.book_id === b.id).map((bc) => bc.category_id);
      for (const catId of bCatIds) {
        if (prefCategoryMap.has(catId)) {
          categoryScore += (prefCategoryMap.get(catId) || 1) * 3;
        }
      }

      const popularityScore = Math.min(10, (b.view_count || 0) / 10);
      const ageHours = (Date.now() - new Date(b.created_at).getTime()) / (1000 * 3600);
      const recencyScore = Math.max(0, 10 - ageHours / 24);

      const totalScore = categoryScore + authorScore + recencyScore + popularityScore;

      return {
        book: b,
        score: totalScore,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((s) => this.hydrateBook(s.book));
  }

  // Notifications (Section 9.2 Stage 3 & Section 7)
  async getNotifications(userId: string) {
    return this.notifications.filter((n) => n.user_id === userId);
  }

  async markNotificationRead(id: string, userId: string) {
    const notif = this.notifications.find((n) => n.id === id && n.user_id === userId);
    if (notif) notif.is_read = true;
    return notif;
  }

  async markAllNotificationsRead(userId: string) {
    this.notifications.filter((n) => n.user_id === userId).forEach((n) => (n.is_read = true));
    return { success: true };
  }

  async createNotification(userId: string, title: string, body: string, type: string = 'new_book_match', dataJson?: any) {
    const notif = {
      id: `notif-${uuidv4()}`,
      user_id: userId,
      type,
      title,
      body,
      data_json: dataJson || null,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    this.notifications.unshift(notif);
    return notif;
  }

  // --- Admin Moderation & Metrics ---
  async getPendingBooks() {
    return this.books
      .filter((b) => b.status === BookStatus.PENDING_REVIEW)
      .map((b) => this.hydrateBook(b));
  }

  async setBookStatus(id: string, status: BookStatus) {
    const book = this.books.find((b) => b.id === id);
    if (!book) return null;
    book.status = status;
    return this.hydrateBook(book);
  }

  async getAdminMetrics() {
    return {
      totalUsers: this.users.length,
      totalListings: this.books.filter((b) => b.status === BookStatus.ACTIVE).length,
      totalOrders: this.orders.length,
      gmv: this.orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
      totalShops: this.shops.length,
      pendingReviews: this.books.filter((b) => b.status === BookStatus.PENDING_REVIEW).length,
    };
  }

  async getReports() {
    return this.reports;
  }

  // --- Phase 3: Featured Ads (Section 10.1) ---
  getAdPackages(): AdPackage[] {
    return AD_PACKAGES;
  }

  async getAdPackage(packageId: FeaturedPackage): Promise<AdPackage | null> {
    return AD_PACKAGES.find((p) => p.id === packageId) || null;
  }

  async createFeaturedAd(userId: string, bookId: string, packageType: FeaturedPackage, paymentId?: string) {
    const book = this.books.find((b) => b.id === bookId);
    if (!book) throw new NotFoundException('বইটি পাওয়া যায়নি');
    if (book.seller_id !== userId) throw new BadRequestException('শুধুমাত্র বইটির বিক্রেতা ফিচার করতে পারবেন');

    const pkg = AD_PACKAGES.find((p) => p.id === packageType);
    if (!pkg) throw new BadRequestException('অবৈধ প্যাকেজ নির্বাচন');

    const now = new Date();
    const expiresAt = new Date(now.getTime() + pkg.duration_days * 24 * 3600 * 1000);

    const ad = {
      id: `ad-${uuidv4()}`,
      book_id: bookId,
      shop_id: book.shop_id || null,
      package_type: packageType,
      fee_paid: pkg.price,
      starts_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      status: FeaturedStatus.ACTIVE,
      payment_id: paymentId || null,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    this.featuredAds.push(ad);
    book.is_featured = true;
    return ad;
  }

  async checkExpiredAds() {
    const now = new Date();
    let expiredCount = 0;
    for (const ad of this.featuredAds) {
      if (ad.status === FeaturedStatus.ACTIVE && new Date(ad.expires_at) <= now) {
        ad.status = FeaturedStatus.EXPIRED;
        ad.updated_at = now.toISOString();
        expiredCount++;

        // If book has no other active ads, set is_featured = false
        if (ad.book_id) {
          const hasOtherActive = this.featuredAds.some(
            (other) => other.book_id === ad.book_id && other.status === FeaturedStatus.ACTIVE && new Date(other.expires_at) > now,
          );
          if (!hasOtherActive) {
            const book = this.books.find((b) => b.id === ad.book_id);
            if (book) book.is_featured = false;
          }
        }
      }
    }
    return { expiredCount };
  }

  async getActiveFeaturedAds(bookId?: string) {
    const now = new Date();
    return this.featuredAds.filter(
      (ad) =>
        ad.status === FeaturedStatus.ACTIVE &&
        new Date(ad.expires_at) > now &&
        (!bookId || ad.book_id === bookId),
    );
  }

  // --- Phase 3: Payments (Section 11) ---
  async createPaymentRecord(data: {
    order_id?: string;
    book_id?: string;
    ad_package?: FeaturedPackage;
    amount: number;
    provider: string;
    provider_transaction_id: string;
    status: string;
    raw_payload?: any;
  }) {
    const payment = {
      id: `pay-${uuidv4()}`,
      order_id: data.order_id || null,
      book_id: data.book_id || null,
      ad_package: data.ad_package || null,
      provider: data.provider,
      provider_transaction_id: data.provider_transaction_id,
      amount: data.amount,
      status: data.status,
      raw_payload: data.raw_payload || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.payments.push(payment);
    return payment;
  }

  async getPaymentByTransactionId(tranId: string) {
    return this.payments.find((p) => p.provider_transaction_id === tranId) || null;
  }

  async getPaymentById(id: string) {
    return this.payments.find((p) => p.id === id) || null;
  }

  async updatePaymentStatus(paymentId: string, status: string, rawPayload?: any) {
    const payment = this.payments.find((p) => p.id === paymentId);
    if (!payment) return null;

    // Idempotent: if already paid, return early with current state
    if (payment.status === 'paid' && status === 'paid') {
      return payment;
    }

    payment.status = status;
    if (rawPayload) payment.raw_payload = rawPayload;
    payment.updated_at = new Date().toISOString();

    if (status === 'paid') {
      // If for an order, update order status to confirmed and payment_status to paid
      if (payment.order_id) {
        const order = this.orders.find((o) => o.id === payment.order_id);
        if (order) {
          order.payment_status = PaymentStatus.PAID;
          if (order.order_status === OrderStatus.PENDING) {
            order.order_status = OrderStatus.CONFIRMED;
          }
        }
      }

      // If for a book featured ad, activate the ad
      if (payment.book_id && payment.ad_package) {
        const book = this.books.find((b) => b.id === payment.book_id);
        if (book) {
          const pkg = AD_PACKAGES.find((p) => p.id === payment.ad_package);
          const now = new Date();
          const expiresAt = new Date(now.getTime() + (pkg ? pkg.duration_days : 5) * 24 * 3600 * 1000);
          this.featuredAds.push({
            id: `ad-${uuidv4()}`,
            book_id: book.id,
            shop_id: book.shop_id || null,
            package_type: payment.ad_package,
            fee_paid: payment.amount,
            starts_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
            status: FeaturedStatus.ACTIVE,
            payment_id: payment.id,
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
          });
          book.is_featured = true;
        }
      }
    }

    return payment;
  }

  // --- Phase 3: Seller Wallet & 48h Dispute Balance Release (Section 10.2) ---
  async getOrCreateWallet(userId: string) {
    let wallet = this.sellerWallets.find((w) => w.user_id === userId);
    if (!wallet) {
      wallet = {
        id: `wallet-${uuidv4()}`,
        user_id: userId,
        shop_id: null,
        available_balance: 0,
        pending_balance: 0,
        updated_at: new Date().toISOString(),
      };
      this.sellerWallets.push(wallet);
    }
    return wallet;
  }

  async getWalletSummary(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);
    const transactions = this.walletTransactions
      .filter((t) => t.wallet_id === wallet.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const payoutRequests = this.payoutRequests
      .filter((p) => p.wallet_id === wallet.id)
      .sort((a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime());

    const totalWithdrawn = payoutRequests
      .filter((p) => p.status === PayoutStatus.PAID)
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      user_id: userId,
      available_balance: wallet.available_balance,
      pending_balance: wallet.pending_balance,
      total_withdrawn: totalWithdrawn,
      currency: 'BDT',
      transactions,
      payout_requests: payoutRequests,
    };
  }

  async releaseExpiredDisputes() {
    const now = new Date();
    let releasedCount = 0;
    let releasedAmount = 0;

    for (const order of this.orders) {
      if (
        order.order_status === OrderStatus.DELIVERED &&
        order.dispute_window_expires_at &&
        new Date(order.dispute_window_expires_at) <= now &&
        !order.escrow_released
      ) {
        // Check if there is an active dispute
        const hasOpenDispute = this.disputes.some(
          (d) => d.order_id === order.id && d.status === 'open',
        );
        if (!hasOpenDispute) {
          const earning = order.price - (order.platform_fee || 0);
          const wallet = await this.getOrCreateWallet(order.seller_id);

          wallet.pending_balance = Math.max(0, wallet.pending_balance - earning);
          wallet.available_balance += earning;
          wallet.updated_at = now.toISOString();

          order.escrow_released = true;
          releasedCount++;
          releasedAmount += earning;

          this.walletTransactions.push({
            id: `trx-${uuidv4()}`,
            wallet_id: wallet.id,
            amount: earning,
            type: 'credit_available',
            reference_id: order.id,
            description: `অর্ডার #${order.id.slice(0, 8)} এর ৪৮ ঘণ্টা বায়ার প্রোটেকশন উত্তীর্ণ - অর্থ ব্যালেন্সে যুক্ত হয়েছে`,
            created_at: now.toISOString(),
          });
        }
      }
    }

    return { releasedCount, releasedAmount };
  }

  async requestPayout(userId: string, data: PayoutRequestDto) {
    if (data.amount < 100) {
      throw new BadRequestException('সর্বনিম্ন উত্তোলন পরিমাণ ১০০ টাকা');
    }

    const wallet = await this.getOrCreateWallet(userId);
    if (wallet.available_balance < data.amount) {
      throw new BadRequestException('অপর্যাপ্ত উত্তোলনযোগ্য ব্যালেন্স');
    }

    wallet.available_balance -= data.amount;
    wallet.updated_at = new Date().toISOString();

    const payoutReq = {
      id: `payout-${uuidv4()}`,
      wallet_id: wallet.id,
      amount: data.amount,
      method: data.method,
      account_number: data.account_number,
      bank_name: data.bank_name || null,
      branch_name: data.branch_name || null,
      status: PayoutStatus.PENDING,
      requested_at: new Date().toISOString(),
      processed_at: null,
    };
    this.payoutRequests.unshift(payoutReq);

    this.walletTransactions.push({
      id: `trx-${uuidv4()}`,
      wallet_id: wallet.id,
      amount: data.amount,
      type: 'withdrawal',
      reference_id: payoutReq.id,
      description: `উত্তোলন অনুরোধ (${data.method.toUpperCase()} - ${data.account_number})`,
      created_at: new Date().toISOString(),
    });

    return payoutReq;
  }

  // --- Phase 3: Reviews & Ratings (Section 5 & 8) ---
  async createReview(buyerId: string, orderId: string, rating: number, comment?: string) {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new NotFoundException('অর্ডারটি পাওয়া যায়নি');
    if (order.buyer_id !== buyerId) throw new BadRequestException('শুধুমাত্র ক্রেতা রিভিউ প্রদান করতে পারবেন');
    if (order.order_status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('শুধুমাত্র ডেলিভারিকৃত অর্ডারে রিভিউ দেওয়া সম্ভব');
    }

    const alreadyReviewed = this.reviews.some((r) => r.order_id === orderId);
    if (alreadyReviewed) {
      throw new BadRequestException('এই অর্ডারে ইতিমধ্যে রিভিউ প্রদান করা হয়েছে');
    }

    if (rating < 1 || rating > 5) {
      throw new BadRequestException('রেটিং ১ থেকে ৫ এর মধ্যে হতে হবে');
    }

    const review = {
      id: `rev-${uuidv4()}`,
      order_id: orderId,
      reviewer_id: buyerId,
      reviewee_id: order.seller_id,
      rating: Math.round(rating),
      comment: comment || null,
      created_at: new Date().toISOString(),
    };

    this.reviews.unshift(review);

    // Recalculate seller ratings
    const sellerReviews = this.reviews.filter((r) => r.reviewee_id === order.seller_id);
    const total = sellerReviews.length;
    const sum = sellerReviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = Number((sum / total).toFixed(1));

    const seller = this.users.find((u) => u.id === order.seller_id);
    if (seller) {
      seller.rating_avg = avg;
      seller.rating_count = total;
    }

    return this.hydrateReview(review);
  }

  async getReviewsForUser(userId: string) {
    const userReviews = this.reviews.filter((r) => r.reviewee_id === userId);
    return userReviews.map((r) => this.hydrateReview(r));
  }

  async getReviewForOrder(orderId: string) {
    const rev = this.reviews.find((r) => r.order_id === orderId);
    return rev ? this.hydrateReview(rev) : null;
  }

  private hydrateReview(review: any) {
    const reviewer = this.users.find((u) => u.id === review.reviewer_id);
    const order = this.orders.find((o) => o.id === review.order_id);
    const book = order ? this.books.find((b) => b.id === order.book_id) : null;

    return {
      ...review,
      reviewer: reviewer
        ? {
            id: reviewer.id,
            name: reviewer.name,
            avatar_url: reviewer.avatar_url,
          }
        : null,
      order: order
        ? {
            id: order.id,
            book: book
              ? {
                  id: book.id,
                  title_en: book.title_en,
                  title_bn: book.title_bn,
                }
              : null,
          }
        : null,
    };
  }

  // --- Phase 4: Courier Integration (Section 12) ---
  calculateDeliveryFee(
    city: string = 'Dhaka',
    weightBucket: WeightBucket = WeightBucket.UNDER_300G,
    provider: CourierProvider = CourierProvider.PATHAO,
  ): DeliveryFeeEstimate {
    const isDhaka = city.toLowerCase().includes('dhaka') || city.includes('ঢাকা');
    let fee = isDhaka ? 60 : 120;
    if (weightBucket === WeightBucket.BETWEEN_300G_1KG) {
      fee += isDhaka ? 10 : 20;
    } else if (weightBucket === WeightBucket.OVER_1KG) {
      fee += isDhaka ? 30 : 40;
    }

    return {
      provider,
      inside_dhaka: isDhaka,
      delivery_fee: fee,
      estimated_delivery_hours: isDhaka ? 24 : 72,
    };
  }

  async createCourierParcel(data: CreateParcelDto) {
    const order = this.orders.find((o) => o.id === data.order_id);
    if (!order) throw new NotFoundException('অর্ডার পাওয়া যায়নি');

    const provider = data.courier_provider || CourierProvider.PATHAO;
    const prefix =
      provider === CourierProvider.PATHAO
        ? 'PT-DHK'
        : provider === CourierProvider.STEADFAST
        ? 'SF'
        : 'REDX';
    const trackingId = `${prefix}-${Date.now().toString().slice(-6)}${Math.floor(
      100 + Math.random() * 900,
    )}`;
    const consignmentId = `CN-${provider.toUpperCase()}-${uuidv4().slice(0, 8)}`;

    const estimate = this.calculateDeliveryFee(data.recipient_city, data.item_weight, provider);

    const now = new Date().toISOString();
    const parcel: any = {
      id: `parcel-${uuidv4()}`,
      order_id: data.order_id,
      courier_provider: provider,
      consignment_id: consignmentId,
      tracking_id: trackingId,
      status: CourierParcelStatus.PENDING_PICKUP,
      delivery_fee: estimate.delivery_fee,
      amount_to_collect:
        data.amount_to_collect !== undefined
          ? data.amount_to_collect
          : order.payment_status === PaymentStatus.PAID
          ? 0
          : order.total_amount,
      recipient_name: data.recipient_name,
      recipient_phone: data.recipient_phone,
      recipient_address: data.recipient_address,
      recipient_city: data.recipient_city || 'Dhaka',
      recipient_area: data.recipient_area || null,
      timeline: [
        {
          status: CourierParcelStatus.PENDING_PICKUP,
          title_bn: 'পার্সেল বুকিং গ্রহণ করা হয়েছে',
          title_en: 'Parcel Booking Created',
          description: `অর্ডার #${order.id.slice(0, 8)} এর জন্য ${provider.toUpperCase()} কুরিয়ারে বুকিং তৈরি হয়েছে।`,
          timestamp: now,
          location: 'Dhaka Hub',
        },
      ],
      created_at: now,
      updated_at: now,
    };

    this.courierParcels.unshift(parcel);

    // Update order with courier tracking
    order.courier_provider = provider;
    order.courier_tracking_id = trackingId;
    if (order.order_status === OrderStatus.PENDING) {
      order.order_status = OrderStatus.CONFIRMED;
    }
    order.updated_at = now;

    return parcel;
  }

  async getCourierParcelByTrackingId(trackingId: string) {
    return this.courierParcels.find((p) => p.tracking_id === trackingId) || null;
  }

  async getCourierParcelByOrderId(orderId: string) {
    return this.courierParcels.find((p) => p.order_id === orderId) || null;
  }

  async updateCourierParcelStatus(
    trackingId: string,
    status: CourierParcelStatus,
    location?: string,
    description?: string,
  ) {
    const parcel = this.courierParcels.find((p) => p.tracking_id === trackingId);
    if (!parcel) return null;

    parcel.status = status;
    const now = new Date().toISOString();
    parcel.updated_at = now;

    const statusTitleMap: Record<
      CourierParcelStatus,
      { bn: string; en: string; defaultDesc: string }
    > = {
      [CourierParcelStatus.PENDING_PICKUP]: {
        bn: 'পিকআপের অপেক্ষায়',
        en: 'Pending Pickup',
        defaultDesc: 'রাইডার বিক্রেতার ঠিকানা থেকে পার্সেল সংগ্রহের পথে রয়েছে।',
      },
      [CourierParcelStatus.PICKED_UP]: {
        bn: 'রাইডার পার্সেল সংগ্রহ করেছে',
        en: 'Picked Up by Rider',
        defaultDesc: 'পার্সেল সফলভাবে সংগ্রহ করা হয়েছে এবং হাবে পাঠানো হচ্ছে।',
      },
      [CourierParcelStatus.IN_TRANSIT]: {
        bn: 'পার্সেল পরিবহনে রয়েছে',
        en: 'In Transit',
        defaultDesc: 'পার্সেলটি আঞ্চলিক সর্টিং হাবের দিকে স্থানান্তরিত হচ্ছে।',
      },
      [CourierParcelStatus.OUT_FOR_DELIVERY]: {
        bn: 'ডেলিভারির জন্য বের হয়েছে',
        en: 'Out for Delivery',
        defaultDesc: 'ডেলিভারি রাইডার ক্রেতার ঠিকানায় রওনা দিয়েছেন।',
      },
      [CourierParcelStatus.DELIVERED]: {
        bn: 'পার্সেল ডেলিভারি সম্পন্ন',
        en: 'Delivered',
        defaultDesc:
          'ক্রেতা সফলভাবে বইটি গ্রহণ করেছেন। বায়ার প্রোটেকশন ৪৮ ঘণ্টা গণনা শুরু হয়েছে।',
      },
      [CourierParcelStatus.RETURNED]: {
        bn: 'পার্সেল রিটার্ন করা হয়েছে',
        en: 'Returned',
        defaultDesc: 'অনিবার্য কারণে পার্সেলটি বিক্রেতার কাছে ফেরত পাঠানো হচ্ছে।',
      },
      [CourierParcelStatus.CANCELLED]: {
        bn: 'বুকিং বাতিল করা হয়েছে',
        en: 'Cancelled',
        defaultDesc: 'কুরিয়ার বুকিং বাতিল করা হয়েছে।',
      },
    };

    const info = statusTitleMap[status] || {
      bn: status,
      en: status,
      defaultDesc: 'স্ট্যাটাস আপডেট করা হয়েছে',
    };

    parcel.timeline.push({
      status,
      title_bn: info.bn,
      title_en: info.en,
      description: description || info.defaultDesc,
      timestamp: now,
      location: location || parcel.recipient_city,
    });

    // Auto-progress order lifecycle based on courier events
    const order = this.orders.find((o) => o.id === parcel.order_id);
    if (order) {
      if (
        status === CourierParcelStatus.PICKED_UP ||
        status === CourierParcelStatus.IN_TRANSIT ||
        status === CourierParcelStatus.OUT_FOR_DELIVERY
      ) {
        if (
          order.order_status === OrderStatus.PENDING ||
          order.order_status === OrderStatus.CONFIRMED
        ) {
          order.order_status = OrderStatus.SHIPPED;
          order.courier_tracking_id = trackingId;
          order.updated_at = now;
        }
      } else if (status === CourierParcelStatus.DELIVERED) {
        // Automatically mark order DELIVERED, start 48-hour dispute window, credit escrow
        await this.updateOrderStatus(order.id, OrderStatus.DELIVERED, trackingId);
      }
    }

    return parcel;
  }

  // --- Phase 5: Merchant & Storefront Methods ---
  async getAllShops() {
    return this.shops.map((s) => {
      const bookCount = this.books.filter((b) => b.shop_id === s.id).length;
      return {
        ...s,
        total_listings: bookCount,
      };
    });
  }

  async getShopById(shopId: string) {
    const shop = this.shops.find((s) => s.id === shopId || s.slug === shopId);
    if (!shop) return null;
    const bookCount = this.books.filter((b) => b.shop_id === shop.id).length;
    return {
      ...shop,
      total_listings: bookCount,
    };
  }

  async getShopByUserId(userId: string) {
    const shop = this.shops.find((s) => s.user_id === userId);
    if (!shop) return null;
    const bookCount = this.books.filter((b) => b.shop_id === shop.id).length;
    return {
      ...shop,
      total_listings: bookCount,
    };
  }

  async updateShop(shopId: string, data: Partial<any>) {
    const shop = this.shops.find((s) => s.id === shopId);
    if (!shop) throw new NotFoundException('দোকান বা শপ পাওয়া যায়নি');
    Object.assign(shop, data);
    return shop;
  }

  async getBooksByShopId(shopId: string) {
    const rawBooks = this.books.filter((b) => b.shop_id === shopId && b.status === BookStatus.ACTIVE);
    return rawBooks.map((b) => this.hydrateBook(b));
  }

  findOrCreateAuthor(name: string) {
    const clean = (name || '').trim();
    if (!clean) return this.authors[0];

    const lower = clean.toLowerCase();
    const existing = this.authors.find(
      (a) =>
        a.name_bn.includes(clean) ||
        a.name_en.toLowerCase().includes(lower) ||
        (a.aliases || []).some((al: string) => al.toLowerCase().includes(lower)),
    );

    if (existing) return existing;

    const newAuthor = {
      id: `author-uuid-${uuidv4()}`,
      name_bn: clean,
      name_en: clean,
      bio_bn: `${clean}-এর গ্রন্থাবলি`,
      bio_en: `Author profile of ${clean}`,
      photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
      birth_year: null,
      death_year: null,
      aliases: [clean],
      is_featured: false,
    };
    this.authors.push(newAuthor);
    return newAuthor;
  }

  findOrCreateCategory(name: string) {
    const clean = (name || '').trim();
    if (!clean) return this.categories[0];

    const lower = clean.toLowerCase();
    const existing = this.categories.find(
      (c) =>
        c.name_bn.includes(clean) ||
        c.name_en.toLowerCase().includes(lower) ||
        c.slug.toLowerCase().includes(lower),
    );

    if (existing) return existing;

    const newCat = {
      id: `cat-uuid-${uuidv4()}`,
      name_bn: clean,
      name_en: clean,
      slug: clean.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      icon_url: 'book-open',
      parent_id: null,
      sort_order: this.categories.length + 1,
    };
    this.categories.push(newCat);
    return newCat;
  }

  async bulkCreateBooks(
    sellerId: string,
    shopId: string | null,
    items: Array<{
      isbn?: string;
      title_bn: string;
      title_en?: string;
      author: string;
      category: string;
      condition: BookCondition;
      price: number;
      original_price?: number;
      stock_count?: number;
      description?: string;
      shelf_location?: string;
    }>,
  ) {
    const now = new Date().toISOString();
    const createdBookIds: string[] = [];

    for (const item of items) {
      const author = this.findOrCreateAuthor(item.author);
      const category = this.findOrCreateCategory(item.category);
      const bookId = `book-uuid-${uuidv4()}`;

      const newBook = {
        id: bookId,
        seller_id: sellerId,
        shop_id: shopId || null,
        title_en: item.title_en || item.title_bn,
        title_bn: item.title_bn,
        author_id: author.id,
        publisher_id: null,
        description:
          item.description ||
          `ISBN: ${item.isbn || 'N/A'}. অবস্থা: ${item.condition}. তাক/লোকেশন: ${item.shelf_location || 'সাধারণ তাক'}`,
        condition: item.condition || BookCondition.GOOD,
        language: BookLanguage.BN,
        price: Number(item.price),
        original_price: item.original_price ? Number(item.original_price) : null,
        edition: null,
        publication_year: null,
        is_rare: false,
        is_featured: false,
        stock_count: item.stock_count || 1,
        status: BookStatus.ACTIVE,
        view_count: 0,
        weight_bucket: WeightBucket.UNDER_300G,
        created_at: now,
        updated_at: now,
      };

      this.books.unshift(newBook);
      createdBookIds.push(bookId);

      // Add default book image
      this.bookImages.push({
        id: `img-uuid-${uuidv4()}`,
        book_id: bookId,
        url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&q=80',
        sort_order: 0,
        is_primary: true,
        created_at: now,
      });

      // Link category
      this.bookCategories.push({
        id: `bc-uuid-${uuidv4()}`,
        book_id: bookId,
        category_id: category.id,
      });
    }

    return {
      imported_count: createdBookIds.length,
      book_ids: createdBookIds,
    };
  }
}
