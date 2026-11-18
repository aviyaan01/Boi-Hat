import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/api_client.dart';
import '../../core/app_theme.dart';
import '../../providers/books_provider.dart';

class ServerConfigDialog extends StatefulWidget {
  const ServerConfigDialog({super.key});

  static Future<void> show(BuildContext context) {
    return showDialog(
      context: context,
      builder: (_) => const ServerConfigDialog(),
    );
  }

  @override
  State<ServerConfigDialog> createState() => _ServerConfigDialogState();
}

class _ServerConfigDialogState extends State<ServerConfigDialog> {
  late TextEditingController _urlController;
  bool _isTesting = false;
  bool? _testResult;
  String? _testMessage;

  @override
  void initState() {
    super.initState();
    _urlController = TextEditingController(text: ApiClient.baseUrl);
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  Future<void> _testConnection() async {
    setState(() {
      _isTesting = true;
      _testResult = null;
      _testMessage = null;
    });

    final target = _urlController.text.trim();
    final health = await ApiClient.checkHealth(target);

    if (mounted) {
      final isOk = health['status'] == 'ok';
      setState(() {
        _isTesting = false;
        _testResult = isOk;
        _testMessage = isOk
            ? '✓ সফল! HTTP ${health['statusCode']}, Latency: ${health['latencyMs']}ms, DB: ${health['db']}'
            : '✕ সংযোগ ব্যর্থ: ${health['error']}\n\nটিপস: পিসিতে "npm run dev:api" চলছে কি না, উইন্ডোজ ফায়ারওয়ালে পোর্ট 4000 এলাউ করা কি না অথবা "adb reverse tcp:4000 tcp:4000" করা হয়েছে কি না নিশ্চিত করুন।';
      });
    }
  }

  Future<void> _saveUrl() async {
    final target = _urlController.text.trim();
    await ApiClient.setCustomBaseUrl(target);
    if (mounted) {
      Provider.of<BooksProvider>(context, listen: false).fetchHomeFeed();
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('সার্ভার ইউআরএল সংরক্ষিত: ${ApiClient.baseUrl}'),
          backgroundColor: AppTheme.primary,
        ),
      );
    }
  }

  Future<void> _resetDefault() async {
    await ApiClient.resetToDefault();
    if (mounted) {
      setState(() {
        _urlController.text = ApiClient.baseUrl;
        _testResult = null;
        _testMessage = 'ডিফল্ট ইউআরএলে রিসেট করা হয়েছে: ${ApiClient.baseUrl}';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: const Row(
        children: [
          Icon(Icons.settings_ethernet, color: AppTheme.primary),
          SizedBox(width: 8),
          Text('সার্ভার আইপি কনফিগারেশন', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'কম্পিউটারের লোকাল আইপি পরিবর্তন হলে এখানে নতুন আইপি বা ইউআরএল লিখুন (Debug Only):',
              style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _urlController,
              decoration: const InputDecoration(
                labelText: 'API Base URL',
                hintText: 'http://192.168.1.107:4000',
                prefixIcon: Icon(Icons.link, color: AppTheme.primary),
              ),
            ),
            const SizedBox(height: 8),
            if (_testMessage != null)
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: _testResult == true ? const Color(0xFFDCFCE7) : const Color(0xFFFEE2E2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  _testMessage!,
                  style: TextStyle(
                    color: _testResult == true ? AppTheme.primaryDark : const Color(0xFFB91C1C),
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: _isTesting ? null : _testConnection,
              icon: _isTesting
                  ? const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.network_ping, size: 16),
              label: const Text('কানেকশন টেস্ট করুন (/health)', style: TextStyle(fontSize: 12)),
            ),
            const Divider(height: 24),
            const Text(
              'সেন্ট্রি (Sentry) মনিটরিং টেস্ট:',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 8),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF362D59),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 10),
              ),
              onPressed: () {
                throw StateError('This is test exception');
              },
              icon: const Icon(Icons.bug_report, size: 16),
              label: const Text('Verify Sentry Setup', style: TextStyle(fontSize: 12)),
            ),
          ],
        ),
      ),
      actions: [
        TextButton.icon(
          onPressed: _resetDefault,
          icon: const Icon(Icons.restore, size: 16),
          label: const Text('ডিফল্টে রিসেট', style: TextStyle(color: AppTheme.textSecondary)),
        ),
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('বাতিল'),
        ),
        ElevatedButton(
          onPressed: _saveUrl,
          child: const Text('সেভ করুন'),
        ),
      ],
    );
  }
}
