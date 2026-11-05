import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/app_theme.dart';
import '../../core/formatters.dart';
import '../../data/models/order_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/orders_provider.dart';
import 'auth_sheet.dart';
import 'courier_tracking_sheet.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      if (auth.isAuthenticated) {
        Provider.of<OrdersProvider>(context, listen: false).fetchMyOrders();
      }
    });
  }

  void _showDisputeDialog(OrderModel order) {
    final reasonController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: const Text('৪৮ ঘণ্টা ক্রেতা সুরক্ষা ক্লেইম'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('অর্ডার #${order.orderNumber} এর জন্য কী সমস্যা হয়েছে জানান:'),
              const SizedBox(height: 12),
              TextField(
                controller: reasonController,
                maxLines: 3,
                decoration: const InputDecoration(
                  hintText: 'যেমন: বইয়ের কন্ডিশন বর্ণনার সাথে মেলেনি, ছেঁড়া পাতা পাওয়া গেছে...',
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('বাতিল'),
            ),
            ElevatedButton(
              onPressed: () async {
                final reason = reasonController.text.trim();
                if (reason.isEmpty) return;
                Navigator.of(ctx).pop();
                try {
                  final ordersProvider = Provider.of<OrdersProvider>(context, listen: false);
                  await ordersProvider.raiseDispute(order.id, reason);
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('আপনার অভিযোগ গ্রহণ করা হয়েছে। টাকা এসক্রোতে সংরক্ষিত আছে।'),
                        backgroundColor: AppTheme.accent,
                      ),
                    );
                  }
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))),
                    );
                  }
                }
              },
              child: const Text('অভিযোগ দাখিল করুন'),
            ),
          ],
        );
      },
    );
  }

  String _statusLabel(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'অপেক্ষমাণ';
      case 'CONFIRMED':
        return 'নিশ্চিতকৃত';
      case 'SHIPPED':
        return 'ডেলিভারিতে আছে';
      case 'DELIVERED':
        return 'ডেলিভার্ড';
      case 'COMPLETED':
        return 'সম্পন্ন';
      case 'CANCELLED':
        return 'বাতিল';
      case 'DISPUTED':
        return 'অভিযোগ তদন্তাধীন';
      default:
        return status;
    }
  }

  Color _statusColor(String status) {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
      case 'COMPLETED':
        return AppTheme.primary;
      case 'SHIPPED':
      case 'CONFIRMED':
        return Colors.blue;
      case 'DISPUTED':
      case 'CANCELLED':
        return Colors.red;
      default:
        return AppTheme.accent;
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final ordersProvider = Provider.of<OrdersProvider>(context);

    if (!auth.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(title: const Text('আমার অর্ডারসমূহ')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.shopping_bag_outlined, size: 64, color: AppTheme.primary),
                const SizedBox(height: 16),
                const Text(
                  'অর্ডার দেখতে সাইন ইন করুন',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                const Text(
                  'আপনার ক্রয়কৃত বই এবং লাইভ কুরিয়ার ট্র্যাকিং দেখতে সাইন ইন করুন।',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppTheme.textSecondary),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => AuthSheet.show(context),
                  child: const Text('সাইন ইন করুন'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('আমার অর্ডারসমূহ'),
      ),
      body: RefreshIndicator(
        color: AppTheme.primary,
        onRefresh: () => ordersProvider.fetchMyOrders(),
        child: ordersProvider.isLoading && ordersProvider.orders.isEmpty
            ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
            : ordersProvider.orders.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.inventory_2_outlined, size: 64, color: Colors.grey.shade400),
                        const SizedBox(height: 12),
                        const Text('আপনার কোনো সক্রিয় অর্ডার নেই', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        const SizedBox(height: 4),
                        const Text('বই-হাট থেকে আপনার পছন্দের বই খুঁজে অর্ডার করুন।', style: TextStyle(color: AppTheme.textSecondary)),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16.0),
                    itemCount: ordersProvider.orders.length,
                    itemBuilder: (context, index) {
                      final order = ordersProvider.orders[index];
                      final statusColor = _statusColor(order.status);
                      final firstItem = order.items.isNotEmpty ? order.items.first : null;

                      return Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.04),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Order No & Status Chip
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    '#${order.orderNumber}',
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: statusColor.withValues(alpha: 0.12),
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Text(
                                      _statusLabel(order.status),
                                      style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 11),
                                    ),
                                  ),
                                ],
                              ),
                              const Divider(height: 20),

                              // Book Info
                              Row(
                                children: [
                                  Container(
                                    width: 48,
                                    height: 60,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF1F5F9),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Icon(Icons.book, color: AppTheme.primary, size: 28),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          firstItem?.title ?? 'বই-হাট অর্ডার আইটেম',
                                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          'মোট পরিশোধ: ${Formatters.formatPrice(order.totalAmount)} (${order.paymentMethod})',
                                          style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),

                              // Actions Row
                              Row(
                                children: [
                                  Expanded(
                                    child: OutlinedButton.icon(
                                      onPressed: () => CourierTrackingSheet.show(context, order),
                                      icon: const Icon(Icons.local_shipping_outlined, size: 16),
                                      label: const Text('কুরিয়ার ট্র্যাকিং', style: TextStyle(fontSize: 12)),
                                      style: OutlinedButton.styleFrom(
                                        padding: const EdgeInsets.symmetric(vertical: 8),
                                        side: const BorderSide(color: AppTheme.primary),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  if (order.status.toUpperCase() == 'DELIVERED')
                                    TextButton(
                                      onPressed: () => _showDisputeDialog(order),
                                      child: const Text('অভিযোগ / Dispute', style: TextStyle(color: Colors.red, fontSize: 12)),
                                    ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
      ),
    );
  }
}
