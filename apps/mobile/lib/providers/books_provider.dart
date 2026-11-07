import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../data/models/book_model.dart';

class BooksProvider extends ChangeNotifier {
  List<BookModel> _books = [];
  List<BookModel> _rareBooks = [];
  List<BookModel> _recommendedBooks = [];
  List<CategoryModel> _categories = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<BookModel> get books => _books;
  List<BookModel> get rareBooks => _rareBooks;
  List<BookModel> get recommendedBooks => _recommendedBooks;
  List<CategoryModel> get categories => _categories;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  BooksProvider() {
    fetchHomeFeed();
  }

  Future<void> fetchHomeFeed() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      // 1. Fetch categories
      try {
        final catData = await ApiClient.get('/categories/tree');
        if (catData is List) {
          _categories = catData.map((c) => CategoryModel.fromJson(c)).toList();
        }
      } catch (_) {}

      // 2. Fetch general books
      final booksData = await ApiClient.get('/books?limit=20');
      if (booksData is Map && booksData['items'] is List) {
        _books = (booksData['items'] as List).map((b) => BookModel.fromJson(b)).toList();
      } else if (booksData is List) {
        _books = booksData.map((b) => BookModel.fromJson(b)).toList();
      }

      // 3. Filter or fetch rare books
      _rareBooks = _books.where((b) => b.isRare).toList();
      if (_rareBooks.isEmpty) {
        try {
          final rareData = await ApiClient.get('/books?is_rare=true&limit=10');
          if (rareData is Map && rareData['items'] is List) {
            _rareBooks = (rareData['items'] as List).map((b) => BookModel.fromJson(b)).toList();
          }
        } catch (_) {}
      }

      // 4. Fetch recommendations
      try {
        final recData = await ApiClient.get('/recommendations/personalized?limit=8');
        if (recData is List) {
          _recommendedBooks = recData.map((b) => BookModel.fromJson(b)).toList();
        } else if (recData is Map && recData['items'] is List) {
          _recommendedBooks = (recData['items'] as List).map((b) => BookModel.fromJson(b)).toList();
        }
      } catch (_) {
        _recommendedBooks = _books.take(6).toList();
      }

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
    }
  }

  Future<List<BookModel>> searchBooks(
    String query, {
    String? condition,
    String? categoryId,
    double? minPrice,
    double? maxPrice,
  }) async {
    try {
      String endpoint = '/books?q=${Uri.encodeComponent(query)}';
      if (condition != null && condition.isNotEmpty) {
        endpoint += '&condition=$condition';
      }
      if (categoryId != null && categoryId.isNotEmpty) {
        endpoint += '&category_id=$categoryId';
      }
      if (minPrice != null) {
        endpoint += '&min_price=$minPrice';
      }
      if (maxPrice != null) {
        endpoint += '&max_price=$maxPrice';
      }

      final res = await ApiClient.get(endpoint);
      if (res is Map && res['items'] is List) {
        return (res['items'] as List).map((b) => BookModel.fromJson(b)).toList();
      } else if (res is List) {
        return res.map((b) => BookModel.fromJson(b)).toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<BookModel?> fetchBookById(String id) async {
    try {
      final res = await ApiClient.get('/books/$id');
      if (res is Map<String, dynamic>) {
        return BookModel.fromJson(res);
      }
    } catch (_) {}
    return null;
  }

  Future<BookModel> postBook(Map<String, dynamic> data) async {
    final res = await ApiClient.post('/books', data);
    final newBook = BookModel.fromJson(res);
    _books.insert(0, newBook);
    notifyListeners();
    return newBook;
  }
}

