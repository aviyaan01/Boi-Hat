import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:sentry_flutter/sentry_flutter.dart';
import 'core/api_client.dart';
import 'core/app_theme.dart';
import 'providers/auth_provider.dart';
import 'providers/books_provider.dart';
import 'providers/orders_provider.dart';
import 'providers/wallet_provider.dart';
import 'ui/screens/main_nav_screen.dart';

// Sentry DSN for org: anvvi, project: boi-hat
// Can be configured via --dart-define=SENTRY_DSN=... or updated directly
const String kSentryDsn = String.fromEnvironment(
  'SENTRY_DSN',
  defaultValue: '',
);

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiClient.init();
  ApiClient.pingHealthInBackground();

  runApp(const BoiHatApp());

  await SentryFlutter.init(
    (options) {
      options.dsn = kSentryDsn;
      // Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing.
      options.tracesSampleRate = 1.0;
    },
    appRunner: () => runApp(
      DefaultAssetBundle(
        bundle: SentryAssetBundle(),
        child: const BoiHatApp(),
      ),
    ),
  );
}

class BoiHatApp extends StatelessWidget {
  const BoiHatApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => BooksProvider()),
        ChangeNotifierProvider(create: (_) => OrdersProvider()),
        ChangeNotifierProvider(create: (_) => WalletProvider()),
      ],
      child: MaterialApp(
        title: 'বই-হাট (Boi-Hat)',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        builder: (context, child) {
          return ValueListenableBuilder<bool>(
            valueListenable: ApiClient.isServerWaking,
            builder: (context, isWaking, _) {
              return Stack(
                children: [
                  ?child,
                  if (isWaking)
                    Positioned(
                      top: MediaQuery.of(context).padding.top + 8,
                      left: 16,
                      right: 16,
                      child: Material(
                        color: Colors.transparent,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                          decoration: BoxDecoration(
                            color: const Color(0xFF1E293B).withValues(alpha: 0.95),
                            borderRadius: BorderRadius.circular(8),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.2),
                                blurRadius: 8,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: const Row(
                            children: [
                              SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF34D399)),
                                ),
                              ),
                              SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  'সার্ভার চালু হচ্ছে, একটু অপেক্ষা করুন...',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                ],
              );
            },
          );
        },
        home: const MainNavScreen(),
      ),
    );
  }
}
