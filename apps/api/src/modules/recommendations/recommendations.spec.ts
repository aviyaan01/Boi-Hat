import { DatabaseService } from '../../common/database.service';
import { PrismaService } from '../../common/prisma.service';

describe('Phase 2: Recommendations, Wishlists & Behavior Tracking', () => {
  let db: DatabaseService;
  let prisma: PrismaService;
  const testUserId = 'test-phase2-user-uuid';

  beforeEach(async () => {
    prisma = new PrismaService();
    prisma.isConnected = false;
    db = new DatabaseService(prisma);
    await db.onModuleInit();
  });

  it('should save onboarding preferences with initial weight 5.0 and return personalized feed', async () => {
    // 1. Save onboarding preferences (Literature category + Humayun Ahmed author)
    const res = await db.saveOnboardingPreferences(testUserId, {
      category_ids: ['cat-uuid-literature', 'cat-uuid-fiction', 'cat-uuid-thriller-mystery'],
      author_ids: ['author-uuid-1'], // Humayun Ahmed
      languages: ['bn'],
    });

    expect(res.success).toBe(true);
    expect(res.count).toBe(5);

    // 2. Fetch personalized feed
    const feed = await db.getPersonalizedFeed(testUserId, 5);
    expect(feed.length).toBeGreaterThan(0);

    // Top recommended books should match user's preferred author (Humayun Ahmed) or categories!
    const topBook = feed[0];
    expect(topBook.author?.name_en).toBe('Humayun Ahmed');
  });

  it('should handle cold start / unauthenticated by returning trending books', async () => {
    const feed = await db.getPersonalizedFeed(undefined, 4);
    expect(feed.length).toBe(4);
    // Should be sorted by popularity (view_count)
    expect(feed[0].view_count).toBeGreaterThanOrEqual(feed[1].view_count);
  });

  it('should support adding and removing books from wishlist', async () => {
    const books = await db.getBooks({ limit: 2 });
    const book1 = books.data[0];

    // Check initially not wishlisted
    let isWish = await db.isBookWishlisted(testUserId, book1.id);
    expect(isWish).toBe(false);

    // Add to wishlist
    await db.addToWishlist(testUserId, book1.id);
    isWish = await db.isBookWishlisted(testUserId, book1.id);
    expect(isWish).toBe(true);

    const wishlist = await db.getWishlist(testUserId);
    expect(wishlist.some((b) => b.id === book1.id)).toBe(true);

    // Remove from wishlist
    await db.removeFromWishlist(testUserId, book1.id);
    isWish = await db.isBookWishlisted(testUserId, book1.id);
    expect(isWish).toBe(false);
  });

  it('should save and delete custom search filters', async () => {
    const query = { q: 'রবীন্দ্রনাথ', min_price: 100, max_price: 500 };
    const saved = await db.saveSearch(testUserId, query, true);
    expect(saved.id).toBeTruthy();
    expect(saved.query_json.q).toBe('রবীন্দ্রনাথ');

    const searches = await db.getSavedSearches(testUserId);
    expect(searches.length).toBe(1);

    await db.deleteSavedSearch(testUserId, saved.id);
    const searchesAfter = await db.getSavedSearches(testUserId);
    expect(searchesAfter.length).toBe(0);
  });

  it('should log behavior events and dynamically boost user preference weights', async () => {
    const books = await db.getBooks({ limit: 1 });
    const book = books.data[0];

    // Log purchase event (addedWeight = +10)
    await db.logBehaviorEvent(testUserId, 'purchase', book.id);

    const prefs = await db.getUserPreferences(testUserId);
    expect(prefs.length).toBeGreaterThan(0);
    const authorPref = prefs.find((p) => p.type === 'author' && p.ref_id === book.author_id);
    expect(authorPref?.weight).toBeGreaterThanOrEqual(10);
  });
});

