import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/books_provider.dart';
import '../widgets/book_card.dart';
import 'auth_sheet.dart';
import 'search_screen.dart';

class HomeScreen extends StatelessWidget {
  final VoidCallback onNavigateToSearch;

  const HomeScreen({super.key, required this.onNavigateToSearch});

  @override
  Widget build(BuildContext context) {
    final booksProvider = Provider.of<BooksProvider>(context);
    final auth = Provider.of<AuthProvider>(context);

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 16,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppTheme.primary,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.auto_stories, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 8),
            const Text(
              'বই-হাট',
              style: TextStyle(
                fontWeight: FontWeight.w900,
                color: AppTheme.primaryDark,
                fontSize: 22,
                letterSpacing: -0.5,
              ),
            ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 8),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Row(
              children: [
                Icon(Icons.location_on, color: AppTheme.primary, size: 14),
                SizedBox(width: 4),
                Text('ঢাকা', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                Icon(Icons.arrow_drop_down, color: AppTheme.textSecondary, size: 16),
              ],
            ),
          ),
          IconButton(
            icon: Icon(
              auth.isAuthenticated ? Icons.account_circle : Icons.login,
              color: AppTheme.primary,
            ),
            onPressed: () {
              if (!auth.isAuthenticated) {
                AuthSheet.show(context);
              } else {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('লগইন আছেন: ${auth.user?.displayName ?? auth.user?.phone}')),
                );
              }
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        color: AppTheme.primary,
        onRefresh: () => booksProvider.fetchHomeFeed(),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Search Bar Banner
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                child: GestureDetector(
                  onTap: onNavigateToSearch,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.03),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.search, color: AppTheme.primary),
                        SizedBox(width: 10),
                        Text(
                          'বইয়ের নাম, লেখক বা বিষয় খুঁজুন...',
                          style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // Categories Carousel
              if (booksProvider.categories.isNotEmpty) ...[
                const SizedBox(height: 8),
                SizedBox(
                  height: 40,
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    scrollDirection: Axis.horizontal,
                    itemCount: booksProvider.categories.length + 1,
                    itemBuilder: (context, index) {
                      if (index == 0) {
                        return Container(
                          margin: const EdgeInsets.only(right: 8),
                          child: Chip(
                            backgroundColor: AppTheme.primary,
                            label: const Text('সকল বই', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                          ),
                        );
                      }
                      final cat = booksProvider.categories[index - 1];
                      return Container(
                        margin: const EdgeInsets.only(right: 8),
                        child: ActionChip(
                          backgroundColor: Colors.white,
                          side: const BorderSide(color: Color(0xFFE2E8F0)),
                          label: Text(cat.nameBn, style: const TextStyle(fontSize: 12, color: AppTheme.textPrimary)),
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => SearchScreen(initialCategoryId: cat.id, initialTitle: cat.nameBn),
                              ),
                            );
                          },
                        ),
                      );
                    },
                  ),
                ),
              ],

              // Banner / Escrow announcement
              Container(
                margin: const EdgeInsets.all(16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF059669), Color(0xFF047857)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              'নিরাপদ কেনাবেচা',
                              style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'নীলক্ষেত ও সারা দেশের বইপ্রেমীদের মিলনমেলা',
                            style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'এসক্রো পেমেন্ট ও পাঠাও কুরিয়ারের মাধ্যমে ঘরে বসেই বই গ্রহণ করুন।',
                            style: TextStyle(color: Colors.white70, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Icon(Icons.shield_outlined, color: Colors.white, size: 48),
                  ],
                ),
              ),

              // Recommendations Section
              if (booksProvider.recommendedBooks.isNotEmpty) ...[
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 4.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'আপনার জন্য বাছাইকৃত বই',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                      ),
                      TextButton(
                        onPressed: onNavigateToSearch,
                        child: const Text('সব দেখুন', style: TextStyle(color: AppTheme.primary, fontSize: 13)),
                      ),
                    ],
                  ),
                ),
                SizedBox(
                  height: 230,
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    scrollDirection: Axis.horizontal,
                    itemCount: booksProvider.recommendedBooks.length,
                    itemBuilder: (context, index) {
                      final book = booksProvider.recommendedBooks[index];
                      return Container(
                        width: 140,
                        margin: const EdgeInsets.only(right: 12),
                        child: BookCard(book: book),
                      );
                    },
                  ),
                ),
              ],

              // Rare & Vintage Books Section
              if (booksProvider.rareBooks.isNotEmpty) ...[
                const SizedBox(height: 16),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 4.0),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF3C7),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Icon(Icons.stars, color: AppTheme.accent, size: 16),
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        'দুর্লভ ও অ্যান্টিক বই',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                      ),
                    ],
                  ),
                ),
                SizedBox(
                  height: 230,
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    scrollDirection: Axis.horizontal,
                    itemCount: booksProvider.rareBooks.length,
                    itemBuilder: (context, index) {
                      final book = booksProvider.rareBooks[index];
                      return Container(
                        width: 140,
                        margin: const EdgeInsets.only(right: 12),
                        child: BookCard(book: book),
                      );
                    },
                  ),
                ),
              ],

              // Recent Books Grid
              const SizedBox(height: 16),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16.0, vertical: 4.0),
                child: Text(
                  'সাম্প্রতিক বইসমূহ',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                ),
              ),

              if (booksProvider.isLoading && booksProvider.books.isEmpty)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(32.0),
                    child: CircularProgressIndicator(color: AppTheme.primary),
                  ),
                )
              else if (booksProvider.books.isEmpty)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(32.0),
                    child: Text('কোনো বই পাওয়া যায়নি'),
                  ),
                )
              else
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.65,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                    ),
                    itemCount: booksProvider.books.length,
                    itemBuilder: (context, index) {
                      final book = booksProvider.books[index];
                      return BookCard(book: book);
                    },
                  ),
                ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
