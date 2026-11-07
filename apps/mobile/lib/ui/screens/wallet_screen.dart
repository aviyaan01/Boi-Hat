import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/app_theme.dart';
import '../../core/formatters.dart';
import '../../providers/auth_provider.dart';
import '../../providers/wallet_provider.dart';
import '../widgets/server_config_dialog.dart';
import 'auth_sheet.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      if (auth.isAuthenticated) {
        Provider.of<WalletProvider>(context, listen: false).fetchWallet();
      }
    });
  }

  void _showPayoutDialog() {
    final amountController = TextEditingController();
    final accountController = TextEditingController();
    String method = 'BKASH';
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final bottomInset = MediaQuery.of(context).viewInsets.bottom;

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
                        'টাকা উত্তোলন (Payout Request)',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.of(context).pop(),
                      ),
                    ],
                  ),
                  const Divider(),
                  const SizedBox(height: 8),

                  // Method Selection
                  Row(
                    children: [
                      Expanded(
                        child: ChoiceChip(
                          label: const Text('বিকাশ (bKash)'),
                          selected: method == 'BKASH',
                          selectedColor: AppTheme.primaryContainer,
                          onSelected: (_) => setModalState(() => method = 'BKASH'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ChoiceChip(
                          label: const Text('নগদ (Nagad)'),
                          selected: method == 'NAGAD',
                          selectedColor: AppTheme.primaryContainer,
                          onSelected: (_) => setModalState(() => method = 'NAGAD'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  TextField(
                    controller: amountController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'উত্তোলনের পরিমাণ (৳)',
                      hintText: 'যেমন: ৫০০',
                      prefixIcon: Icon(Icons.money, color: AppTheme.primary),
                    ),
                  ),
                  const SizedBox(height: 16),

                  TextField(
                    controller: accountController,
                    keyboardType: TextInputType.phone,
                    decoration: InputDecoration(
                      labelText: '$method মোবাইল নম্বর',
                      hintText: '01XXXXXXXXX',
                      prefixIcon: const Icon(Icons.phone_android, color: AppTheme.primary),
                    ),
                  ),
                  const SizedBox(height: 20),

                  ElevatedButton(
                    onPressed: isSubmitting
                        ? null
                        : () async {
                            final amt = double.tryParse(amountController.text.trim()) ?? 0;
                            final acc = accountController.text.trim();
                            if (amt <= 0 || acc.isEmpty) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('সঠিক পরিমাণ ও অ্যাকাউন্ট নম্বর দিন')),
                              );
                              return;
                            }
                            setModalState(() => isSubmitting = true);
                            final nav = Navigator.of(ctx);
                            final messenger = ScaffoldMessenger.of(ctx);
                            try {
                              final walletProvider = Provider.of<WalletProvider>(context, listen: false);
                              await walletProvider.requestPayout(
                                amount: amt,
                                method: method,
                                accountNumber: acc,
                              );
                              nav.pop();
                              messenger.showSnackBar(
                                const SnackBar(
                                  content: Text('উত্তোলনের আবেদন গৃহীত হয়েছে! ২৪ ঘণ্টার মধ্যে টাকা পৌঁছাবে।'),
                                  backgroundColor: AppTheme.primary,
                                ),
                              );
                            } catch (e) {
                              setModalState(() => isSubmitting = false);
                              messenger.showSnackBar(
                                SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))),
                              );
                            }
                          },
                    child: isSubmitting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Text('অনুরোধ নিশ্চিত করুন'),
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
    final auth = Provider.of<AuthProvider>(context);
    final walletProvider = Provider.of<WalletProvider>(context);

    if (!auth.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(title: const Text('ওয়ালেট ও প্রোফাইল')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.account_balance_wallet_outlined, size: 64, color: AppTheme.primary),
                const SizedBox(height: 16),
                const Text(
                  'ওয়ালেট দেখতে সাইন ইন করুন',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                const Text(
                  'আপনার বিক্রিত বইয়ের এসক্রো ব্যালেন্স ও সরাসরি বিকাশ পে-আউট পেতে সাইন ইন করুন।',
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

    final wallet = walletProvider.wallet;

    return Scaffold(
      appBar: AppBar(
        title: const Text('আমার ওয়ালেট ও প্রোফাইল'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_ethernet, color: AppTheme.primary),
            tooltip: 'সার্ভার আইপি কনফিগারেশন',
            onPressed: () => ServerConfigDialog.show(context),
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.red),
            tooltip: 'লগআউট',
            onPressed: () => auth.logout(),
          ),
        ],
      ),
      body: RefreshIndicator(
        color: AppTheme.primary,
        onRefresh: () => walletProvider.fetchWallet(),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // User Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 28,
                      backgroundColor: AppTheme.primaryContainer,
                      child: Text(
                        auth.user?.displayName.substring(0, 1) ?? 'U',
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            auth.user?.displayName ?? 'বই-হাট ইউজার',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            auth.user?.phone ?? '',
                            style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13),
                          ),
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFDCFCE7),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text(
                              '✓ ভেরিফায়েড সদস্য',
                              style: TextStyle(color: AppTheme.primaryDark, fontSize: 10, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Balances
              Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF059669), Color(0xFF10B981)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'উত্তোলনযোগ্য ব্যালেন্স',
                            style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            Formatters.formatPrice(wallet.balance),
                            style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFFD97706), Color(0xFFF59E0B)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'এসক্রো হোল্ড ব্যালেন্স',
                            style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            Formatters.formatPrice(wallet.pendingBalance),
                            style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Payout Button
              ElevatedButton.icon(
                onPressed: _showPayoutDialog,
                icon: const Icon(Icons.account_balance_outlined),
                label: const Text('বিকাশ / নগদ পে-আউট রিকোয়েস্ট পাঠান', style: TextStyle(fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
              const SizedBox(height: 24),

              // Transactions
              const Text(
                'লেনদেন ইতিহাস (Transactions)',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
              ),
              const SizedBox(height: 12),

              if (wallet.transactions.isEmpty)
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: const Center(
                    child: Text('এখনো কোনো লেনদেন রেকর্ড নেই', style: TextStyle(color: AppTheme.textSecondary)),
                  ),
                )
              else
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: wallet.transactions.length,
                  itemBuilder: (context, index) {
                    final tx = wallet.transactions[index];
                    final isCredit = tx.type == 'CREDIT' || tx.type == 'ESCROW_RELEASE';

                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: isCredit ? const Color(0xFFDCFCE7) : const Color(0xFFFEE2E2),
                          child: Icon(
                            isCredit ? Icons.arrow_downward : Icons.arrow_upward,
                            color: isCredit ? AppTheme.primaryDark : Colors.red,
                            size: 18,
                          ),
                        ),
                        title: Text(tx.description.isNotEmpty ? tx.description : tx.type, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                        subtitle: Text(
                          DateFormat('dd MMM yyyy, hh:mm a').format(tx.createdAt),
                          style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                        ),
                        trailing: Text(
                          '${isCredit ? "+" : "-"}${Formatters.formatPrice(tx.amount)}',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                            color: isCredit ? AppTheme.primaryDark : Colors.red,
                          ),
                        ),
                      ),
                    );
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }
}
