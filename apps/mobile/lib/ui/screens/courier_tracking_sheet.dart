import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/app_theme.dart';
import '../../data/models/order_model.dart';
import '../../providers/orders_provider.dart';

class CourierTrackingSheet extends StatelessWidget {
  final OrderModel order;

  const CourierTrackingSheet({super.key, required this.order});

  static void show(BuildContext context, OrderModel order) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => CourierTrackingSheet(order: order),
    );
  }

  int _currentStepIndex(String status) {
    switch (status.toUpperCase()) {
      case 'BOOKED':
        return 0;
      case 'PICKED_UP':
        return 1;
      case 'IN_TRANSIT':
        return 2;
      case 'OUT_FOR_DELIVERY':
        return 3;
      case 'DELIVERED':
        return 4;
      default:
        return 0;
    }
  }

  @override
  Widget build(BuildContext context) {
    final parcel = order.courierParcel;
    final currentStatus = parcel?.status ?? 'BOOKED';
    final stepIndex = _currentStepIndex(currentStatus);
    final trackingCode = parcel?.trackingCode ?? 'BH-TRK-${order.orderNumber}';
    final courierName = parcel?.courier ?? 'PATHAO';

    final milestones = [
      {'title': 'পার্সেল বুক করা হয়েছে', 'desc': 'বিক্রেতা কুরিয়ার পিকআপ শিডিউল করেছেন'},
      {'title': 'পিকআপ সম্পন্ন', 'desc': 'রাইডার বিক্রেতার কাছ থেকে বই সংগ্রহ করেছেন'},
      {'title': 'ট্রানজিটে আছে', 'desc': 'পার্সেলটি সেন্ট্রাল হাব হয়ে গন্তব্যের পথে চলছে'},
      {'title': 'ডেলিভারির জন্য বের হয়েছে', 'desc': 'ডেলিভারি হিরো আপনার ঠিকানায় রওনা হয়েছেন'},
      {'title': 'ডেলিভারি সম্পন্ন', 'desc': 'বইটি ক্রেতার হাতে হস্তান্তর করা হয়েছে'},
    ];

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: const Color(0xFFCBD5E1),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryContainer,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          courierName,
                          style: const TextStyle(
                            color: AppTheme.primaryDark,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'ট্র্যাকিং: $trackingCode',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'অর্ডার নং: #${order.orderNumber}',
                    style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                  ),
                ],
              ),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ],
          ),
          const Divider(height: 24),

          // Stepper Timeline
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: milestones.length,
            itemBuilder: (context, index) {
              final isPassed = index <= stepIndex;
              final isCurrent = index == stepIndex;
              final item = milestones[index];

              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Column(
                    children: [
                      Container(
                        width: 24,
                        height: 24,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: isPassed ? AppTheme.primary : const Color(0xFFE2E8F0),
                        ),
                        child: Icon(
                          isPassed ? Icons.check : Icons.circle,
                          size: 14,
                          color: isPassed ? Colors.white : const Color(0xFF94A3B8),
                        ),
                      ),
                      if (index < milestones.length - 1)
                        Container(
                          width: 2,
                          height: 36,
                          color: index < stepIndex ? AppTheme.primary : const Color(0xFFE2E8F0),
                        ),
                    ],
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 12.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item['title']!,
                            style: TextStyle(
                              fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
                              color: isPassed ? AppTheme.textPrimary : AppTheme.textSecondary,
                              fontSize: 14,
                            ),
                          ),
                          Text(
                            item['desc']!,
                            style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              );
            },
          ),

          const SizedBox(height: 12),
          // Sandbox Simulator Buttons
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.developer_mode, size: 16, color: AppTheme.accent),
                    SizedBox(width: 6),
                    Text(
                      'স্যান্ডবক্স কুরিয়ার সিমুলেটর (Live Webhook)',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppTheme.textPrimary),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 4,
                  children: [
                    ActionChip(
                      label: const Text('পিকআপ', style: TextStyle(fontSize: 11)),
                      onPressed: () async {
                        final nav = Navigator.of(context);
                        final ordersProvider = Provider.of<OrdersProvider>(context, listen: false);
                        await ordersProvider.simulateCourierStep(
                          trackingId: trackingCode,
                          status: 'PICKED_UP',
                          location: 'মিরপুর ঢাকা হাব',
                        );
                        nav.pop();
                      },
                    ),
                    ActionChip(
                      label: const Text('ট্রানজিট', style: TextStyle(fontSize: 11)),
                      onPressed: () async {
                        final nav = Navigator.of(context);
                        final ordersProvider = Provider.of<OrdersProvider>(context, listen: false);
                        await ordersProvider.simulateCourierStep(
                          trackingId: trackingCode,
                          status: 'IN_TRANSIT',
                          location: 'তেজগাঁও সেন্ট্রাল সর্টিং হাফ',
                        );
                        nav.pop();
                      },
                    ),
                    ActionChip(
                      label: const Text('ডেলিভারি সফল', style: TextStyle(fontSize: 11)),
                      onPressed: () async {
                        final nav = Navigator.of(context);
                        final ordersProvider = Provider.of<OrdersProvider>(context, listen: false);
                        await ordersProvider.simulateCourierStep(
                          trackingId: trackingCode,
                          status: 'DELIVERED',
                          location: 'গ্রাহকের ঠিকানা',
                        );
                        nav.pop();
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
