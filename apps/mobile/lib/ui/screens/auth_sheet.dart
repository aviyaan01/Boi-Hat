import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/app_theme.dart';
import '../../providers/auth_provider.dart';

class AuthSheet extends StatefulWidget {
  const AuthSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const AuthSheet(),
    );
  }

  @override
  State<AuthSheet> createState() => _AuthSheetState();
}

class _AuthSheetState extends State<AuthSheet> {
  final TextEditingController _phoneController = TextEditingController(text: '01700000001');
  final TextEditingController _otpController = TextEditingController();
  bool _otpSent = false;
  String? _devOtp;
  String? _localError;

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  String _formatPhoneNumber(String input) {
    String clean = input.replaceAll(RegExp(r'[^0-9]'), '');
    if (clean.startsWith('880')) {
      return '+$clean';
    } else if (clean.startsWith('0')) {
      return '+88$clean';
    } else {
      return '+880$clean';
    }
  }

  Future<void> _handleSendOtp() async {
    setState(() => _localError = null);
    final phone = _formatPhoneNumber(_phoneController.text.trim());
    try {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final devOtp = await auth.requestOtp(phone);
      setState(() {
        _otpSent = true;
        _devOtp = devOtp;
        if (devOtp != null) {
          _otpController.text = devOtp;
        }
      });
    } catch (e) {
      setState(() => _localError = e.toString().replaceAll('Exception: ', ''));
    }
  }

  Future<void> _handleVerifyOtp() async {
    setState(() => _localError = null);
    final phone = _formatPhoneNumber(_phoneController.text.trim());
    final code = _otpController.text.trim();
    if (code.length < 4) {
      setState(() => _localError = 'দয়া করে ওটিপি কোডটি লিখুন');
      return;
    }

    final auth = Provider.of<AuthProvider>(context, listen: false);
    final success = await auth.verifyOtp(phone, code);
    if (success && mounted) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('সফলভাবে লগইন হয়েছে!'),
          backgroundColor: AppTheme.primary,
        ),
      );
    }
  }

  Future<void> _handleQuickDevLogin() async {
    setState(() => _localError = null);
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final success = await auth.quickDevLogin(phone: '+8801700000001');
    if (success && mounted) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('টেস্ট অ্যাকাউন্টে লগইন সফল!'),
          backgroundColor: AppTheme.primary,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: bottomInset + 24,
      ),
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
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.primaryContainer,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.menu_book_rounded, color: AppTheme.primary, size: 28),
              ),
              const SizedBox(width: 12),
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'বই-হাট এ স্বাগতম',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                  ),
                  Text(
                    'মোবাইল নম্বর দিয়ে সাইন ইন বা রেজিস্ট্রেশন করুন',
                    style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 20),
          if (_localError != null || auth.errorMessage != null)
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFFEE2E2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                _localError ?? auth.errorMessage ?? '',
                style: const TextStyle(color: Color(0xFFB91C1C), fontSize: 12),
              ),
            ),
          if (!_otpSent) ...[
            TextField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: 'মোবাইল নম্বর',
                hintText: '017XXXXXXXX',
                prefixIcon: Icon(Icons.phone_android, color: AppTheme.primary),
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: auth.isLoading ? null : _handleSendOtp,
              child: auth.isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('ওটিপি পাঠান'),
            ),
          ] else ...[
            TextField(
              controller: _otpController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: '৬ ডিজিট ওটিপি কোড',
                hintText: '123456',
                prefixIcon: const Icon(Icons.security, color: AppTheme.primary),
                helperText: _devOtp != null ? 'স্যান্ডবক্স ওটিপি কোড: $_devOtp' : null,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: auth.isLoading ? null : _handleVerifyOtp,
              child: auth.isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('যাচাই ও প্রবেশ করুন'),
            ),
            TextButton(
              onPressed: () => setState(() => _otpSent = false),
              child: const Text('নম্বর পরিবর্তন করুন'),
            ),
          ],
          const SizedBox(height: 12),
          const Divider(),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: auth.isLoading ? null : _handleQuickDevLogin,
            icon: const Icon(Icons.flash_on, color: AppTheme.accent),
            label: const Text(
              '⚡ ১-ক্লিকে টেস্ট অ্যাকাউন্টে লগইন (Dev Mode)',
              style: TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.bold),
            ),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 12),
              side: const BorderSide(color: Color(0xFFCBD5E1)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ],
      ),
    );
  }
}

