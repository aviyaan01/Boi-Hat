import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/app_theme.dart';
import '../../data/models/book_model.dart';
import '../../providers/books_provider.dart';
import '../widgets/book_card.dart';

class SearchScreen extends StatefulWidget {
  final String? initialCategoryId;
  final String? initialTitle;

  const SearchScreen({super.key, this.initialCategoryId, this.initialTitle});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<BookModel> _results = [];
  bool _isSearching = false;
  String _selectedCondition = '';
  String? _selectedCategoryId;

  @override
  void initState() {
    super.initState();
    _selectedCategoryId = widget.initialCategoryId;
    _performSearch();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _performSearch() async {
    setState(() => _isSearching = true);
    final booksProvider = Provider.of<BooksProvider>(context, listen: false);
    final items = await booksProvider.searchBooks(
      _searchController.text.trim(),
      condition: _selectedCondition.isNotEmpty ? _selectedCondition : null,
      categoryId: _selectedCategoryId,
    );
    if (mounted) {
      setState(() {
        _results = items;
        _isSearching = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: widget.initialTitle != null
            ? Text(widget.initialTitle!)
            : const Text('বই অনুসন্ধান'),
      ),
      body: Column(
        children: [
          // Search Input Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: TextField(
              controller: _searchController,
              autofocus: widget.initialCategoryId == null,
              textInputAction: TextInputAction.search,
              onSubmitted: (_) => _performSearch(),
              decoration: InputDecoration(
                hintText: 'বইয়ের নাম বা লেখক লিখুন (Bangla / English)...',
                prefixIcon: const Icon(Icons.search, color: AppTheme.primary),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          _performSearch();
                        },
                      )
                    : null,
              ),
            ),
          ),

          // Condition filter chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Row(
              children: [
                FilterChip(
                  label: const Text('সকল কন্ডিশন'),
                  selected: _selectedCondition == '',
                  selectedColor: AppTheme.primaryContainer,
                  onSelected: (val) {
                    setState(() => _selectedCondition = '');
                    _performSearch();
                  },
                ),
                const SizedBox(width: 8),
                FilterChip(
                  label: const Text('নতুন মতো'),
                  selected: _selectedCondition == 'LIKE_NEW',
                  selectedColor: AppTheme.primaryContainer,
                  onSelected: (val) {
                    setState(() => _selectedCondition = val ? 'LIKE_NEW' : '');
                    _performSearch();
                  },
                ),
                const SizedBox(width: 8),
                FilterChip(
                  label: const Text('ভালো'),
                  selected: _selectedCondition == 'GOOD',
                  selectedColor: AppTheme.primaryContainer,
                  onSelected: (val) {
                    setState(() => _selectedCondition = val ? 'GOOD' : '');
                    _performSearch();
                  },
                ),
                const SizedBox(width: 8),
                FilterChip(
                  label: const Text('মোটামুটি'),
                  selected: _selectedCondition == 'ACCEPTABLE',
                  selectedColor: AppTheme.primaryContainer,
                  onSelected: (val) {
                    setState(() => _selectedCondition = val ? 'ACCEPTABLE' : '');
                    _performSearch();
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),

          // Search Status Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 4.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  _isSearching ? 'অনুসন্ধান চলছে...' : '${_results.length}টি বই পাওয়া গেছে',
                  style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                ),
              ],
            ),
          ),

          // Results Grid
          Expanded(
            child: _isSearching
                ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
                : _results.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.search_off, size: 64, color: Colors.grey.shade400),
                            const SizedBox(height: 12),
                            const Text(
                              'কোনো ফলাফল পাওয়া যায়নি',
                              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.textSecondary),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'অন্য কোনো নাম বা লেখকের বানান দিয়ে চেষ্টা করুন।',
                              style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                            ),
                          ],
                        ),
                      )
                    : GridView.builder(
                        padding: const EdgeInsets.all(16.0),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          childAspectRatio: 0.65,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                        ),
                        itemCount: _results.length,
                        itemBuilder: (context, index) {
                          return BookCard(book: _results[index]);
                        },
                      ),
          ),
        ],
      ),
    );
  }
}

