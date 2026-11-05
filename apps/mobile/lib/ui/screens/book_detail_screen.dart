import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import '../../core/app_theme.dart';
import '../../core/formatters.dart';
import '../../data/models/book_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/books_provider.dart';
import '../../providers/orders_provider.dart';
import 'auth_sheet.dart';

class BookDetailScreen extends StatefulWidget {
  final String bookId;
  final BookModel? initialBook;

  const BookDetailScreen({super.key, required this.bookId, this.initialBook});

  @override
  State<BookDetailScreen> createState() => _BookDetailScreenState();
}

class _BookDetailScreenState extends State<BookDetailScreen> {
  BookModel? _book;
  bool _isLoading = false;
  int _selectedImageIndex = 0;

  @override
  void initState() {
    super.initState();
    _book = widget.initialBook;
    _loadBookDetails();
  }

  Future<void> _loadBookDetails() async {
    if (_book == null) {
      setState(() => _isLoading = true);
    }
    final booksProvider = Provider.of<BooksProvider>(context, listen: false);
    final fetched = await booksProvider.fetchBookById(widget.bookId);
    if (fetched != null && mounted) {
      setState(() {
        _book = fetched;
        _isLoading = false;
      });
    }
  }

  void _showOrderDialog() {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    if (!auth.isAuthenticated) {
      AuthSheet.show(context);
      return;
    }

    final book = _book;
    if (book == null) return;

    final addressController = TextEditingController(text: 'ধানমন্ডি ২৭, ঢাকা - ১২০৯');
    String paymentMethod = 'COD';
    bool isOrdering = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final bottomInset = MediaQuery.of(context).viewInsets.bottom;
            final deliveryFee = 60.0;
            final totalAmount = book.price + deliveryFee;

            return Container(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: bottomInset + 20,
              ),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'অর্ডার নিশ্চিতকরণ',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.of(context).pop(),
                      ),
                    ],
                  ),
                  const Divider(),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: CachedNetworkImage(
                          imageUrl: book.primaryImageUrl,
                          width: 50,
                          height: 70,
                          fit: BoxFit.cover,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              book.titleBn,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              Formatters.formatPrice(book.price),
                              style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: addressController,
                    decoration: const InputDecoration(
                      labelText: 'ডেলিভারি ঠিকানা',
                      hintText: 'বাসা/রোড, এলাকা, থানা, জেলা',
                      prefixIcon: Icon(Icons.location_on, color: AppTheme.primary),
                    ),
                    maxLines: 2,
                  ),
                  const SizedBox(height: 16),
                  const Text('পেমেন্ট পদ্ধতি নির্বাচন করুন:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: ChoiceChip(
                          label: const Text('ক্যাশ অন ডেলিভারি'),
                          selected: paymentMethod == 'COD',
                          selectedColor: AppTheme.primaryContainer,
                          onSelected: (_) => setModalState(() => paymentMethod = 'COD'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ChoiceChip(
                          label: const Text('বিকাশ / নগদ (এসক্রো)'),
                          selected: paymentMethod == 'BKASH',
                          selectedColor: AppTheme.primaryContainer,
                          onSelected: (_) => setModalState(() => paymentMethod = 'BKASH'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('বইয়ের মূল্য', style: TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
                            Text(Formatters.formatPrice(book.price), style: const TextStyle(fontWeight: FontWeight.bold)),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('ডেলিভারি চার্জ (পাঠাও/রেডএক্স)', style: TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
                            Text(Formatters.formatPrice(deliveryFee), style: const TextStyle(fontWeight: FontWeight.bold)),
                          ],
                        ),
                        const Divider(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('সর্বমোট', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                            Text(
                              Formatters.formatPrice(totalAmount),
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.primary),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: isOrdering
                        ? null
                        : () async {
                            final addr = addressController.text.trim();
                            if (addr.isEmpty) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('ডেলিভারি ঠিকানা লিখুন')),
                              );
                              return;
                            }
                            setModalState(() => isOrdering = true);
                            final nav = Navigator.of(ctx);
                            final messenger = ScaffoldMessenger.of(ctx);
                            try {
                              final ordersProvider = Provider.of<OrdersProvider>(context, listen: false);
                              final order = await ordersProvider.createOrder(
                                bookId: book.id,
                                deliveryAddress: addr,
                                paymentMethod: paymentMethod,
                              );
                              nav.pop();
                              messenger.showSnackBar(
                                SnackBar(
                                  content: Text('অর্ডার সফল হয়েছে! ট্র্যাকিং নম্বর: ${order.orderNumber}'),
                                  backgroundColor: AppTheme.primary,
                                ),
                              );
                            } catch (e) {
                              setModalState(() => isOrdering = false);
                              messenger.showSnackBar(
                                SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))),
                              );
                            }
                          },
                    child: isOrdering
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Text('অর্ডার কনফার্ম করুন', style: TextStyle(fontSize: 15)),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final book = _book;

    if (_isLoading || book == null) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(color: AppTheme.primary),
        ),
      );
    }

    final images = book.images.isNotEmpty ? book.images.map((i) => i.url).toList() : [book.primaryImageUrl];

    return Scaffold(
      appBar: AppBar(
        title: Text(book.titleBn, maxLines: 1, overflow: TextOverflow.ellipsis),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.favorite_border),
            onPressed: () {},
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Gallery
            Container(
              height: 280,
              width: double.infinity,
              color: const Color(0xFFF1F5F9),
              child: Stack(
                alignment: Alignment.bottomCenter,
                children: [
                  PageView.builder(
                    itemCount: images.length,
                    onPageChanged: (i) => setState(() => _selectedImageIndex = i),
                    itemBuilder: (context, index) {
                      return CachedNetworkImage(
                        imageUrl: images[index],
                        fit: BoxFit.contain,
                      );
                    },
                  ),
                  if (images.length > 1)
                    Positioned(
                      bottom: 12,
                      child: Row(
                        children: List.generate(
                          images.length,
                          (i) => Container(
                            width: 8,
                            height: 8,
                            margin: const EdgeInsets.symmetric(horizontal: 3),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: _selectedImageIndex == i ? AppTheme.primary : const Color(0xFFCBD5E1),
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Badges
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryContainer,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          'কন্ডিশন: ${Formatters.conditionName(book.condition)}',
                          style: const TextStyle(color: AppTheme.primaryDark, fontWeight: FontWeight.bold, fontSize: 12),
                        ),
                      ),
                      if (book.isRare) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEF3C7),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            '⭐ অ্যান্টিক ও দুর্লভ সংকলন',
                            style: TextStyle(color: Color(0xFF92400E), fontWeight: FontWeight.bold, fontSize: 12),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Title & Price
                  Text(
                    book.titleBn,
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                  ),
                  if (book.titleEn != null && book.titleEn!.isNotEmpty)
                    Text(
                      book.titleEn!,
                      style: const TextStyle(fontSize: 14, color: AppTheme.textSecondary),
                    ),
                  const SizedBox(height: 12),

                  Row(
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
                    children: [
                      Text(
                        Formatters.formatPrice(book.price),
                        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppTheme.primary),
                      ),
                      if (book.originalPrice != null && book.originalPrice! > book.price) ...[
                        const SizedBox(width: 8),
                        Text(
                          Formatters.formatPrice(book.originalPrice!),
                          style: const TextStyle(
                            fontSize: 15,
                            color: Color(0xFF94A3B8),
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDCFCE7),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            '${(((book.originalPrice! - book.price) / book.originalPrice!) * 100).toInt()}% ছাড়',
                            style: const TextStyle(color: AppTheme.primaryDark, fontWeight: FontWeight.bold, fontSize: 11),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Divider(),

                  // Author card
                  if (book.author != null) ...[
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: CircleAvatar(
                        backgroundColor: AppTheme.primaryContainer,
                        child: Text(book.author!.nameBn.substring(0, 1), style: const TextStyle(color: AppTheme.primaryDark)),
                      ),
                      title: Text(book.author!.nameBn, style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: const Text('লেখক'),
                    ),
                    const Divider(),
                  ],

                  // Description
                  const Text('বইয়ের বিবরণ:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                  const SizedBox(height: 8),
                  Text(
                    book.description.isNotEmpty ? book.description : 'এই বইটির কোনো বিস্তারিত বিবরণ দেওয়া হয়নি।',
                    style: const TextStyle(fontSize: 14, color: Color(0xFF334155), height: 1.5),
                  ),
                  const SizedBox(height: 20),

                  // Escrow guarantee notice
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFECFDF5),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFA7F3D0)),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.verified_user, color: AppTheme.primary, size: 28),
                        SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'বই-হাট ৪৮ ঘণ্টা ক্রেতা সুরক্ষা',
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.primaryDark),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'বই হাতে পেয়ে চেক করার পর টাকা বিক্রেতার অ্যাকাউন্টে পৌঁছায়। কোনো ত্রুটি থাকলে ৪৮ ঘণ্টার মধ্যে রিফান্ড ক্লেইম করুন।',
                                style: TextStyle(fontSize: 11, color: Color(0xFF065F46)),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 80),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              flex: 2,
              child: OutlinedButton.icon(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('মেসেজিং ও দামাদামি উইন্ডো খুলছে...')),
                  );
                },
                icon: const Icon(Icons.chat_bubble_outline, color: AppTheme.primary),
                label: const Text('মেসেজ', style: TextStyle(color: AppTheme.primary)),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppTheme.primary),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 3,
              child: ElevatedButton.icon(
                onPressed: _showOrderDialog,
                icon: const Icon(Icons.shopping_bag_outlined),
                label: const Text('সরাসরি অর্ডার করুন', style: TextStyle(fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
