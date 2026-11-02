import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
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
} from '@boi-hat/shared-types';
import { CATEGORIES_SEED, AUTHORS_SEED, PUBLISHERS_SEED, SHOPS_SEED } from '../../prisma/seed/seedData';
import { generate160Books } from '../../prisma/seed/seedBooks';
import { v4 as uuidv4 } from 'uuid';

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

    return {
      ...b,
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

    return {
      data: paginated.map((b) => this.hydrateBook(b)),
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
    }
    order.updated_at = new Date().toISOString();
    return this.hydrateOrder(order);
  }

  private hydrateOrder(order: any) {
    const book = this.books.find((b) => b.id === order.book_id);
    const buyer = this.users.find((u) => u.id === order.buyer_id);
    const seller = this.users.find((u) => u.id === order.seller_id);
    return {
      ...order,
      book: book ? this.hydrateBook(book) : null,
      buyer: buyer ? { id: buyer.id, name: buyer.name, phone: buyer.phone } : null,
      seller: seller ? { id: seller.id, name: seller.name, phone: seller.phone } : null,
    };
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
}
